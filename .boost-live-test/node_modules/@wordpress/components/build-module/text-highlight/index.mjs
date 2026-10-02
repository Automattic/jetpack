// packages/components/src/text-highlight/index.tsx
import { createInterpolateElement } from "@wordpress/element";
import { escapeRegExp } from "../utils/strings.mjs";
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
var TextHighlight = (props) => {
  const {
    text = "",
    highlight = ""
  } = props;
  const trimmedHighlightText = highlight.trim();
  if (!trimmedHighlightText) {
    return /* @__PURE__ */ _jsx(_Fragment, {
      children: text
    });
  }
  const regex = new RegExp(`(${escapeRegExp(trimmedHighlightText)})`, "gi");
  return createInterpolateElement(text.replace(regex, "<mark>$&</mark>"), {
    mark: /* @__PURE__ */ _jsx("mark", {})
  });
};
TextHighlight.displayName = "TextHighlight";
var text_highlight_default = TextHighlight;
export {
  TextHighlight,
  text_highlight_default as default
};
//# sourceMappingURL=index.mjs.map
