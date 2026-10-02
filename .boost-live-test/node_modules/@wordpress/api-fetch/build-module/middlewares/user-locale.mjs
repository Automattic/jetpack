// packages/api-fetch/src/middlewares/user-locale.ts
import { addQueryArgs, hasQueryArg } from "@wordpress/url";
var userLocaleMiddleware = (options, next) => {
  if (typeof options.url === "string" && !hasQueryArg(options.url, "_locale")) {
    options.url = addQueryArgs(options.url, { _locale: "user" });
  }
  if (typeof options.path === "string" && !hasQueryArg(options.path, "_locale")) {
    options.path = addQueryArgs(options.path, { _locale: "user" });
  }
  return next(options);
};
var user_locale_default = userLocaleMiddleware;
export {
  user_locale_default as default
};
//# sourceMappingURL=user-locale.mjs.map
