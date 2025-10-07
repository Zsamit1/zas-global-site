// functions/contact.js
export const onRequestPost = async ({ request, env }) => {
  try {
    const { name, email, message } = await request.json();
    if (!name || !email || !message) return json({ success:false, error:'Missing fields' }, 400);

    // Optional: persist to D1 if bound
    if (env.DB) {
      await env.DB.exec(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT, ts TEXT);`);
      await env.DB.prepare('INSERT INTO messages (name,email,message,ts) VALUES (?,?,?,?)')
                   .bind(name, email, message, new Date().toISOString())
                   .run();
    }

    return json({ success:true });
  } catch (e) {
    return json({ success:false, error:'Server error' }, 500);
  }
};
function json(obj, status=200){ return new Response(JSON.stringify(obj), {status, headers:{'Content-Type':'application/json'}}); }
