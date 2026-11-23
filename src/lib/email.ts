export async function sendTransactionalEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "ReelTrack <noreply@reeltrack.app>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[reeltrack:email]", { to, subject, html });
    }
    return { delivered: false, logged: process.env.NODE_ENV === "development" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    throw new Error("We couldn't send that email right now.");
  }

  return { delivered: true, logged: false };
}

export function isTransactionalEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function verificationEmailHtml(url: string) {
  return `<p>Confirm your ReelTrack account.</p><p><a href="${url}">Verify email</a></p>`;
}

export function resetEmailHtml(url: string) {
  return `<p>Reset your ReelTrack password.</p><p><a href="${url}">Choose a new password</a></p>`;
}
