// packages/rich-text/src/toggle-format.js
import { speak } from "@wordpress/a11y";
import { __, sprintf } from "@wordpress/i18n";
import { getActiveFormat } from "./get-active-format.mjs";
import { removeFormat } from "./remove-format.mjs";
import { applyFormat } from "./apply-format.mjs";
function toggleFormat(value, format) {
  if (getActiveFormat(value, format.type)) {
    if (format.title) {
      speak(sprintf(__("%s removed."), format.title), "assertive");
    }
    return removeFormat(value, format.type);
  }
  if (format.title) {
    speak(sprintf(__("%s applied."), format.title), "assertive");
  }
  return applyFormat(value, format);
}
export {
  toggleFormat
};
//# sourceMappingURL=toggle-format.mjs.map
