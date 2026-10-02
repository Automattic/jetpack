// packages/element/src/raw-html.ts
import { Children, createElement } from "./react.mjs";
function RawHTML({ children, ...props }) {
  let rawHtml = "";
  Children.toArray(children).forEach((child) => {
    if (typeof child === "string" && child.trim() !== "") {
      rawHtml += child;
    }
  });
  return createElement("div", {
    dangerouslySetInnerHTML: { __html: rawHtml },
    ...props
  });
}
export {
  RawHTML as default
};
//# sourceMappingURL=raw-html.mjs.map
