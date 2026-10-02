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

// packages/components/src/query-controls/terms.ts
var terms_exports = {};
__export(terms_exports, {
  buildTermsTree: () => buildTermsTree
});
module.exports = __toCommonJS(terms_exports);
var ensureParentsAreDefined = (terms) => {
  return terms.every((term) => term.parent !== null);
};
function buildTermsTree(flatTerms) {
  const flatTermsWithParentAndChildren = flatTerms.map((term) => ({
    children: [],
    parent: null,
    ...term,
    id: String(term.id)
  }));
  if (!ensureParentsAreDefined(flatTermsWithParentAndChildren)) {
    return flatTermsWithParentAndChildren;
  }
  const termsByParent = flatTermsWithParentAndChildren.reduce((acc, term) => {
    const {
      parent
    } = term;
    if (!acc[parent]) {
      acc[parent] = [];
    }
    acc[parent].push(term);
    return acc;
  }, {});
  const fillWithChildren = (terms) => {
    return terms.map((term) => {
      const children = termsByParent[term.id];
      return {
        ...term,
        children: children && children.length ? fillWithChildren(children) : []
      };
    });
  };
  return fillWithChildren(termsByParent["0"] || []);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildTermsTree
});
//# sourceMappingURL=terms.cjs.map
