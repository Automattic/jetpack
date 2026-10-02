// packages/components/src/notice/list.tsx
import clsx from "clsx";
import Notice from "./index.mjs";
import { createElement as _createElement } from "react";
import { jsxs as _jsxs } from "react/jsx-runtime";
var noop = () => {
};
function NoticeList({
  notices,
  onRemove = noop,
  className,
  children
}) {
  const removeNotice = (id) => () => onRemove(id);
  className = clsx("components-notice-list", className);
  return /* @__PURE__ */ _jsxs("div", {
    className,
    children: [children, [...notices].reverse().map((notice) => {
      const {
        content,
        ...restNotice
      } = notice;
      return /* @__PURE__ */ _createElement(Notice, {
        ...restNotice,
        key: notice.id,
        onRemove: removeNotice(notice.id)
      }, notice.content);
    })]
  });
}
var list_default = NoticeList;
export {
  list_default as default
};
//# sourceMappingURL=list.mjs.map
