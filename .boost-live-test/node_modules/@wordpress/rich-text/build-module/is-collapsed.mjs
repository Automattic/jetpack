// packages/rich-text/src/is-collapsed.ts
function isCollapsed({
  start,
  end
}) {
  if (start === void 0 || end === void 0) {
    return;
  }
  return start === end;
}
export {
  isCollapsed
};
//# sourceMappingURL=is-collapsed.mjs.map
