// packages/url/src/get-path-and-query-string.ts
import { getPath, getQueryString } from "./index.mjs";
function getPathAndQueryString(url) {
  const path = getPath(url);
  const queryString = getQueryString(url);
  let value = "/";
  if (path) {
    value += path;
  }
  if (queryString) {
    value += `?${queryString}`;
  }
  return value;
}
export {
  getPathAndQueryString
};
//# sourceMappingURL=get-path-and-query-string.mjs.map
