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

// packages/components/src/tree-grid/index.tsx
var tree_grid_exports = {};
__export(tree_grid_exports, {
  TreeGrid: () => TreeGrid,
  TreeGridCell: () => import_cell.default,
  TreeGridItem: () => import_item.default,
  TreeGridRow: () => import_row.default,
  default: () => tree_grid_default
});
module.exports = __toCommonJS(tree_grid_exports);
var import_dom = require("@wordpress/dom");
var import_element = require("@wordpress/element");
var import_keycodes = require("@wordpress/keycodes");
var import_roving_tab_index = __toESM(require("./roving-tab-index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var import_row = __toESM(require("./row.cjs"));
var import_cell = __toESM(require("./cell.cjs"));
var import_item = __toESM(require("./item.cjs"));
function getRowFocusables(rowElement) {
  const focusablesInRow = import_dom.focus.focusable.find(rowElement, {
    sequential: true
  });
  return focusablesInRow.filter((focusable) => {
    return focusable.closest('[role="row"]') === rowElement;
  });
}
function UnforwardedTreeGrid({
  children,
  onExpandRow = () => {
  },
  onCollapseRow = () => {
  },
  onFocusRow = () => {
  },
  applicationAriaLabel,
  ...props
}, ref) {
  const onKeyDown = (0, import_element.useCallback)((event) => {
    const {
      keyCode,
      metaKey,
      ctrlKey,
      altKey
    } = event;
    const hasModifierKeyPressed = metaKey || ctrlKey || altKey;
    if (hasModifierKeyPressed || ![import_keycodes.UP, import_keycodes.DOWN, import_keycodes.LEFT, import_keycodes.RIGHT, import_keycodes.HOME, import_keycodes.END].includes(keyCode)) {
      return;
    }
    event.stopPropagation();
    const {
      activeElement
    } = document;
    const {
      currentTarget: treeGridElement
    } = event;
    if (!activeElement || !treeGridElement.contains(activeElement)) {
      return;
    }
    const activeRow = activeElement.closest('[role="row"]');
    if (!activeRow) {
      return;
    }
    const focusablesInRow = getRowFocusables(activeRow);
    const currentColumnIndex = focusablesInRow.indexOf(activeElement);
    const canExpandCollapse = 0 === currentColumnIndex;
    const cannotFocusNextColumn = canExpandCollapse && (activeRow.getAttribute("data-expanded") === "false" || activeRow.getAttribute("aria-expanded") === "false") && keyCode === import_keycodes.RIGHT;
    if ([import_keycodes.LEFT, import_keycodes.RIGHT].includes(keyCode)) {
      let nextIndex;
      if (keyCode === import_keycodes.LEFT) {
        nextIndex = Math.max(0, currentColumnIndex - 1);
      } else {
        nextIndex = Math.min(currentColumnIndex + 1, focusablesInRow.length - 1);
      }
      if (canExpandCollapse) {
        if (keyCode === import_keycodes.LEFT) {
          if (activeRow.getAttribute("data-expanded") === "true" || activeRow.getAttribute("aria-expanded") === "true") {
            onCollapseRow(activeRow);
            event.preventDefault();
            return;
          }
          const level = Math.max(parseInt(activeRow?.getAttribute("aria-level") ?? "1", 10) - 1, 1);
          const rows = Array.from(treeGridElement.querySelectorAll('[role="row"]'));
          let parentRow = activeRow;
          const currentRowIndex = rows.indexOf(activeRow);
          for (let i = currentRowIndex; i >= 0; i--) {
            const ariaLevel = rows[i].getAttribute("aria-level");
            if (ariaLevel !== null && parseInt(ariaLevel, 10) === level) {
              parentRow = rows[i];
              break;
            }
          }
          getRowFocusables(parentRow)?.[0]?.focus();
        }
        if (keyCode === import_keycodes.RIGHT) {
          if (activeRow.getAttribute("data-expanded") === "false" || activeRow.getAttribute("aria-expanded") === "false") {
            onExpandRow(activeRow);
            event.preventDefault();
            return;
          }
          const focusableItems = getRowFocusables(activeRow);
          if (focusableItems.length > 0) {
            focusableItems[nextIndex]?.focus();
          }
        }
        event.preventDefault();
        return;
      }
      if (cannotFocusNextColumn) {
        return;
      }
      focusablesInRow[nextIndex].focus();
      event.preventDefault();
    } else if ([import_keycodes.UP, import_keycodes.DOWN].includes(keyCode)) {
      const rows = Array.from(treeGridElement.querySelectorAll('[role="row"]'));
      const currentRowIndex = rows.indexOf(activeRow);
      let nextRowIndex;
      if (keyCode === import_keycodes.UP) {
        nextRowIndex = Math.max(0, currentRowIndex - 1);
      } else {
        nextRowIndex = Math.min(currentRowIndex + 1, rows.length - 1);
      }
      if (nextRowIndex === currentRowIndex) {
        event.preventDefault();
        return;
      }
      const focusablesInNextRow = getRowFocusables(rows[nextRowIndex]);
      if (!focusablesInNextRow || !focusablesInNextRow.length) {
        event.preventDefault();
        return;
      }
      const nextIndex = Math.min(currentColumnIndex, focusablesInNextRow.length - 1);
      focusablesInNextRow[nextIndex].focus();
      onFocusRow(event, activeRow, rows[nextRowIndex]);
      event.preventDefault();
    } else if ([import_keycodes.HOME, import_keycodes.END].includes(keyCode)) {
      const rows = Array.from(treeGridElement.querySelectorAll('[role="row"]'));
      const currentRowIndex = rows.indexOf(activeRow);
      let nextRowIndex;
      if (keyCode === import_keycodes.HOME) {
        nextRowIndex = 0;
      } else {
        nextRowIndex = rows.length - 1;
      }
      if (nextRowIndex === currentRowIndex) {
        event.preventDefault();
        return;
      }
      const focusablesInNextRow = getRowFocusables(rows[nextRowIndex]);
      if (!focusablesInNextRow || !focusablesInNextRow.length) {
        event.preventDefault();
        return;
      }
      const nextIndex = Math.min(currentColumnIndex, focusablesInNextRow.length - 1);
      focusablesInNextRow[nextIndex].focus();
      onFocusRow(event, activeRow, rows[nextRowIndex]);
      event.preventDefault();
    }
  }, [onExpandRow, onCollapseRow, onFocusRow]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_roving_tab_index.default, {
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      role: "application",
      "aria-label": applicationAriaLabel,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
        ...props,
        role: "treegrid",
        onKeyDown,
        ref,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
          children
        })
      })
    })
  });
}
var TreeGrid = (0, import_element.forwardRef)(UnforwardedTreeGrid);
TreeGrid.displayName = "TreeGrid";
var tree_grid_default = TreeGrid;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TreeGrid,
  TreeGridCell,
  TreeGridItem,
  TreeGridRow
});
//# sourceMappingURL=index.cjs.map
