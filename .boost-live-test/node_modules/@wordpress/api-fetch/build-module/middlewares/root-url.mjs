// packages/api-fetch/src/middlewares/root-url.ts
import namespaceAndEndpointMiddleware from "./namespace-endpoint.mjs";
var createRootURLMiddleware = (rootURL) => (options, next) => {
  return namespaceAndEndpointMiddleware(options, (optionsWithPath) => {
    let url = optionsWithPath.url;
    let path = optionsWithPath.path;
    let apiRoot;
    if (typeof path === "string") {
      apiRoot = rootURL;
      if (-1 !== rootURL.indexOf("?")) {
        path = path.replace("?", "&");
      }
      path = path.replace(/^\//, "");
      if ("string" === typeof apiRoot && -1 !== apiRoot.indexOf("?")) {
        path = path.replace("?", "&");
      }
      url = apiRoot + path;
    }
    return next({
      ...optionsWithPath,
      url
    });
  });
};
var root_url_default = createRootURLMiddleware;
export {
  root_url_default as default
};
//# sourceMappingURL=root-url.mjs.map
