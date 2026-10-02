"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FloatingNode = FloatingNode;
exports.FloatingTree = FloatingTree;
exports.useFloatingNodeId = useFloatingNodeId;
exports.useFloatingTree = exports.useFloatingParentNodeId = void 0;
var React = _interopRequireWildcard(require("react"));
var _useId = require("@base-ui/utils/useId");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useRefWithInit = require("@base-ui/utils/useRefWithInit");
var _FloatingTreeStore = require("./FloatingTreeStore");
var _jsxRuntime = require("react/jsx-runtime");
const FloatingNodeContext = /*#__PURE__*/React.createContext(null);
if (process.env.NODE_ENV !== "production") FloatingNodeContext.displayName = "FloatingNodeContext";
const FloatingTreeContext = /*#__PURE__*/React.createContext(null);

/**
 * Returns the parent node id for nested floating elements, if available.
 * Returns `null` for top-level floating elements.
 */
if (process.env.NODE_ENV !== "production") FloatingTreeContext.displayName = "FloatingTreeContext";
const useFloatingParentNodeId = () => React.useContext(FloatingNodeContext)?.id || null;

/**
 * Returns the nearest floating tree context, if available.
 */
exports.useFloatingParentNodeId = useFloatingParentNodeId;
const useFloatingTree = externalTree => {
  const contextTree = React.useContext(FloatingTreeContext);
  return externalTree ?? contextTree;
};

/**
 * Registers a node into the `FloatingTree`, returning its id.
 * @see https://floating-ui.com/docs/FloatingTree
 */
exports.useFloatingTree = useFloatingTree;
function useFloatingNodeId(externalTree) {
  const id = (0, _useId.useId)();
  const tree = useFloatingTree(externalTree);
  const parentId = useFloatingParentNodeId();
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!id) {
      return undefined;
    }
    const node = {
      id,
      parentId
    };
    tree?.addNode(node);
    return () => {
      tree?.removeNode(node);
    };
  }, [tree, id, parentId]);
  return id;
}
/**
 * Provides parent node context for nested floating elements.
 * @see https://floating-ui.com/docs/FloatingTree
 * @internal
 */
function FloatingNode(props) {
  const {
    children,
    id
  } = props;
  const parentId = useFloatingParentNodeId();
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(FloatingNodeContext.Provider, {
    value: React.useMemo(() => ({
      id,
      parentId
    }), [id, parentId]),
    children: children
  });
}
/**
 * Provides context for nested floating elements when they are not children of
 * each other on the DOM.
 * This is not necessary in all cases, except when there must be explicit communication between parent and child floating elements. It is necessary for:
 * - The `bubbles` option in the `useDismiss()` Hook
 * - Nested virtual list navigation
 * - Nested floating elements that each open on hover
 * - Custom communication between parent and child floating elements
 * @see https://floating-ui.com/docs/FloatingTree
 * @internal
 */
function FloatingTree(props) {
  const {
    children,
    externalTree
  } = props;
  const tree = (0, _useRefWithInit.useRefWithInit)(() => externalTree ?? new _FloatingTreeStore.FloatingTreeStore()).current;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(FloatingTreeContext.Provider, {
    value: tree,
    children: children
  });
}