// functions/contact.js

// Quick GET so you can verify the route is live
export const onRequestGet = () =>
  new Response(JSON.stringify({ ok: true, route: "/contact" }), {
    headers: { "content-type": "application/json" }
  });

export const onRequestPost = async ({ request }) => {
  try {
    const { name, email, message, website } = await request.json();

    // Honeypot + validation
    if (website) return json({ success: true }); // bot
    if (!name || !email || !message)
      return json({ success:false, error:"Missing fields" }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return json({ success:false, error:"Invalid email" }, 400);

    const ip  = request.headers.get("CF-Connecting-IP") || "";
    const now = new Date().toISOString();

    // Build MailChannels payload
    const payload = {
      personalizations: [
        {
          to: [{ email: "zasgloballlc@zasgloballlc.com", name: "ZAS Global LLC" }], // deliver to your primary inbox
          // you can also add a BCC (optional):
          // bcc: [{ email: "info@zasgloballlc.com" }]
        }
      ],
      // IMPORTANT: 'from' must be on YOUR domain. Use the address you control.
      from: { email: "info@zasgloballlc.com", name: "ZAS Global Website" },
      // SMTP envelope sender (helps some providers). Keep same domain/address.
      mail_from: { email: "info@zasgloballlc.com" },
      // when you click "Reply" in Gmail, it goes to the visitor
      reply_to: { email, name },
      subject: `Website contact from ${name}`,
      headers: { "X-Source": "contact-form" },
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
        },
        {
          type: "text/html",
          value:
`<h2>New message from ${escapeHtml(name)}</h2>
<p><b>Email:</b> ${escapeHtml(email)}</p>
<pre style="font-family:ui-monospace,Menlo,Consolas,monospace;padding:12px;border:1px solid #ddd;border-radius:8px">${escapeHtml(message)}</pre>
<p style="color:#666;font-size:12px">IP: ${escapeHtml(ip)}<br/>Time: ${escapeHtml(now)}</p>`
        }
      ]
    };

    const resp = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const detail = await resp.text(); // get MailChannels response text
    if (!resp.ok) {
      return json({ success:false, error:"Email failed", detail: detail.slice(0,500) || "No response" }, 500);
    }

    return json({ success:true });
  } catch (e) {
    return json({ success:false, error:"Server error", detail: e.message || String(e) }, 500);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
