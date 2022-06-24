const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const ReactDOMServer = require('react-dom/server');
const React = require('react')

const appFolder = path.join(__dirname, "../../..")

function isClassComponent(component) {
  return (
      typeof component === 'function' && 
      !!component.prototype.isReactComponent
  )
}

function isFunctionComponent(component) {
  return (
      typeof component === 'function' && 
      String(component).includes('return React.createElement')
  )
}

function isReactComponent(component) {
  return (
      isClassComponent(component) || 
      isFunctionComponent(component)
  )
}

function readModuleFile(path, callback) {
  try {
      var filename = require.resolve(path);
      fs.readFile(filename, 'utf8', callback);
  } catch (e) {
      callback(e);
  }
}

async function isRoute(routePath) {
  try {
    routePath = routePath.split("/").filter((route) => route !== "");
    let file = await fs.readFile(
      path.join(appFolder, "src", ...routePath)
    );
    if (!!file.toString().trim()) return true;
  } catch (err) {
    return false;
  }
}

function responseByType(handler, res, id) {
  switch (true) {
    case typeof handler === "object":
      res.writeHead(200, {
        "Content-Type": "application/json",
      });
      res.write(JSON.stringify(handler));
      break;
    case typeof handler === "string":
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
      });
      res.write(handler);
      break;
    case isReactComponent(handler):
      const Main = require(path.join(appFolder, 'src', 'index.js'))
      const Component = handler
      const App = React.createElement(Main, { Component: React.createElement(Component, { id }) })
      const renderApp = ReactDOMServer.renderToString(App)
      const defaultHead = `
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PRSSR</title>
      `
      readModuleFile('./index.html', function (err, html) {
        html.replace('__HEAD__', defaultHead)
        html.replace('__APP__', renderApp)
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
        });
        res.write(html);
      });
      break;
    case typeof handler === "function":
      res.write(responseByType(handler(id), res) || "");
      break;
    default: 
      res.writeHead(200, {
        "Content-Type": "text/plain",
      });
      res.write(handler?.toString() || "");
  }
}
const server = http.createServer(async (req, res) => {
  if (req.method !== "GET") res.end();
  let routes = req.url.split("/");
  let id = null;
  routes[1] = routes[1] === "" ? "home" : routes[1];
  if (!isNaN(Number(routes[routes.length - 1]))) {
    id = routes[routes.length - 1];
    routes = routes.slice(0, routes.length - 1);
  }
  routes = routes
    .filter((route) => route !== "")
    .map((route) => "modules/" + route)
    .join("/");
  routes = id ? routes + `/routes/[id].js` : routes + "/routes/index.js";
  if (await isRoute(routes)) {
    responseByType(require(path.join(appFolder, `src/${routes}`)), res, id);
  }
  else {
    res.writeHead(404, {
      "Content-Type": "text/plain",
    });
    res.write("Page not found!");
  }
  res.end();
});

module.exports = {
  server
}
