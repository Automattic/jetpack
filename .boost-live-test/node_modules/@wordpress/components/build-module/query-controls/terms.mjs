// packages/components/src/query-controls/terms.ts
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
export {
  buildTermsTree
};
//# sourceMappingURL=terms.mjs.map
