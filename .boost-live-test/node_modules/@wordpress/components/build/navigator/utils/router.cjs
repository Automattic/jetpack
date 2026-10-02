"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/navigator/utils/router.ts
var router_exports = {};
__export(router_exports, {
  findParent: () => findParent,
  patternMatch: () => patternMatch
});
module.exports = __toCommonJS(router_exports);
var import_path_to_regexp = require("path-to-regexp");
function matchPath(path, pattern) {
  const matchingFunction = (0, import_path_to_regexp.match)(pattern, {
    decode: decodeURIComponent
  });
  return matchingFunction(path);
}
function patternMatch(path, screens) {
  for (const screen of screens) {
    const matched = matchPath(path, screen.path);
    if (matched) {
      return {
        params: matched.params,
        id: screen.id
      };
    }
  }
  return void 0;
}
function findParent(path, screens) {
  if (!path.startsWith("/")) {
    return void 0;
  }
  const pathParts = path.split("/");
  let parentPath;
  while (pathParts.length > 1 && parentPath === void 0) {
    pathParts.pop();
    const potentialParentPath = pathParts.join("/") === "" ? "/" : pathParts.join("/");
    if (screens.find((screen) => {
      return matchPath(potentialParentPath, screen.path) !== false;
    })) {
      parentPath = potentialParentPath;
    }
  }
  return parentPath;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  findParent,
  patternMatch
});
//# sourceMappingURL=router.cjs.map
