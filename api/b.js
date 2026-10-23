// /b/<file> (vercel.json rewrite) → eden.love Firebase Storage ohome/<file>, served from this domain
const BUCKET = 'hong-daf0d.firebasestorage.app';

module.exports = async (req, res) => {
  const f = String((req.query && req.query.f) || '');
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(f)) { res.statusCode = 404; return res.end('Not found'); }
  let up;
  try {
    up = await fetch('https://firebasestorage.googleapis.com/v0/b/' + BUCKET + '/o/ohome%2F' + f + '?alt=media');
  } catch (e) {
    res.statusCode = 502; return res.end('Bad gateway');
  }
  const type = up.headers.get('content-type') || '';
  if (!up.ok || !type.startsWith('image/')) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(Buffer.from(await up.arrayBuffer()));
};
