// packages/url/src/has-query-arg.ts
import { getQueryArg } from "./get-query-arg.mjs";
function hasQueryArg(url, arg) {
  return getQueryArg(url, arg) !== void 0;
}
export {
  hasQueryArg
};
//# sourceMappingURL=has-query-arg.mjs.map
