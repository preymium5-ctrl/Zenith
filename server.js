const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const WORKSPACE = __dirname;

// Global process exception handlers so server NEVER crashes on unexpected I/O
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] Unhandled rejection:', reason);
});

// MIME types mapping
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (MIME_TYPES[ext]) return MIME_TYPES[ext];
  
  // Extensionless file inspection
  if (!ext) {
    try {
      if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        const fd = fs.openSync(filePath, 'r');
        const buf = Buffer.alloc(512);
        const bytesRead = fs.readSync(fd, buf, 0, 512, 0);
        fs.closeSync(fd);
        const head = buf.toString('utf8', 0, bytesRead).trim().toLowerCase();
        if (head.startsWith('<!doctype html') || head.startsWith('<html') || head.includes('<head') || head.includes('<body') || head.includes('data-wf-page')) {
          return 'text/html; charset=utf-8';
        }
        if (head.startsWith('{') || head.startsWith('[')) {
          return 'application/json; charset=utf-8';
        }
      }
    } catch (e) {}
    // Default extensionless web route to text/html
    return 'text/html; charset=utf-8';
  }
  return 'application/octet-stream';
}

function injectScript(html) {
  const scriptTag = '\n<!-- Dynamic Scroll Popups Injection -->\n<script src="/js/scroll-popups.js" defer></script>\n';
  if (html.includes('</body>')) {
    return html.replace('</body>', scriptTag + '</body>');
  } else if (html.includes('</html>')) {
    return html.replace('</html>', scriptTag + '</html>');
  }
  return html + scriptTag;
}

function serveLocalFile(filePath, res) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const idx = path.join(filePath, 'index.html');
      if (fs.existsSync(idx)) {
        return serveLocalFile(idx, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
    }
  } catch (e) {
    if (!res.headersSent) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
    return;
  }

  const mimeType = getMimeType(filePath);
  
  if (mimeType.startsWith('text/html')) {
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('Internal Server Error');
        }
        return;
      }
      
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        res.writeHead(200, { 
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(content);
        return;
      }

      let processed = content;
      if (filePath.includes('\\app\\') || filePath.includes('/app/')) {
        processed = processed.replace('"basename":"/"', '"basename":"/app"');
        const navInterceptor = `<script>
(function(){
  var op=history.pushState;
  history.pushState=function(s,t,u){
    if(u&&typeof u==='string'){
      var p=u.replace(/\\?.*$/,'');
      if(p==='/app/signin'||p==='/app/signup'||p==='/signin'||p==='/signup'||p==='/app'||p==='/app/'){
        window.location.href=u.startsWith('/')?u:'/app/'+u;
        return;
      }
    }
    return op.apply(this,arguments);
  };
})();
</script>`;
        processed = processed.replace('</head>', navInterceptor + '</head>');
      } else if (!filePath.includes('\\docs\\') && !filePath.includes('/docs/')) {
        processed = injectScript(processed);
      }

      // Development cache headers: never cache JS/HTML/JSON so live edits apply instantly
      const fileExt = path.extname(filePath).toLowerCase();
      let cacheControl = 'public, max-age=86400';
      if (fileExt === '.html' || fileExt === '.js' || fileExt === '.json' || fileExt === '.map' || !fileExt) {
        cacheControl = 'no-cache, no-store, must-revalidate';
      }

      res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': cacheControl
      });
      res.end(processed);
      return;
    });
  } else {
    // Static assets
    const readStream = fs.createReadStream(filePath);
    readStream.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
    });
    readStream.pipe(res);
  }
}

function fetchUrl(targetUrl, headers, redirectCount, callback) {
  let called = false;
  const cb = (err, res, data) => {
    if (called) return;
    called = true;
    callback(err, res, data);
  };

  const client = targetUrl.startsWith('https:') ? https : http;
  const req = client.get(targetUrl, { headers, timeout: 15000 }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectCount < 5) {
      const redirectUrl = new URL(res.headers.location, targetUrl).href;
      return fetchUrl(redirectUrl, headers, redirectCount + 1, callback);
    }

    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => cb(null, res, Buffer.concat(chunks)));
  });

  req.on('error', (err) => cb(err, null, null));
  req.on('timeout', () => {
    req.destroy();
    cb(new Error('Timeout'), null, null);
  });
}

function proxyAndCache(domain, targetPath, localPath, isHtmlPage, clientRes, clientHeaders = {}) {
  const targetUrl = domain + targetPath;

  const headers = { ...clientHeaders };
  delete headers.host;
  delete headers.connection;
  headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  headers['accept-encoding'] = 'identity';

  fetchUrl(targetUrl, headers, 0, (err, proxyRes, data) => {
    if (err) {
      if (!clientRes.headersSent) {
        clientRes.writeHead(404, { 'Content-Type': 'text/plain' });
        clientRes.end('Not Found');
      }
      return;
    }

    const contentType = proxyRes.headers['content-type'] || '';
    const isHtml = isHtmlPage || contentType.includes('text/html') || (!path.extname(localPath) && !contentType.includes('image/') && !contentType.includes('font/') && !contentType.includes('audio/') && !contentType.includes('video/'));

    let savePath = localPath;
    if (isHtml && !savePath.endsWith('.html')) {
      savePath = savePath + '.html';
    }

    const dir = path.dirname(savePath);
    try {
      if (fs.existsSync(dir) && !fs.statSync(dir).isDirectory()) {
        fs.unlinkSync(dir);
      }
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {}

    if (isHtml) {
      let htmlString = data.toString('utf8');
      
      // Auto rebrand Gladia to Zenith on cached pages
      htmlString = htmlString
        .replace(/name="gladia-page"/gi, 'name="zenith-page"')
        .replace(/\| Gladia<\/title>/gi, '| Zenith</title>')
        .replace(/aria-label="Gladia"/gi, 'aria-label="Zenith"')
        .replace(/aria-label="Gladia home"/gi, 'aria-label="Zenith home"')
        .replace(/https:\/\/www\.gladia\.io/gi, 'https://www.zenith.io')
        .replace(/https:\/\/gladia\.io/gi, 'https://zenith.io')
        .replace(/Gladia's/g, "Zenith's")
        .replace(/Gladia /g, "Zenith ")
        .replace(/ Gladia/g, " Zenith");

      try {
        fs.writeFileSync(savePath, htmlString, 'utf8');
      } catch (e) {}

      if (!clientRes.headersSent) {
        clientRes.writeHead(200, { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        clientRes.end(htmlString);
      }
    } else {
      try {
        fs.writeFileSync(savePath, data);
      } catch (e) {}
      if (!clientRes.headersSent) {
        clientRes.writeHead(200, { 'Content-Type': contentType || getMimeType(savePath) });
        clientRes.end(data);
      }
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let reqPath = parsedUrl.pathname;

  // Short-circuit analytics, telemetry, source maps, and tracking calls (Instant 204 response)
  if (
    reqPath.startsWith('/ingest') ||
    reqPath.startsWith('/api/event') ||
    reqPath.startsWith('/__telemetry') ||
    reqPath.endsWith('.map') ||
    reqPath.startsWith('/clarity') ||
    reqPath.startsWith('/axeptio') ||
    reqPath.startsWith('/cdn-cgi') ||
    reqPath.startsWith('/_mintlify') ||
    reqPath.startsWith('/mintlify-assets/_next/image') ||
    reqPath.startsWith('/mintlify-assets/_mintlify/favicons')
  ) {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end();
    return;
  }

  // Favicon redirect / route
  if (reqPath === '/favicon.ico' || reqPath === '/favicons/favicon.ico') {
    reqPath = '/favicon.svg';
  }

  // React Router Manifest endpoint for app
  if (reqPath === '/__manifest' || reqPath === '/app/__manifest') {
    const manifestPaths = [
      path.join(WORKSPACE, 'app', 'signup.html'),
      path.join(WORKSPACE, 'app', 'signin.html'),
    ];
    const manifests = [];
    let pending = manifestPaths.length;
    manifestPaths.forEach((filePath) => {
      fs.readFile(filePath, 'utf8', (err, html) => {
        if (!err) {
          const match = html.match(/window\.__reactRouterManifest\s*=\s*(\{[\s\S]+?\});/);
          if (match) {
            try { manifests.push(JSON.parse(match[1])); } catch (e) {}
          }
        }
        pending--;
        if (pending === 0) {
          let merged = { entry: {}, routes: {}, url: '', version: '16a52448' };
          for (const m of manifests) {
            if (m.entry && m.entry.module) merged.entry = m.entry;
            if (m.url) merged.url = m.url;
            if (m.routes) Object.assign(merged.routes, m.routes);
          }
          res.writeHead(200, { 
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
          });
          res.end(JSON.stringify(merged));
        }
      });
    });
    return;
  }

  // Normalize path trailing slash (except root)
  if (reqPath.length > 1 && reqPath.endsWith('/')) {
    reqPath = reqPath.slice(0, -1);
  }

  // Fast route mapping
  let localPath;
  let isHtmlPage = false;
  let targetDomain = 'https://www.gladia.io';
  let targetPath = reqPath;

  if (targetPath.startsWith('/competitors/zenith-vs-')) {
    targetPath = targetPath.replace('/competitors/zenith-vs-', '/competitors/gladia-vs-');
  } else if (targetPath === '/zenithflow') {
    targetPath = '/gladiaflow';
  }

  if (reqPath.startsWith('/api/')) {
    const sub = reqPath.replace(/^\/api\/?/, '');
    localPath = path.join(WORKSPACE, 'api-data', sub);
  } else if (reqPath === '' || reqPath === '/') {
    localPath = path.join(WORKSPACE, 'index.html');
    isHtmlPage = true;
  } else if (reqPath === '/compliance-hub') {
    localPath = path.join(WORKSPACE, 'compliance-hub.html');
    isHtmlPage = true;
  } else if (reqPath === '/use-cases/ccaas') {
    localPath = path.join(WORKSPACE, 'use-cases', 'ccaas.html');
    isHtmlPage = true;
  } else if (reqPath === '/use-cases/media') {
    localPath = path.join(WORKSPACE, 'use-cases', 'media.html');
    isHtmlPage = true;
  } else if (reqPath === '/solaria') {
    localPath = path.join(WORKSPACE, 'solaria.html');
    isHtmlPage = true;
  } else if (reqPath === '/status') {
    localPath = path.join(WORKSPACE, 'status.html');
    isHtmlPage = true;
  } else if (reqPath === '/press') {
    localPath = path.join(WORKSPACE, 'press.html');
    isHtmlPage = true;
  } else if (reqPath === '/docs' || reqPath === '/docs/' || reqPath === '/api-reference') {
    localPath = path.join(WORKSPACE, 'docs', 'index.html');
    isHtmlPage = true;
  } else if (reqPath === '/docs/chapters/integrations' || reqPath === '/chapters/integrations') {
    localPath = path.join(WORKSPACE, 'docs', 'chapters', 'integrations.html');
    isHtmlPage = true;
  } else if (reqPath === '/docs/chapters/introduction' || reqPath === '/chapters/introduction') {
    localPath = path.join(WORKSPACE, 'docs', 'chapters', 'introduction.html');
    isHtmlPage = true;
  } else if (reqPath.startsWith('/chapters/')) {
    const chapterName = reqPath.replace('/chapters/', '').replace(/\.md$/, '').replace(/\//g, '_');
    const candidates = [
      path.join(WORKSPACE, 'docs', reqPath + '.html'),
      path.join(WORKSPACE, 'docs', 'chapters', chapterName + '.html'),
      path.join(WORKSPACE, 'docs', 'chapters', 'integrations.html'),
      path.join(WORKSPACE, 'docs', 'index.html')
    ];
    localPath = candidates.find(c => fs.existsSync(c)) || path.join(WORKSPACE, 'docs', 'index.html');
    isHtmlPage = true;
  } else if (reqPath.startsWith('/docs')) {
    const sub = reqPath.replace(/^\/docs\/?/, '');
    localPath = path.join(WORKSPACE, 'docs', sub);
    targetDomain = 'https://docs.gladia.io';
    targetPath = '/' + sub;
  } else if (reqPath === '/app' || reqPath === '/app/') {
    localPath = path.join(WORKSPACE, 'app', 'signup.html');
    isHtmlPage = true;
  } else if (reqPath.startsWith('/app')) {
    const sub = reqPath.replace(/^\/app\/?/, '');
    localPath = path.join(WORKSPACE, 'app', sub);
    targetDomain = 'https://app.gladia.io';
    targetPath = '/' + sub;
  } else {
    localPath = path.join(WORKSPACE, reqPath);
  }

  // Check extension
  const ext = path.extname(localPath);
  if (!ext && !isHtmlPage) {
    const htmlCandidate = localPath + '.html';
    if (fs.existsSync(htmlCandidate)) {
      localPath = htmlCandidate;
      isHtmlPage = true;
    } else if (fs.existsSync(localPath) && !fs.statSync(localPath).isDirectory()) {
      // If file exists without extension, check if it's HTML
      try {
        const content = fs.readFileSync(localPath, 'utf8');
        if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
          fs.writeFileSync(htmlCandidate, content, 'utf8');
          fs.unlinkSync(localPath);
          localPath = htmlCandidate;
          isHtmlPage = true;
        }
      } catch (e) {}
    } else {
      // Default extensionless routes (e.g. /pricing, /about-us) to HTML
      isHtmlPage = true;
    }
  } else if (ext === '.html') {
    isHtmlPage = true;
  }

  // If localPath is directory, check index.html
  if (fs.existsSync(localPath) && fs.statSync(localPath).isDirectory()) {
    const idx = path.join(localPath, 'index.html');
    if (fs.existsSync(idx)) {
      localPath = idx;
      isHtmlPage = true;
    }
  }

  // File serving resolution
  fs.access(localPath, fs.constants.F_OK, (err) => {
    if (!err) {
      serveLocalFile(localPath, res);
    } else {
      console.log(`[server] Asset not found locally: ${reqPath}, checking fallback...`);
      proxyAndCache(targetDomain, targetPath, localPath, isHtmlPage, res, req.headers);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[server] High-performance Zenith server listening on http://localhost:${PORT}`);
});
