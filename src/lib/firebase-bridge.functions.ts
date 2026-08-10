import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Exchanges a verified Firebase ID token for a backend session token.
 * Firebase owns sign-in; the backend session keeps database/storage rules working.
 */
export const exchangeFirebaseToken = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ idToken: z.string().min(10) }).parse(input))
  .handler(async ({ data }) => {
    const apiKey = "AIzaSyAwM3pxWArfz5X2zbdYvVcXl7JfIakLa4o";

    const lookup = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken: data.idToken }),
      },
    );

    if (!lookup.ok) throw new Error("Invalid Firebase session");
    const payload = (await lookup.json()) as {
      users?: Array<{ email?: string; displayName?: string; emailVerified?: boolean }>;
    };
    const fbUser = payload.users?.[0];
    const email = fbUser?.email;
    if (!email) throw new Error("Firebase account has no email address");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const makeLink = () =>
      supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });

    let { data: link, error } = await makeLink();

    if (error) {
      const created = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fbUser?.displayName ?? email, provider: "firebase" },
      });
      if (created.error) throw new Error(created.error.message);
      ({ data: link, error } = await makeLink());
      if (error) throw new Error(error.message);
    }

    const tokenHash = link?.properties?.hashed_token;
    if (!tokenHash) throw new Error("Could not establish a session");

    return { tokenHash, email };
  });
