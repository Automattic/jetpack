"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/higher-order/with-notices/index.tsx
var with_notices_exports = {};
__export(with_notices_exports, {
  default: () => with_notices_default
});
module.exports = __toCommonJS(with_notices_exports);
var import_uuid = require("uuid");
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_list = __toESM(require("../../notice/list.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var with_notices_default = (0, import_compose.createHigherOrderComponent)((OriginalComponent) => {
  function Component(props, ref) {
    const [noticeList, setNoticeList] = (0, import_element.useState)([]);
    const noticeOperations = (0, import_element.useMemo)(() => {
      const createNotice = (notice) => {
        const noticeToAdd = notice.id ? notice : {
          ...notice,
          id: (0, import_uuid.v4)()
        };
        setNoticeList((current) => [...current, noticeToAdd]);
      };
      return {
        createNotice,
        createErrorNotice: (msg) => {
          createNotice({
            status: "error",
            content: msg
          });
        },
        removeNotice: (id) => {
          setNoticeList((current) => current.filter((notice) => notice.id !== id));
        },
        removeAllNotices: () => {
          setNoticeList([]);
        }
      };
    }, []);
    const propsOut = {
      ...props,
      noticeList,
      noticeOperations,
      noticeUI: noticeList.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_list.default, {
        className: "components-with-notices-ui",
        notices: noticeList,
        onRemove: noticeOperations.removeNotice
      })
    };
    return isForwardRef ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OriginalComponent, {
      ...propsOut,
      ref
    }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OriginalComponent, {
      ...propsOut
    });
  }
  let isForwardRef;
  const {
    render
  } = OriginalComponent;
  if (typeof render === "function") {
    isForwardRef = true;
    return (0, import_element.forwardRef)(Component);
  }
  return Component;
}, "withNotices");
//# sourceMappingURL=index.cjs.map
