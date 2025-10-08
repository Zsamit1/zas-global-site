// functions/contact.js

// Quick GET so you can verify the route is deployed:
export const onRequestGet = () =>
  new Response(JSON.stringify({ ok: true, route: "/contact" }), {
    headers: { "content-type": "application/json" }
  });

// Actual POST handler (form submit)
export const onRequestPost = async ({ request }) => {
  try {
    const { name, email, message, website } = await request.json();

    // Honeypot + validation
    if (website) return json({ success: true }); // bot trap
    if (!name || !email || !message)
      return json({ success: false, error: "Missing fields" }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return json({ success: false, error: "Invalid email" }, 400);

    const ip = request.headers.get("CF-Connecting-IP") || "";
    const now = new Date().toISOString();

    // Send via MailChannels (Cloudflare-supported)
    const resp = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        personalizations: [
          { to: [{ email: "info@zasgloballlc.com", name: "ZAS Global LLC" }] }
        ],
        // Sender must be on YOUR domain. Use your real Workspace mailbox:
        from: { email: "zasgloballlc@zasgloballlc.com", name: "ZAS Global Website" },
        // When you hit Reply in Gmail, it replies to the visitor:
        reply_to: { email, name },
        subject: `Website contact from ${name}`,
        content: [
          {
            type: "text/plain",
            value:
`Name: ${name}
Email: ${email}

Message:
${message}

IP: ${ip}
Time: ${now}`
          }
        ]
      })
    });

    const detail = await resp.text();
    if (!resp.ok) {
      return json({ success: false, error: "Email failed", detail: detail.slice(0, 400) }, 500);
    }

    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: "Server error", detail: e.message || String(e) }, 500);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}
