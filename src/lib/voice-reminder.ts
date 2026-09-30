import { doc, updateDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  DAYS,
  type Appointment,
  type LanguageCode,
} from "./clinic-store";

/** Multilingual Voice Scripts tailored for dental appointment reminders */
export const VOICE_SCRIPTS: Record<
  LanguageCode,
  (appt: { patient: string; day: string; time: string; treatment: string }) => string
> = {
  EN: (a) =>
    `Hello ${a.patient}. This is an automated reminder from HMIS Dental Clinic. You have a dental appointment scheduled for tomorrow, ${a.day} at ${a.time} for ${a.treatment}. Please press 1 to confirm your attendance, or call us back to reschedule. Thank you!`,
  KN: (a) =>
    `ನಮಸ್ಕಾರ ${a.patient}. ಇದು HMIS ಡೆಂಟಲ್ ಕ್ಲಿನಿಕ್‌ನಿಂದ ಸ್ವಯಂಚಾಲಿತ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಜ್ಞಾಪನೆ. ನಾಳೆ, ${a.day} ರಂದು ${a.time} ಗಂಟೆಗೆ ${a.treatment} ಗಾಗಿ ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಿಗದಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹಾಜರಾತಿಯನ್ನು ಖಚಿತಪಡಿಸಲು 1 ಒತ್ತಿರಿ. ಧನ್ಯವಾದಗಳು!`,
  HI: (a) =>
    `नमस्ते ${a.patient}। यह एचएमआईएस डेंटल क्लिनिक से आपका स्वचालित अपॉइंटमेंट रिमाइंडर है। आपका अपॉइंटमेंट कल ${a.day} को ${a.time} बजे ${a.treatment} के लिए निर्धारित है। कृपया अपनी उपस्थिति की पुष्टि के लिए 1 दबाएं। धन्यवाद!`,
  ES: (a) =>
    `Hola ${a.patient}. Este es un recordatorio automático de HMIS Dental Clinic. Tiene una cita programada para mañana, ${a.day} a las ${a.time} para ${a.treatment}. Por favor presione 1 para confirmar su asistencia. ¡Gracias!`,
  ZH: (a) =>
    `您好 ${a.patient}。这是来自 HMIS 牙科诊所的自动预约提醒。您预约了明天 ${a.day} ${a.time} 进行 ${a.treatment}。请按 1 确认您的出席。谢谢！`,
  PT: (a) =>
    `Olá ${a.patient}. Este é um lembrete automático da Clínica Dentária HMIS. Você tem uma consulta agendada para amanhã, ${a.day} às ${a.time} para ${a.treatment}. Por favor pressione 1 para confirmar sua presença. Obrigado!`,
};

export const BCP47_LANG_CODES: Record<LanguageCode, string> = {
  EN: "en-US",
  KN: "kn-IN",
  HI: "hi-IN",
  ES: "es-ES",
  ZH: "zh-CN",
  PT: "pt-BR",
};

let activeUtterance: SpeechSynthesisUtterance | null = null;

/** Synthesize and speak the reminder using the browser's SpeechSynthesis engine */
export function playVoiceReminder(
  appt: { patient: string; day: string; time: string; treatment: string; language: LanguageCode },
  onEnd?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  // Cancel any ongoing speech and ensure synthesis is active
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();

  const script = VOICE_SCRIPTS[appt.language]?.(appt) || VOICE_SCRIPTS.EN(appt);
  const utterance = new SpeechSynthesisUtterance(script);
  activeUtterance = utterance; // Keep reference to prevent Chrome garbage collection mid-speech

  utterance.lang = BCP47_LANG_CODES[appt.language] || "en-US";
  utterance.rate = 0.92; // Clear telephone pace
  utterance.pitch = 1.0;

  // Attempt to select a voice matching the target language
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn("[VoiceReminder] Speech error or canceled:", e);
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  // Small timeout to allow cancel() to clear cleanly in Chromium
  setTimeout(() => {
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }, 50);

  return true;
}

/** Stop any currently playing voice speech */
export function stopVoiceReminder() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/** Returns appointments that are scheduled for tomorrow ("1 day before") */
export function get1DayBeforeAppointments(appointments: Appointment[]): Appointment[] {
  const tomorrowString = DAYS[1]; // DAYS[0] is today, DAYS[1] is tomorrow
  return appointments.filter(
    (a) => a.day === tomorrowString && (a.status === "scheduled" || a.status === "retrying")
  );
}

function getFormattedTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * Execute automated voice call workflow for an appointment.
 * 1. Sets status to "calling"
 * 2. Logs attempt with phone number and language
 * 3. Plays audio synthesizer (if in active browser)
 * 4. Resolves with confirmed (delivered) or no answer (retrying/failed)
 */
export async function executeVoiceCall(
  appt: Appointment,
  options?: {
    forcedOutcome?: "confirmed" | "no_answer" | "busy";
    speakAloud?: boolean;
  }
): Promise<{ success: boolean; status: "delivered" | "retrying" | "failed" }> {
  const timeNow = getFormattedTime();
  const langLabel = appt.language;
  const targetPhone = appt.phone || "patient phone";

  // Step 1: Update status to "calling"
  const dialingAttempt = {
    at: timeNow,
    outcome: `Calling ${targetPhone} (${langLabel} voice reminder)`,
  };
  const newAttempts = [...appt.attempts, dialingAttempt];

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "appointments", appt.id), {
        status: "calling",
        attempts: newAttempts,
      });
    } catch (err) {
      console.warn("[VoiceReminder] Firestore update error:", err);
    }
  }

  // Step 2: Speak audio if enabled
  if (options?.speakAloud) {
    playVoiceReminder(appt);
  }

  // Step 3: Simulate carrier dialing / voice response delay
  await new Promise((resolve) => setTimeout(resolve, 2600));

  // Determine outcome
  const willConfirm =
    options?.forcedOutcome === "confirmed"
      ? true
      : options?.forcedOutcome === "no_answer" || options?.forcedOutcome === "busy"
      ? false
      : Math.random() > 0.3; // 70% success rate on automated reminders

  const outcomeText = willConfirm
    ? "Answered — confirmed via keypad [1]"
    : options?.forcedOutcome === "busy"
    ? "Line busy — no response"
    : "No answer / voicemail reached";

  const completedAttempts = [
    ...appt.attempts,
    {
      at: getFormattedTime(),
      outcome: outcomeText,
    },
  ];

  let nextStatus: "delivered" | "retrying" | "failed" = "delivered";
  if (!willConfirm) {
    nextStatus = completedAttempts.length >= appt.maxAttempts ? "failed" : "retrying";
  }

  // Step 4: Save final status in Firestore
  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, "appointments", appt.id), {
        status: nextStatus,
        attempts: completedAttempts,
      });
    } catch (err) {
      console.warn("[VoiceReminder] Firestore final update error:", err);
    }
  }

  return { success: willConfirm, status: nextStatus };
}
