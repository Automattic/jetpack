var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

// package-external:@wordpress/i18n
var require_i18n = __commonJS({
  "package-external:@wordpress/i18n"(exports, module) {
    module.exports = window.wp.i18n;
  }
});

// vendor-external:react/jsx-runtime
var require_jsx_runtime = __commonJS({
  "vendor-external:react/jsx-runtime"(exports, module) {
    module.exports = window.ReactJSXRuntime;
  }
});

// routes/forms-inbox/stage.tsx
var import_i18n = __toESM(require_i18n());
var import_jsx_runtime = __toESM(require_jsx_runtime());
var stage = () => {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "20px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: (0, import_i18n.__)("Forms Inbox", "jetpack-forms") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: (0, import_i18n.__)("This is the stage view placeholder.", "jetpack-forms") })
  ] });
};

// routes/forms-inbox/inspector.tsx
var import_i18n2 = __toESM(require_i18n());
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var inspector = () => {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { padding: "20px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: (0, import_i18n2.__)("Inspector", "jetpack-forms") }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: (0, import_i18n2.__)("This is the inspector view placeholder.", "jetpack-forms") })
  ] });
};
export {
  inspector,
  stage
};
