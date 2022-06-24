const http = require('http');
const fs = require('fs/promises');
const path = require('path');

async function isRoute(routePath) {
  try {
    routePath = routePath.split('/').filter((route) => route !== '');
    let file = await fs.readFile(path.join(__dirname, '..', 'src', ...routePath));
    if (!!file.toString().trim()) return true;
  } catch (err) {
    return false;
  }
}

function responseByType(handler, res) {
  switch (typeof handler) {
    case 'object': {
      res.writeHead(200, {
        'Content-Type': 'application/json',
      });
      res.write(JSON.stringify(handler));
      break;
    }
    case 'string': {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
      });
      res.write(handler);
      break;
    }
    case 'function': {
      res.write(responseByType(handler(), res) || '');
      break;
    }
    default: {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
      });
      res.write(handler?.toString() || '');
    }
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET') res.end();
  let routes = req.url.split('/');
  let id = null;
  routes[1] = routes[1] === '' ? 'home' : routes[1];
  if (!isNaN(Number(routes[routes.length - 1]))) {
    id = routes[routes.length - 1];
    routes = routes.slice(0, routes.length - 1);
  }
  routes = routes
    .filter((route) => route !== '')
    .map((route) => 'modules/' + route)
    .join('/');
  routes = id ? routes + `/routes/[id].js` : routes + '/routes/index.js';
  if (await isRoute(routes)) responseByType(require(`../src/${routes}`)(id), res);
  else {
    res.writeHead(404, {
      'Content-Type': 'text/plain',
    });
    res.write('Page not found!');
  }
  res.end();
});

server.listen(3000);
