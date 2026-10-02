// packages/components/src/guide/page.tsx
import { useEffect } from "@wordpress/element";
import deprecated from "@wordpress/deprecated";
import { jsx as _jsx } from "react/jsx-runtime";
function GuidePage(props) {
  useEffect(() => {
    deprecated("<GuidePage>", {
      since: "5.5",
      alternative: "the `pages` prop in <Guide>"
    });
  }, []);
  return /* @__PURE__ */ _jsx("div", {
    ...props
  });
}
export {
  GuidePage as default
};
//# sourceMappingURL=page.mjs.map
