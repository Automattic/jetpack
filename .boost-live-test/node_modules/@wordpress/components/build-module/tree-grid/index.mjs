// packages/components/src/tree-grid/index.tsx
import { focus } from "@wordpress/dom";
import { forwardRef, useCallback } from "@wordpress/element";
import { UP, DOWN, LEFT, RIGHT, HOME, END } from "@wordpress/keycodes";
import RovingTabIndexContainer from "./roving-tab-index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
import { default as default2 } from "./row.mjs";
import { default as default3 } from "./cell.mjs";
import { default as default4 } from "./item.mjs";
function getRowFocusables(rowElement) {
  const focusablesInRow = focus.focusable.find(rowElement, {
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
  const onKeyDown = useCallback((event) => {
    const {
      keyCode,
      metaKey,
      ctrlKey,
      altKey
    } = event;
    const hasModifierKeyPressed = metaKey || ctrlKey || altKey;
    if (hasModifierKeyPressed || ![UP, DOWN, LEFT, RIGHT, HOME, END].includes(keyCode)) {
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
    const cannotFocusNextColumn = canExpandCollapse && (activeRow.getAttribute("data-expanded") === "false" || activeRow.getAttribute("aria-expanded") === "false") && keyCode === RIGHT;
    if ([LEFT, RIGHT].includes(keyCode)) {
      let nextIndex;
      if (keyCode === LEFT) {
        nextIndex = Math.max(0, currentColumnIndex - 1);
      } else {
        nextIndex = Math.min(currentColumnIndex + 1, focusablesInRow.length - 1);
      }
      if (canExpandCollapse) {
        if (keyCode === LEFT) {
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
        if (keyCode === RIGHT) {
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
    } else if ([UP, DOWN].includes(keyCode)) {
      const rows = Array.from(treeGridElement.querySelectorAll('[role="row"]'));
      const currentRowIndex = rows.indexOf(activeRow);
      let nextRowIndex;
      if (keyCode === UP) {
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
    } else if ([HOME, END].includes(keyCode)) {
      const rows = Array.from(treeGridElement.querySelectorAll('[role="row"]'));
      const currentRowIndex = rows.indexOf(activeRow);
      let nextRowIndex;
      if (keyCode === HOME) {
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
  return /* @__PURE__ */ _jsx(RovingTabIndexContainer, {
    children: /* @__PURE__ */ _jsx("div", {
      role: "application",
      "aria-label": applicationAriaLabel,
      children: /* @__PURE__ */ _jsx("table", {
        ...props,
        role: "treegrid",
        onKeyDown,
        ref,
        children: /* @__PURE__ */ _jsx("tbody", {
          children
        })
      })
    })
  });
}
var TreeGrid = forwardRef(UnforwardedTreeGrid);
TreeGrid.displayName = "TreeGrid";
var tree_grid_default = TreeGrid;
export {
  TreeGrid,
  default3 as TreeGridCell,
  default4 as TreeGridItem,
  default2 as TreeGridRow,
  tree_grid_default as default
};
//# sourceMappingURL=index.mjs.map
