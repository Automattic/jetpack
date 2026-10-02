// packages/url/src/remove-query-args.ts
import { getQueryArgs } from "./get-query-args.mjs";
import { buildQueryString } from "./build-query-string.mjs";
function removeQueryArgs(url, ...args) {
  const fragment = url.replace(/^[^#]*/, "");
  url = url.replace(/#.*/, "");
  const queryStringIndex = url.indexOf("?");
  if (queryStringIndex === -1) {
    return url + fragment;
  }
  const query = getQueryArgs(url);
  const baseURL = url.substr(0, queryStringIndex);
  args.forEach((arg) => delete query[arg]);
  const queryString = buildQueryString(query);
  const updatedUrl = queryString ? baseURL + "?" + queryString : baseURL;
  return updatedUrl + fragment;
}
export {
  removeQueryArgs
};
//# sourceMappingURL=remove-query-args.mjs.map
