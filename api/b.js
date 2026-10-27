// /b/<file> (vercel.json rewrite) → eden.love Firebase Storage ohome/<file>, served from this domain.
// eden's Storage rules no longer allow tokenless public reads, so the download token is taken from the
// eden image address saved in this site's content (site/eveden); only images used on this site are served.
const BUCKET = 'hong-daf0d.firebasestorage.app';
const SITE_DOC = 'https://firestore.googleapis.com/v1/projects/log-editor/databases/(default)/documents/site/eveden';
// raster only: an SVG served from this origin could run script with this site's privileges
const TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

let cache = { at: 0, tokens: {} };

async function tokenFor(f) {
  if (Date.now() - cache.at > 60000 || !(f in cache.tokens)) {
    const r = await fetch(SITE_DOC);
    if (!r.ok) throw new Error('site ' + r.status);
    const j = await r.json();
    const s = (j.fields && j.fields.json && j.fields.json.stringValue) || '';
    const tokens = {};
    const re = /ohome%2F([A-Za-z0-9._-]+)\?alt=media&token=([0-9a-fA-F-]{36})/g;
    let m;
    while ((m = re.exec(s))) tokens[m[1]] = m[2];
    cache = { at: Date.now(), tokens };
  }
  return cache.tokens[f];
}

function notFound(res) {
  res.statusCode = 404;
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.end('Not found');
}

module.exports = async (req, res) => {
  const f = String((req.query && req.query.f) || '');
  if (!/^[A-Za-z0-9_-][A-Za-z0-9._-]{0,79}$/.test(f)) return notFound(res);
  let up;
  try {
    const token = await tokenFor(f);
    if (!token) return notFound(res);
    up = await fetch('https://firebasestorage.googleapis.com/v0/b/' + BUCKET + '/o/ohome%2F' + f + '?alt=media&token=' + token);
  } catch (e) {
    res.statusCode = 502; return res.end('Bad gateway');
  }
  const type = (up.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!up.ok || TYPES.indexOf(type) < 0) return notFound(res);
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.end(Buffer.from(await up.arrayBuffer()));
};
