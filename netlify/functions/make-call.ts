// Netlify Serverless Function to place real outbound phone calls via Twilio Voice API

interface CallPayload {
  to: string;
  patient: string;
  day: string;
  time: string;
  treatment: string;
  language: "KN" | "HI" | "EN" | "ES" | "ZH" | "PT";
}

const VOICE_TEXT: Record<string, (p: CallPayload) => string> = {
  KN: (p) =>
    `ನಮಸ್ಕಾರ ${p.patient}. ಇದು ಲೋಕಾಪುರ ಡೆಂಟಲ್ ಕ್ಲಿನಿಕ್‌ನಿಂದ ಸ್ವಯಂಚಾಲಿತ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಜ್ಞಾಪನೆ. ನಾಳೆ, ${p.day} ರಂದು ${p.time} ಗಂಟೆಗೆ ${p.treatment} ಗಾಗಿ ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಿಗದಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹಾಜರಾತಿಯನ್ನು ಖಚಿತಪಡಿಸಲು 1 ಒತ್ತಿರಿ. ಧನ್ಯವಾದಗಳು!`,
  HI: (p) =>
    `नमस्ते ${p.patient}। यह लोकपुर डेंटल क्लिनिक से आपका स्वचालित अपॉइंटमेंट रिमाइंडर है। आपका अपॉइंटमेंट कल ${p.day} को ${p.time} बजे ${p.treatment} के लिए निर्धारित है। कृपया अपनी उपस्थिति की पुष्टि के लिए 1 दबाएं। धन्यवाद!`,
  EN: (p) =>
    `Hello ${p.patient}. This is an automated appointment reminder from Lokapur Dental Clinic. You have a dental appointment scheduled for tomorrow, ${p.day} at ${p.time} for ${p.treatment}. Please press 1 to confirm your attendance. Thank you!`,
  ES: (p) =>
    `Hola ${p.patient}. Este es un recordatorio automático de Lokapur Dental Clinic. Tiene una cita programada para mañana, ${p.day} a las ${p.time} para ${p.treatment}. Por favor presione 1 para confirmar su asistencia. ¡Gracias!`,
};

const TWILIO_VOICE_CONFIG: Record<string, { voice: string; lang: string }> = {
  KN: { voice: "Polly.Aditi", lang: "kn-IN" },
  HI: { voice: "Polly.Aditi", lang: "hi-IN" },
  EN: { voice: "Polly.Aditi", lang: "en-IN" },
  ES: { voice: "Polly.Conchita", lang: "es-ES" },
};

export default async (req: Request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers,
    });
  }

  try {
    const payload = (await req.json()) as CallPayload;
    const { to, patient, day, time, treatment, language } = payload;

    if (!to || !patient) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to (phone) and patient are required." }),
        { status: 400, headers }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          mode: "mock_fallback",
          message:
            "Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are not set in Netlify environment variables yet. Voice message played in browser simulator.",
        }),
        { status: 200, headers }
      );
    }

    // Format phone number (ensure + prefix if missing)
    let formattedTo = to.replace(/[\s-]/g, "");
    if (!formattedTo.startsWith("+")) {
      // Default to India (+91) if 10 digits
      if (formattedTo.length === 10) {
        formattedTo = "+91" + formattedTo;
      } else {
        formattedTo = "+" + formattedTo;
      }
    }

    const langConfig = TWILIO_VOICE_CONFIG[language] || TWILIO_VOICE_CONFIG.EN;
    const messageScript = (VOICE_TEXT[language] || VOICE_TEXT.EN)({
      to,
      patient,
      day,
      time,
      treatment,
      language,
    });

    // Build TwiML instruction for the call
    const twiml = `
      <Response>
        <Say voice="${langConfig.voice}" language="${langConfig.lang}">${messageScript}</Say>
        <Gather numDigits="1" timeout="10" finishOnKey="#">
          <Say voice="${langConfig.voice}" language="${langConfig.lang}">ದಯವಿಟ್ಟು ಖಚಿತಪಡಿಸಲು 1 ಒತ್ತಿರಿ.</Say>
        </Gather>
        <Say voice="${langConfig.voice}" language="${langConfig.lang}">ಧನ್ಯವಾದಗಳು. ನಿಮಗಾಗಿ ಕಾಯುತ್ತಿದ್ದೇವೆ.</Say>
      </Response>
    `.trim();

    // Make request to Twilio Calls API
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const params = new URLSearchParams();
    params.append("To", formattedTo);
    params.append("From", fromPhone);
    params.append("Twiml", twiml);

    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const twilioResponse = await fetch(twilioEndpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("[Twilio Error]", twilioData);
      return new Response(
        JSON.stringify({
          success: false,
          error: twilioData.message || "Twilio call initiation failed",
          details: twilioData,
        }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: "real_twilio_call",
        callSid: twilioData.sid,
        status: twilioData.status,
        to: formattedTo,
        message: `Real telecom phone call dispatched to ${formattedTo} via Twilio!`,
      }),
      { status: 200, headers }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers }
    );
  }
};
