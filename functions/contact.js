export const onRequestPost = async ({ request }) => {
  try {
    const { name, email, message, website } = await request.json();

    if (website) return json({ success: true }); // honeypot
    if (!name || !email || !message) return json({ success:false, error:'Missing fields' }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ success:false, error:'Invalid email' }, 400);

    const ip  = request.headers.get('CF-Connecting-IP') || '';
    const now = new Date().toISOString();

    const resp = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [
          { to: [{ email: 'info@zasgloballlc.com', name: 'ZAS Global LLC' }] }
        ],
        // Sender must be your domain; using a neutral web@ is best
        from:     { email: 'web@zasgloballlc.com', name: 'ZAS Global Website' },
        reply_to: { email, name },
        subject:  `Website contact from ${name}`,
        content: [
          { type: 'text/plain',
            value:
`Name: ${name}
Email: ${email}

Message:
${message}

IP: ${ip}
Time: ${now}` }
        ]
      })
    });

    if (!resp.ok) {
      const t = await resp.text().catch(()=> '');
      return json({ success:false, error:'Email failed', detail: t.slice(0,300) }, 500);
    }
    return json({ success:true });
  } catch {
    return json({ success:false, error:'Server error' }, 500);
  }
};

function json(obj, status=200){ return new Response(JSON.stringify(obj), { status, headers:{'Content-Type':'application/json'} }); }
