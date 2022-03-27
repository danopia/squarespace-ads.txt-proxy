import { serve } from "https://deno.land/std@0.130.0/http/server.ts";

const blogDomain = 'my-squarespace-blog.com';
const squarespaceDomain = 'some-sqsp-blog-id.squarespace.com';
const adsTxt = `google.com, ........`;

async function handler(req: Request, connInfo: ConnInfo) {
  const newUrl = new URL(req.url);
  const clientAddr = connInfo.remoteAddr as Deno.NetAddr;

  // Redirect to www. version of site
  if (newUrl.hostname === blogDomain) {
    newUrl.hostname = `www.${newUrl.hostname}`;
    return new Response(`Redirecting to www.${newUrl.hostname}`, {
      status: 301,
      headers: {
        location: newUrl.toString(),
      }});
  }

  // Serve ads.txt
  if (newUrl.pathname == '/ads.txt') return new Response(adsTxt+'\n', {
    headers: {
      'content-type': 'text/plain',
    }});

  // Proxy to Squarespace
  newUrl.hostname = squarespaceDomain;
  newUrl.protocol = 'https:';
  const resp = await fetch(newUrl, {
    headers: req.headers,
    body: req.body,
    method: req.method,
  });

  // Log interesting requests
  if (!resp.ok || resp.headers.get('content-type')?.startsWith('text/html')) {
    console.log(clientAddr.hostname, resp.status, req.method,
      JSON.stringify(newUrl.pathname),
      JSON.stringify(req.headers.get('user-agent')).slice(0, 64)+'...',
      JSON.stringify(req.headers.get('referer')),
    );
  }
  
  return new Response(respBody, resp);
}

console.log("Listening on http://localhost:8000");
await serve(handler);
