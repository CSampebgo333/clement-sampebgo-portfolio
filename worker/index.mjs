import {getAnalytics,measurementAllowed,analyticsSnippet} from './analytics.mjs';
import {publicContent} from '../assets/public-content.js';
import {sitemap} from '../assets/seo.js';
import {
 getContent,
 saveContent,
 uploadMedia,
 publicMedia,
 renderLive,
 usesURL,
 listCVVersions,
 privateCVFile,
 restoreCV
} from './cms.mjs';

const API = 'https://api.github.com';

const JSON_HEADERS = {
 'content-type': 'application/json; charset=utf-8',
 'cache-control': 'no-store',
 'x-content-type-options': 'nosniff'
};

export const json = (body, status = 200) =>
 new Response(JSON.stringify(body), {
  status,
  headers: JSON_HEADERS
 });

const fail = (status, message) => {
 throw Object.assign(new Error(message), {status});
};

export function validRepo(repo) {
 return typeof repo === 'string' &&
  /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo);
}

export function validPath(path) {
 return typeof path === 'string' &&
  path.length <= 300 &&
  !path.split('/').some(s => s === '..' || s === '.') &&
  !/[\x00-\x1f\\?#]/.test(path) &&
  !path.startsWith('/');
}

export async function identity(repo, path = '') {
 const input = repo.toLowerCase() + '\n' + path;
 const digest = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(input)
 );

 return 'p_' + Array.from(new Uint8Array(digest))
  .map(n => n.toString(16).padStart(2, '0'))
  .join('')
  .slice(0, 32);
}

export function validateContent(p) {
 if (!p || !['software', 'data', 'ai', 'research'].includes(p.category)) {
  fail(400, 'Invalid category');
 }

 let url;

 try {
  url = new URL(p.url);
 } catch {
  fail(400, 'Evidence URL required');
 }

 if (url.protocol !== 'https:' || url.username || url.password) {
  fail(400, 'Use a public HTTPS evidence URL');
 }

 const out = {
  category: p.category,
  url: url.href
 };

 for (const language of ['en', 'fr']) {
  out[language] = {};

  for (const [key, max] of [
   ['title', 140],
   ['summary', 1000],
   ['role', 500]
  ]) {
   const value = p[language]?.[key];

   if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > max
   ) {
    fail(400, `Missing or invalid ${language}.${key}`);
   }

   out[language][key] = value.trim();
  }
 }

 return out;
}

const decode = value =>
 Uint8Array.from(
  atob(value.replace(/-/g, '+').replace(/_/g, '/')),
  character => character.charCodeAt(0)
 );

let jwksCache = {
 url: '',
 at: 0,
 keys: []
};

export async function verifyAccess(token, env, keyResolver) {
 if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ADMIN_EMAIL) {
  fail(503, 'Private review is not configured');
 }

 if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN)) {
  fail(503, 'Invalid Access domain');
 }

 try {
  const parts = token.split('.');

  if (parts.length !== 3) {
   throw Error();
  }

  const header = JSON.parse(
   new TextDecoder().decode(decode(parts[0]))
  );

  const claims = JSON.parse(
   new TextDecoder().decode(decode(parts[1]))
  );

  if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
   throw Error();
  }

  const issuer = 'https://' + env.ACCESS_TEAM_DOMAIN;
  const now = Date.now() / 1000;

  if (
   claims.iss !== issuer ||
   !Array.isArray(claims.aud) ||
   !claims.aud.includes(env.ACCESS_AUD) ||
   typeof claims.exp !== 'number' ||
   claims.exp <= now ||
   typeof claims.iat !== 'number' ||
   claims.iat > now + 60 ||
   (claims.nbf && claims.nbf > now + 60) ||
   claims.email?.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()
  ) {
   throw Error();
  }

  let key;

  if (keyResolver) {
   key = await keyResolver(header.kid);
  } else {
   if (
    jwksCache.url !== issuer ||
    Date.now() - jwksCache.at > 300000
   ) {
    const response = await fetch(issuer + '/cdn-cgi/access/certs');

    if (!response.ok) {
     throw Error();
    }

    jwksCache = {
     url: issuer,
     at: Date.now(),
     keys: (await response.json()).keys || []
    };
   }

   const jwk = jwksCache.keys.find(item => item.kid === header.kid);

   if (!jwk) {
    throw Error();
   }

   key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
     name: 'RSASSA-PKCS1-v1_5',
     hash: 'SHA-256'
    },
    false,
    ['verify']
   );
  }

  const valid = await crypto.subtle.verify(
   'RSASSA-PKCS1-v1_5',
   key,
   decode(parts[2]),
   new TextEncoder().encode(parts[0] + '.' + parts[1])
  );

  if (!valid) {
   throw Error();
  }

  return claims.email;
 } catch {
  fail(401, 'Owner authentication required');
 }
}

async function github(path, env) {
 const response = await fetch(API + path, {
  headers: {
   Accept: 'application/vnd.github+json',
   'X-GitHub-Api-Version': '2022-11-28',
   'User-Agent': 'ClementPortfolioDiscovery',
   ...(env.GITHUB_TOKEN
    ? {Authorization: `Bearer ${env.GITHUB_TOKEN}`}
    : {})
  }
 });

 if (!response.ok) {
  throw Error(`GitHub request failed (${response.status})`);
 }

 return response.json();
}

async function publicRepo(repo, env) {
 if (!validRepo(repo)) {
  fail(400, 'Invalid repository');
 }

 const result = await github('/repos/' + repo, env);

 if (
  result.private ||
  (result.visibility && result.visibility !== 'public')
 ) {
  fail(400, 'Only public repositories are supported');
 }

 return result;
}

export function publicRecord(row) {
 if (
  row.status !== 'approved' ||
  !row.public_verified ||
  !row.content
 ) {
  return null;
 }

 const content = validateContent(JSON.parse(row.content));

 return {
  id: row.id,
  featured: !!row.featured,
  ...content
 };
}

export async function discover(env) {
 if (!env.DB) {
  throw Error('D1 not configured');
 }

 const username = env.GITHUB_USERNAME || 'CSampebgo333';

 if (!/^[A-Za-z0-9-]+$/.test(username)) {
  throw Error('Invalid GitHub username');
 }

 const exclusionRows = await env.DB
  .prepare('SELECT repo FROM exclusions')
  .all();

 const excluded = new Set(
  exclusionRows.results.map(row => row.repo.toLowerCase())
 );

 for (const entry of (env.EXCLUDED_REPOS || '').split(',').filter(Boolean)) {
  excluded.add(entry.trim().toLowerCase());
 }

 const found = new Map();

 for (let page = 1; page <= 10; page++) {
  const rows = await github(
   `/users/${username}/repos?type=owner&per_page=100&page=${page}`,
   env
  );

  for (const repo of rows) {
   if (
    !repo.private &&
    repo.visibility !== 'private' &&
    !excluded.has(repo.full_name.toLowerCase())
   ) {
    found.set(repo.full_name.toLowerCase(), {
     repo: repo.full_name,
     relationship: 'owned'
    });
   }
  }

  if (rows.length < 100) {
   break;
  }
 }

 // GitHub search is capped at 1,000 results and is not a complete
 // contribution ledger.
 for (let page = 1; page <= 10; page++) {
  const query = encodeURIComponent(
   `is:pr is:public author:${username}`
  );

  const result = await github(
   '/search/issues?q=' + query + `&per_page=100&page=${page}`,
   env
  );

  for (const pr of result.items || []) {
   const repo = pr.repository_url?.replace(
    'https://api.github.com/repos/',
    ''
   );

   if (
    validRepo(repo) &&
    repo.split('/')[0].toLowerCase() !== username.toLowerCase() &&
    !excluded.has(repo.toLowerCase())
   ) {
    found.set(repo.toLowerCase(), {
     repo,
     relationship: 'contributed'
    });
   }
  }

  if ((result.items || []).length < 100) {
   break;
  }
 }

 let added = 0;

 for (const {repo, relationship} of found.values()) {
  const result = await publicRepo(repo, env);
  const id = await identity(repo);

  const snapshot = JSON.stringify({
   repo: result.full_name,
   url: result.html_url,
   description: result.description || '',
   relationship,
   seen: new Date().toISOString()
  });

  const existing = await env.DB
   .prepare('SELECT id FROM projects WHERE id=?')
   .bind(id)
   .first();

  if (existing) {
   await env.DB.prepare(
    'UPDATE projects SET snapshot=?,public_verified=1,' +
    'updated_at=CURRENT_TIMESTAMP WHERE id=?'
   ).bind(snapshot, id).run();
  } else {
   const output = await env.DB.prepare(
    "INSERT OR IGNORE INTO projects" +
    "(id,repo,path,relationship,snapshot,public_verified) " +
    "VALUES(?,?,'',?,?,1)"
   ).bind(
    id,
    result.full_name.toLowerCase(),
    relationship,
    snapshot
   ).run();

   added += output.meta?.changes || 0;
  }
 }

 // Recheck approved repositories, including manual monorepo entries.
 const approved = await env.DB.prepare(
  "SELECT id,repo FROM projects " +
  "WHERE status='approved' AND repo IS NOT NULL"
 ).all();

 for (const row of approved.results) {
  try {
   await publicRepo(row.repo, env);
  } catch {
   await env.DB.prepare(
    "UPDATE projects SET status='pending',public_verified=0," +
    "updated_at=CURRENT_TIMESTAMP WHERE id=?"
   ).bind(row.id).run();
  }
 }

 const pending = await env.DB.prepare(
  "SELECT id FROM projects WHERE status='pending' AND notified=0"
 ).all();

 if (
  pending.results.length &&
  env.RESEND_API_KEY &&
  env.NOTIFY_FROM &&
  env.ADMIN_EMAIL
 ) {
  const response = await fetch('https://api.resend.com/emails', {
   method: 'POST',
   headers: {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    'Content-Type': 'application/json'
   },
   body: JSON.stringify({
    from: env.NOTIFY_FROM,
    to: [env.ADMIN_EMAIL],
    subject: 'Portfolio: projects waiting for review',
    text:
     `${pending.results.length} project suggestions await your review ` +
     `at ${env.SITE_ORIGIN}/admin. ` +
     'No suggestion is published until you approve it.'
   })
  });

  if (!response.ok) {
   throw Error('Review email delivery failed');
  }

  await env.DB.batch(
   pending.results.map(project =>
    env.DB.prepare(
     'UPDATE projects SET notified=1 WHERE id=?'
    ).bind(project.id)
   )
  );
 }

 return {
  added,
  pending: pending.results.length,
  notificationsConfigured: !!(
   env.RESEND_API_KEY && env.NOTIFY_FROM
  )
 };
}

async function readBody(request) {
 if (!request.headers.get('content-type')?.startsWith('application/json')) {
  fail(415, 'JSON required');
 }

 const reader = request.body?.getReader();

 if (!reader) {
  fail(400, 'Body required');
 }

 let size = 0;
 const chunks = [];

 while (true) {
  const {done, value} = await reader.read();

  if (done) {
   break;
  }

  size += value.byteLength;

  if (size > 262144) {
   await reader.cancel();
   fail(413, 'Request too large');
  }

  chunks.push(value);
 }

 const all = new Uint8Array(size);
 let offset = 0;

 for (const chunk of chunks) {
  all.set(chunk, offset);
  offset += chunk.length;
 }

 try {
  return JSON.parse(new TextDecoder().decode(all));
 } catch {
  fail(400, 'Invalid JSON');
 }
}

async function admin(request, env, url, actor) {
 if (request.method === 'GET' && url.pathname === '/api/admin/analytics') return json(await getAnalytics(request,env));
 if (!env.DB) {
  fail(503, 'D1 is not configured');
 }

 if (
  request.method === 'GET' &&
  url.pathname === '/api/admin/content'
 ) {
  const content = await getContent(env);

  return json({
   ...content,
   uploadsConfigured: !!env.BUCKET,
   notificationsConfigured: !!(
    env.RESEND_API_KEY && env.NOTIFY_FROM
   )
  });
 }

 if (
  request.method === 'GET' &&
  url.pathname === '/api/admin/projects'
 ) {
  const result = await env.DB.prepare(
   'SELECT * FROM projects ORDER BY discovered_at DESC LIMIT 500'
  ).all();

  return json(result.results);
 }

 if (
  request.method === 'GET' &&
  url.pathname === '/api/admin/cv-versions'
 ) {
  return json(await listCVVersions(env, url));
 }

 const cvFile = url.pathname.match(
  /^\/api\/admin\/cv-versions\/(\d+)\/file$/
 );

 if (request.method === 'GET' && cvFile) {
  return privateCVFile(request, env, cvFile[1]);
 }

 if (request.method !== 'POST') {
  fail(405, 'Method not allowed');
 }

 if (
  request.headers.get('origin') !== url.origin ||
  request.headers.get('x-portfolio-request') !== 'review'
 ) {
  fail(403, 'Same-origin review request required');
 }

 if (url.pathname === '/api/admin/upload') {
  return json(await uploadMedia(request, env, actor));
 }

 const body = await readBody(request);

 if (url.pathname === '/api/admin/cv-restore') {
  return json(await restoreCV(env, body, actor));
 }

 if (url.pathname === '/api/admin/content') {
  return json(await saveContent(env, body, actor));
 }

 if (url.pathname === '/api/admin/sync') {
  return json(await discover(env));
 }

 if (url.pathname === '/api/admin/exclusions') {
  if (!validRepo(body.repo)) {
   fail(400, 'Invalid repository');
  }

  const repo = body.repo.toLowerCase();

  if (body.remove) {
   await env.DB.prepare(
    'DELETE FROM exclusions WHERE repo=?'
   ).bind(repo).run();

   return json({ok: true});
  }

  await env.DB.batch([
   env.DB.prepare(
    'INSERT OR IGNORE INTO exclusions(repo) VALUES(?)'
   ).bind(repo),

   env.DB.prepare(
    "UPDATE projects SET status='excluded' WHERE repo=?"
   ).bind(repo),

   env.DB.prepare(
    'INSERT INTO audit(project_id,action,actor) VALUES(?,?,?)'
   ).bind(repo, 'exclude-repository', actor)
  ]);

  return json({ok: true});
 }

 if (url.pathname === '/api/admin/manual') {
  const path = body.path || '';

  if (!validPath(path)) {
   fail(400, 'Invalid directory path');
  }

  let repo = null;
  let relationship = 'manual';
  let snapshot = {manual: true};

  if (body.repo) {
   const result = await publicRepo(body.repo, env);
   repo = result.full_name.toLowerCase();

   relationship =
    repo.split('/')[0] ===
    (env.GITHUB_USERNAME || 'CSampebgo333').toLowerCase()
     ? 'owned'
     : 'contributed';

   snapshot = {
    repo,
    url: result.html_url,
    path
   };

   if (path) {
    await github(
     `/repos/${repo}/contents/` +
     path.split('/').map(encodeURIComponent).join('/') +
     `?ref=${encodeURIComponent(result.default_branch)}`,
     env
    );
   }
  }

  const id = repo
   ? await identity(repo, path)
   : 'm_' + crypto.randomUUID();

  const content = validateContent(body.content);

  await env.DB.batch([
   env.DB.prepare(
    'INSERT INTO projects' +
    '(id,repo,path,relationship,snapshot,content,public_verified) ' +
    'VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING'
   ).bind(
    id,
    repo,
    path,
    relationship,
    JSON.stringify(snapshot),
    JSON.stringify(content),
    repo ? 1 : 0
   ),

   env.DB.prepare(
    'INSERT INTO audit(project_id,action,actor) VALUES(?,?,?)'
   ).bind(id, 'manual', actor)
  ]);

  return json({id});
 }

 if (url.pathname === '/api/admin/decision') {
  if (
   !['save', 'approve', 'reject', 'reconsider'].includes(body.action) ||
   typeof body.id !== 'string'
  ) {
   fail(400, 'Invalid decision');
  }

  const row = await env.DB.prepare(
   'SELECT * FROM projects WHERE id=?'
  ).bind(body.id).first();

  if (!row) {
   fail(404, 'Project not found');
  }

  const content = body.content
   ? JSON.stringify(validateContent(body.content))
   : row.content;

  let status = row.status;
  let verified = row.public_verified;

  if (body.action === 'approve') {
   if (!content) {
    fail(400, 'Both languages and evidence are required before approval');
   }

   validateContent(JSON.parse(content));

   if (row.repo) {
    const excluded = await env.DB.prepare(
     'SELECT repo FROM exclusions WHERE repo=?'
    ).bind(row.repo).first();

    const configuredExclusions = (env.EXCLUDED_REPOS || '')
     .split(',')
     .map(value => value.trim().toLowerCase());

    if (excluded || configuredExclusions.includes(row.repo)) {
     fail(400, 'Remove repository exclusion first');
    }

    await publicRepo(row.repo, env);
   }

   verified = 1;
   status = 'approved';
  }

  if (body.action === 'reject') {
   status = 'rejected';
  }

  if (body.action === 'reconsider') {
   status = 'pending';
   verified = 0;
  }

  // Editing approved copy returns it to review.
  // Feature changes are explicit approvals.
  if (body.action === 'save' && status === 'approved') {
   status = 'pending';
  }

  const featured = typeof body.featured === 'boolean'
   ? Number(body.featured)
   : row.featured;

  await env.DB.batch([
   env.DB.prepare(
    'UPDATE projects SET content=?,status=?,public_verified=?,' +
    'featured=?,updated_at=CURRENT_TIMESTAMP WHERE id=?'
   ).bind(
    content,
    status,
    verified,
    featured,
    body.id
   ),

   env.DB.prepare(
    'INSERT INTO audit(project_id,action,actor) VALUES(?,?,?)'
   ).bind(body.id, body.action, actor)
  ]);

  return json({ok: true, status});
 }

 fail(404, 'Not found');
}

export async function publishedSite(env) {
 const {site} = await getContent(env);

 if (env.DB) {
  const rows = await env.DB.prepare(
   "SELECT * FROM projects " +
   "WHERE status='approved' AND public_verified=1"
  ).all();

  for (const row of rows.results) {
   try {
    if (row.repo) {
     await publicRepo(row.repo, env);
    }

    const project = publicRecord(row);

    if (project) {
     site.projects.push({
      id: 'github-' + project.id.replaceAll('_', '-'),
      category: project.category,
      featured: project.featured,
      visible: true,
      order: 1000,
      url: project.url,
      tags: [],
      en: project.en,
      fr: project.fr
     });
    }
   } catch {
    // Unverifiable repositories remain unpublished.
   }
  }
 }

 return publicContent(site);
}

// Resolve public directory URLs explicitly because Wrangler uses
// assets.html_handling = "none" to avoid the /admin redirect loop.
function publicAssetURL(request) {
 const assetURL = new URL(request.url);

 const isPublicPage =
  assetURL.pathname === '/' ||
  /^\/(en|fr)(\/|$)/.test(assetURL.pathname);

 if (isPublicPage) {
  const lastPart = assetURL.pathname
   .split('/')
   .filter(Boolean)
   .pop() || '';

  if (!lastPart.includes('.')) {
   assetURL.pathname =
    assetURL.pathname.replace(/\/?$/, '/') + 'index.html';
  }
 }

 return assetURL;
}

export default {
 async fetch(request, env) {
  try {
   const url = new URL(request.url);
   let response;

   if (url.pathname === '/sitemap.xml') {
    return new Response(
     sitemap(await publishedSite(env), env.SITE_ORIGIN || url.origin),
     {
      headers: {
       'Content-Type': 'application/xml',
       'Cache-Control': 'no-store'
      }
     }
    );
   }

   if (env.DB && /^\/documents\/.*\.pdf$/.test(url.pathname)) {
    const archived = await env.DB.prepare(
     'SELECT id FROM cv_versions WHERE source_url=?'
    ).bind(url.pathname).first();

    if (archived) {
     const {site} = await getContent(env);

     if (!Object.values(site.profile.cv).includes(url.pathname)) {
      return new Response('Not found', {
       status: 404,
       headers: {'Cache-Control': 'no-store'}
      });
     }
    }
   }

   if (url.pathname === '/assets/site-content.json') {
    return json(await publishedSite(env));
   }

   if (url.pathname.startsWith('/documents/')) {
    const {site} = await getContent(env);

    if (!usesURL(site, url.pathname)) {
     return new Response('Not found', {status: 404});
    }
   }

   if (url.pathname === '/api/content') {
    if (request.method !== 'GET') {
     return json({error: 'Method not allowed'}, 405);
    }

    return json(await publishedSite(env));
   }

   if (url.pathname.startsWith('/media/')) {
    return await publicMedia(request, env);
   }

   if (url.pathname === '/api/projects') {
    if (request.method !== 'GET') {
     return json({error: 'Method not allowed'}, 405);
    }

    if (!env.DB) {
     return json([]);
    }

    const rows = await env.DB.prepare(
     "SELECT * FROM projects " +
     "WHERE status='approved' AND public_verified=1"
    ).all();

    const output = [];

    for (const row of rows.results) {
     try {
      if (row.repo) {
       await publicRepo(row.repo, env);
      }

      const project = publicRecord(row);

      if (project) {
       output.push(project);
      }
     } catch {
      // Never publish a repository that cannot be verified as public.
     }
    }

    return json(output);
   }

   const isAdminAPI = url.pathname.startsWith('/api/admin/');
   const isAdminPage = /^\/admin(?:\/|\.|$)/.test(url.pathname);

   if (isAdminAPI || isAdminPage) {
    const actor = await verifyAccess(
     request.headers.get('cf-access-jwt-assertion') || '',
     env
    );

    if (isAdminAPI) {
     return await admin(request, env, url, actor);
    }

    response = await env.ASSETS.fetch(
     new Request(new URL('/admin.html', url), request)
    );
   } else if (url.pathname.startsWith('/api/')) {
    return json({error: 'Not found'}, 404);
   } else {
    // Explicitly request index.html for public directory routes.
    response = await env.ASSETS.fetch(
     new Request(publicAssetURL(request), request)
    );

    // CMS-created projects and experiences may not have a static page.
    // Use the language homepage as the shell for server-side rendering.
    if (
     response.status === 404 &&
     /^\/(en|fr)\/(projects|experiences)\/[^/]+\/?$/.test(url.pathname)
    ) {
     const language = url.pathname.split('/')[1];

     response = await env.ASSETS.fetch(
      new Request(
       new URL('/' + language + '/index.html', url),
       request
      )
     );
    }

    if (
     response.headers.get('content-type')?.includes('text/html') &&
     /^\/(en|fr)\//.test(url.pathname)
    ) {
     response = await renderLive(
      request,
      env,
      response,
      await publishedSite(env)
     );
    }
   }

   const measured = response.status === 200 && response.headers.get('content-type')?.includes('text/html') && !isAdminPage && measurementAllowed(request, env);
   if (measured) response = new HTMLRewriter().on('body', {element(element){element.append(analyticsSnippet(env.WEB_ANALYTICS_TOKEN),{html:true})}}).transform(response);
   const headers = new Headers(response.headers);

   if (headers.get('content-type')?.includes('text/html')) {
    headers.set('Cache-Control', 'no-store');
   }

   headers.set('X-Content-Type-Options', 'nosniff');
   headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
   headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
   );

   headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'" + (measured ? " https://static.cloudflareinsights.com" : "") + "; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self'; " +
    "connect-src 'self'" + (measured ? " https://cloudflareinsights.com" : "") + "; worker-src 'self'; object-src 'none'; " +
    "base-uri 'none'; frame-ancestors 'none'"
   );

   if (isAdminPage) {
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
   }

   return new Response(response.body, {
    status: response.status,
    headers
   });
  } catch (error) {
   return json(
    {
     error: error.status
      ? error.message
      : 'Service temporarily unavailable'
    },
    error.status || 503
   );
  }
 },

 async scheduled(event, env, ctx) {
  ctx.waitUntil(
   discover(env).catch(error => {
    console.error('Discovery failed:', error.message);
    throw error;
   })
  );
 }
};