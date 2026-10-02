// packages/url/src/prepend-http.ts
import { isEmail } from "./is-email.mjs";
var USABLE_HREF_REGEXP = /^(?:[a-z]+:|#|\?|\.|\/)/i;
function prependHTTP(url) {
  if (!url) {
    return url;
  }
  url = url.trim();
  if (!USABLE_HREF_REGEXP.test(url) && !isEmail(url)) {
    return "http://" + url;
  }
  return url;
}
export {
  prependHTTP
};
//# sourceMappingURL=prepend-http.mjs.map
