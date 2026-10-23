// /b/<file> (vercel.json rewrite) → eden.love Firebase Storage ohome/<file>, served from this domain
const BUCKET = 'hong-daf0d.firebasestorage.app';
// raster only: an SVG served from this origin could run script with this site's privileges
const TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

function notFound(res) {
  res.statusCode = 404;
  res.setHeader('Cache-Control', 'public, s-maxage=600');
  res.end('Not found');
}

module.exports = async (req, res) => {
  const f = String((req.query && req.query.f) || '');
  if (!/^[A-Za-z0-9_-][A-Za-z0-9._-]{0,79}$/.test(f)) return notFound(res);
  let up;
  try {
    up = await fetch('https://firebasestorage.googleapis.com/v0/b/' + BUCKET + '/o/ohome%2F' + f + '?alt=media');
  } catch (e) {
    res.statusCode = 502; return res.end('Bad gateway');
  }
  const type = (up.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!up.ok || TYPES.indexOf(type) < 0) return notFound(res);
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.end(Buffer.from(await up.arrayBuffer()));
};
