// functions/contact.js

// 1) Quick GET to confirm the route is live at /contact
export const onRequestGet = () =>
  new Response(JSON.stringify({ ok: true, route: "/contact" }), {
    headers: { "content-type": "application/json" }
  });

// 2) Actual POST handler for your contact form
//    - Validates inputs
//    - (Optional) Saves to D1 if you bound a DB as "DB"
//    - Sends email via MailChannels to info@zasgloballlc.com
export const onRequestPost = async ({ request, env }) => {
  try {
    const { name, email, message, website } = await request.json();

    // Honeypot + basic validation
    if (website) return json({ success: true }); // silently ignore bots
    if (!name || !email || !message)
      return json({ success: false, error: "Missing fields" }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return json({ success: false, error: "Invalid email" }, 400);

    const ip  = request.headers.get("CF-Connecting-IP") || "";
    const now = new Date().toISOString();

    // 2a) OPTIONAL: Save to D1 if you added a binding named "DB"
    // Cloudflare Pages -> Settings -> Functions -> D1 Bindings -> Add binding "DB"
    if (env.DB) {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          ip TEXT,
          ts TEXT NOT NULL
        );
      `);
      await env.DB.prepare(
        "INSERT INTO messages (name,email,message,ip,ts) VALUES (?,?,?,?,?)"
      ).bind(name, email, message, ip, now).run();
    }

    // 2b) Send email via MailChannels (Cloudflare-supported)
    // REQUIREMENTS:
    // - DNS TXT SPF at @ must be:
    //   v=spf1 include:_spf.google.com include:relay.mailchannels.net ~all
    // - Use your real Workspace mailbox as the sender ("from")
    const payload = {
      personalizations: [
        { to: [{ email: "info@zasgloballlc.com", name: "ZAS Global LLC" }] }
      ],
      from: {
        email: "zasgloballlc@zasgloballlc.com",  // your real Workspace mailbox
        name:  "ZAS Global Website"
      },
      // When you hit “Reply” in Gmail, it goes to the visitor
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
      ],
      headers: { "X-Source": "contact-form" }
    };

    const resp = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const detail = await resp.text();
    if (!resp.ok) {
      // Surface MailChannels’ actual reason so we can fix precisely
      return json(
        { success: false, error: "Email failed", detail: detail.slice(0, 400) || "No response" },
        500
      );
    }

    return json({ success: true });
  } catch (e) {
    return json(
      { success: false, error: "Server error", detail: e.message || String(e) },
      500
    );
  }
};

// Helper
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}
