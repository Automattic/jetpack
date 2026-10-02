// packages/components/src/utils/get-node-text.ts
var getNodeText = (node) => {
  if (node === null) {
    return "";
  }
  switch (typeof node) {
    case "string":
    case "number":
      return node.toString();
    case "object": {
      if (node instanceof Array) {
        return node.map(getNodeText).join("");
      }
      if ("props" in node) {
        return getNodeText(node.props.children);
      }
      return "";
    }
    default:
      return "";
  }
};
var get_node_text_default = getNodeText;
export {
  get_node_text_default as default
};
//# sourceMappingURL=get-node-text.mjs.map
