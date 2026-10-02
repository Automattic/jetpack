// packages/api-fetch/src/middlewares/theme-preview.ts
import { addQueryArgs, getQueryArg, removeQueryArgs } from "@wordpress/url";
var createThemePreviewMiddleware = (themePath) => (options, next) => {
  if (typeof options.url === "string") {
    const wpThemePreview = getQueryArg(
      options.url,
      "wp_theme_preview"
    );
    if (wpThemePreview === void 0) {
      options.url = addQueryArgs(options.url, {
        wp_theme_preview: themePath
      });
    } else if (wpThemePreview === "") {
      options.url = removeQueryArgs(
        options.url,
        "wp_theme_preview"
      );
    }
  }
  if (typeof options.path === "string") {
    const wpThemePreview = getQueryArg(
      options.path,
      "wp_theme_preview"
    );
    if (wpThemePreview === void 0) {
      options.path = addQueryArgs(options.path, {
        wp_theme_preview: themePath
      });
    } else if (wpThemePreview === "") {
      options.path = removeQueryArgs(
        options.path,
        "wp_theme_preview"
      );
    }
  }
  return next(options);
};
var theme_preview_default = createThemePreviewMiddleware;
export {
  theme_preview_default as default
};
//# sourceMappingURL=theme-preview.mjs.map
