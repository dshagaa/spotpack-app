// functions/_middleware.js
// MAINTENANCE MODE — returns 503 for ALL requests (page + API).
//
// To RE-ENABLE the site: delete this file and redeploy:
//   npx wrangler pages deploy dist --project-name spotpack --branch main
//   npx wrangler pages deploy dist --project-name spotpack --branch dev
//
// Nothing is deleted by disabling — R2 data, API keys, and prior
// deployments remain intact. This middleware just gates access.

const MAINTENANCE_HTML = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>SpotPack — En pausa</title>
</head>
<body style="background:#1A1025;color:#9B8EAB;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;display:grid;place-items:center;height:100vh;margin:0">
  <div style="text-align:center;padding:0 1.5rem">
    <div style="font-size:2.5rem;margin-bottom:0.5rem">🐆</div>
    <h1 style="font-size:1.4rem;margin:0 0 0.5rem;color:#F5F0FA">SpotPack</h1>
    <p style="font-size:0.9rem;margin:0;color:#9B8EAB">Temporalmente en pausa.</p>
    <p style="font-size:0.8rem;margin:0.5rem 0 0;color:#5b5266">Volvemos pronto.</p>
  </div>
</body>
</html>`;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isApi = url.pathname.startsWith('/api/');

  if (isApi) {
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Retry-After': '86400',
      },
    });
  }

  return new Response(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': '86400',
    },
  });
}
