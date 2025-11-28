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

// package-external:@wordpress/element
var require_element = __commonJS({
  "package-external:@wordpress/element"(exports, module) {
    module.exports = window.wp.element;
  }
});

// vendor-external:react/jsx-runtime
var require_jsx_runtime = __commonJS({
  "vendor-external:react/jsx-runtime"(exports, module) {
    module.exports = window.ReactJSXRuntime;
  }
});

// routes/forms-inbox/stage.tsx
var import_element = __toESM(require_element());
var import_jsx_runtime = __toESM(require_jsx_runtime());
import { useSearch, useNavigate } from "@wordpress/route";
var STATE_CHANGE_EVENT = "jetpack-forms-state-change";
var stage = () => {
  const searchParams = useSearch({ strict: false });
  const navigate = useNavigate();
  const updateSearchParams = (0, import_element.useCallback)(
    (params) => {
      navigate({
        search: (prev) => ({
          ...prev,
          ...params
        }),
        replace: true
      });
    },
    [navigate]
  );
  (0, import_element.useEffect)(() => {
    const state = {
      status: searchParams?.status || "inbox",
      selectedIds: searchParams?.r?.split(",").filter(Boolean) || [],
      search: searchParams?.search || ""
    };
    if (!window.__jetpackForms) {
      window.__jetpackForms = {
        state,
        navigate: updateSearchParams,
        inspectorResponse: null,
        setInspectorResponse(response) {
          this.inspectorResponse = response;
          window.dispatchEvent(new CustomEvent("jetpack-forms-inspector-change"));
        }
      };
    } else {
      window.__jetpackForms.state = state;
      window.__jetpackForms.navigate = updateSearchParams;
    }
    window.dispatchEvent(new CustomEvent(STATE_CHANGE_EVENT));
  }, [searchParams, updateSearchParams]);
  (0, import_element.useEffect)(() => {
    if (typeof window.jetpackFormsInit === "function") {
      window.jetpackFormsInit();
    }
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      id: "jp-forms-dashboard",
      className: "jp-forms-dashboard",
      style: { height: "100%", width: "100%" }
    }
  );
};

// routes/forms-inbox/inspector.tsx
var import_element2 = __toESM(require_element());
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var INSPECTOR_CHANGE_EVENT = "jetpack-forms-inspector-change";
function subscribeToInspector(callback) {
  window.addEventListener(INSPECTOR_CHANGE_EVENT, callback);
  return () => window.removeEventListener(INSPECTOR_CHANGE_EVENT, callback);
}
function getInspectorSnapshot() {
  return window.__jetpackForms?.inspectorResponse ?? null;
}
function useInspectorResponse() {
  return (0, import_element2.useSyncExternalStore)(subscribeToInspector, getInspectorSnapshot, () => null);
}
var inspector = () => {
  const response = useInspectorResponse();
  const containerRef = (0, import_element2.useRef)(null);
  (0, import_element2.useLayoutEffect)(() => {
    const surface = containerRef.current?.closest(".boot-layout__inspector");
    if (surface instanceof HTMLElement) {
      surface.style.display = response ? "" : "none";
    }
  }, [response]);
  if (!response) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { ref: containerRef, style: { display: "none" } });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      ref: containerRef,
      id: "jp-forms-inspector",
      className: "jp-forms-inspector",
      style: { height: "100%", overflow: "auto" }
    }
  );
};
export {
  inspector,
  stage
};
