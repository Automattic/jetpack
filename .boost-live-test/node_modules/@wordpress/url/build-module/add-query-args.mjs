// packages/url/src/add-query-args.ts
import { getQueryArgs } from "./get-query-args.mjs";
import { buildQueryString } from "./build-query-string.mjs";
import { getFragment } from "./get-fragment.mjs";
function addQueryArgs(url = "", args) {
  if (!args || !Object.keys(args).length) {
    return url;
  }
  const fragment = getFragment(url) || "";
  let baseUrl = url.replace(fragment, "");
  const queryStringIndex = url.indexOf("?");
  if (queryStringIndex !== -1) {
    args = Object.assign(getQueryArgs(url), args);
    baseUrl = baseUrl.substr(0, queryStringIndex);
  }
  return baseUrl + "?" + buildQueryString(args) + fragment;
}
export {
  addQueryArgs
};
//# sourceMappingURL=add-query-args.mjs.map
