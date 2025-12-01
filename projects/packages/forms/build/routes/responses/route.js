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

// package-external:@wordpress/core-data
var require_core_data = __commonJS({
  "package-external:@wordpress/core-data"(exports, module) {
    module.exports = window.wp.coreData;
  }
});

// package-external:@wordpress/data
var require_data = __commonJS({
  "package-external:@wordpress/data"(exports, module) {
    module.exports = window.wp.data;
  }
});

// routes/responses/route.tsx
var import_core_data = __toESM(require_core_data());
var import_data = __toESM(require_data());
var route = {
  /**
   * Determines when to show the inspector panel.
   * Only show when items are selected.
   * @param root0
   * @param root0.params
   * @param root0.params.view
   * @param root0.search
   * @param root0.search.responseIds
   */
  inspector: async ({
    search
  }) => {
    return !!(search?.responseIds && search.responseIds.length > 0);
  },
  /**
   * Preloads data before the route renders.
   * @param root0
   * @param root0.params
   * @param root0.params.view
   * @param root0.search
   * @param root0.search.page
   */
  loader: async ({
    params,
    search
  }) => {
    const status = params.view === "spam" ? "spam" : params.view === "trash" ? "trash" : "publish";
    await (0, import_data.resolveSelect)(import_core_data.store).getEntityRecords("postType", "feedback", {
      per_page: 20,
      page: search.page || 1,
      status,
      orderby: "date",
      order: "desc"
    });
  },
  /**
   * Validates that the route can be accessed.
   * Checks if the feedback post type exists.
   */
  beforeLoad: async () => {
    try {
      await (0, import_data.resolveSelect)(import_core_data.store).getPostType("feedback");
    } catch {
    }
  }
};
export {
  route
};
