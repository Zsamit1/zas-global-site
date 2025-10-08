export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405 });
    }

    try {
      const { name, email, message } = await request.json();

      // ✅ Replace this with your actual App Password (no spaces)
      const appPassword = "fsxwzclaufpzItvb";

      // Gmail SMTP credentials
      const smtpServer = "smtp.gmail.com";
      const smtpPort = 465; // or 587 if needed

      // Email data
      const mailData = {
        from: { email: "zasgloballlc@zasgloballlc.com", name: "ZAS Global Website" },
        to: [{ email: "info@zasgloballlc.com", name: "ZAS Global LLC" }],
        reply_to: { email, name },
        subject: `New message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      };

      // Send using Gmail SMTP
      const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: mailData.to, reply_to: mailData.reply_to }],
          from: mailData.from,
          subject: mailData.subject,
          content: [{ type: "text/plain", value: mailData.text }],
        }),
      });

      if (response.ok) {
        return new Response("Email sent successfully", { status: 200 });
      } else {
        const errorText = await response.text();
        return new Response(`Email failed: ${errorText}`, { status: 500 });
      }
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  },
};
