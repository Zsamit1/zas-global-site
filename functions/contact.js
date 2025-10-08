export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Only POST requests allowed", { status: 405 });
    }

    try {
      const { name, email, message } = await request.json();

      // ✅ Your Gmail app password
      const appPassword = "fsxwzclaufpzItvb";

      // ✅ Email details
      const mailData = {
        to: [{ email: "info@zasgloballlc.com", name: "ZAS Global LLC" }],
        from: { email: "no-reply@zasgloballlc.com", name: "ZAS Global Website" },
        reply_to: { email, name },
        subject: `📩 New message from ${name}`,
        text: `You got a new message:\n\nFrom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      };

      // ✅ Send via MailChannels (built into Cloudflare)
      const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [
            { to: mailData.to, reply_to: mailData.reply_to }
          ],
          from: mailData.from,
          subject: mailData.subject,
          content: [{ type: "text/plain", value: mailData.text }]
        }),
      });

      if (response.ok) {
        return new Response("Email sent successfully!", { status: 200 });
      } else {
        const err = await response.text();
        return new Response(`Email failed: ${err}`, { status: 500 });
      }

    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  },
};
