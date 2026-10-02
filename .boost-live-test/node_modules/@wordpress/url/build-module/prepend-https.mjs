// packages/url/src/prepend-https.ts
import { prependHTTP } from "./prepend-http.mjs";
function prependHTTPS(url) {
  if (!url) {
    return url;
  }
  if (url.startsWith("http://")) {
    return url;
  }
  url = prependHTTP(url);
  return url.replace(/^http:/, "https:");
}
export {
  prependHTTPS
};
//# sourceMappingURL=prepend-https.mjs.map
