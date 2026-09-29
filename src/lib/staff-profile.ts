import { supabase } from "@/integrations/supabase/client";

/** Create a private staff profile after the first confirmed sign-in. */
export async function ensureStaffProfile() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return;

  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (readError || existing) return;

  const displayName = typeof user.user_metadata?.["full_name"] === "string"
    ? user.user_metadata["full_name"].trim() : "";
  await supabase.from("profiles").upsert({ id: user.id, display_name: displayName });
}