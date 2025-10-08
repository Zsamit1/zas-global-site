export const onRequestPost = async ({ request }) => {
  try {
    const { name, email, message, website } = await request.json();

    // Basic validation + honeypot
    if (website) return json({ success: true });
    if (!name || !email || !message)
      return json({ success: false, error: 'Missing fields' }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return json({ success: false, error: 'Invalid email' }, 400);

    const ip = request.headers.get('CF-Connecting-IP') || '';
    const now = new Date().toISOString();

    // Build MailChannels payload
    const payload = {
      personalizations: [
        {
          to: [{ email: 'info@zasgloballlc.com', name: 'ZAS Global LLC' }]
        }
      ],
      // 👇 Use your real Workspace email as the sender
      from: {
        email: 'zasgloballlc@zasgloballlc.com',
        name: 'ZAS Global Website'
      },
      reply_to: { email, name },
      subject: `Website contact from ${name}`,
      content: [
        {
          type: 'text/plain',
          value: `Name: ${name}
Email: ${email}

Message:
${message}

IP: ${ip}
Time: ${now}`
        }
      ]
    };

    // Send email via MailChannels
    const resp = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();

    // If MailChannels rejects, show the reason
    if (!resp.ok) {
      return json({
        success: false,
        error: 'Email failed',
        detail: text.slice(0, 400) || 'No response from MailChannels'
      }, 500);
    }

    // Success
    return json({ success: true });
  } catch (err) {
    return json({
      success: false,
      error: 'Server error',
      detail: err.message || String(err)
    }, 500);
  }
};

// Helper to return JSON
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
