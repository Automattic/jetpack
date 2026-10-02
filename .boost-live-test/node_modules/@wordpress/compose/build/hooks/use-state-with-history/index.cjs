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

// packages/compose/src/hooks/use-state-with-history/index.ts
var use_state_with_history_exports = {};
__export(use_state_with_history_exports, {
  default: () => useStateWithHistory
});
module.exports = __toCommonJS(use_state_with_history_exports);
var import_undo_manager = require("@wordpress/undo-manager");
var import_element = require("@wordpress/element");
function undoRedoReducer(state, action) {
  switch (action.type) {
    case "UNDO": {
      const undoRecord = state.manager.undo();
      if (undoRecord) {
        return {
          ...state,
          value: undoRecord[0].changes.prop.from
        };
      }
      return state;
    }
    case "REDO": {
      const redoRecord = state.manager.redo();
      if (redoRecord) {
        return {
          ...state,
          value: redoRecord[0].changes.prop.to
        };
      }
      return state;
    }
    case "RECORD": {
      state.manager.addRecord(
        [
          {
            id: "object",
            changes: {
              prop: { from: state.value, to: action.value }
            }
          }
        ],
        action.isStaged
      );
      return {
        ...state,
        value: action.value
      };
    }
  }
  return state;
}
function initReducer(value) {
  return {
    manager: (0, import_undo_manager.createUndoManager)(),
    value
  };
}
function useStateWithHistory(initialValue) {
  const [state, dispatch] = (0, import_element.useReducer)(
    undoRedoReducer,
    initialValue,
    initReducer
  );
  return {
    value: state.value,
    setValue: (0, import_element.useCallback)((newValue, isStaged) => {
      dispatch({
        type: "RECORD",
        value: newValue,
        isStaged
      });
    }, []),
    hasUndo: state.manager.hasUndo(),
    hasRedo: state.manager.hasRedo(),
    undo: (0, import_element.useCallback)(() => {
      dispatch({ type: "UNDO" });
    }, []),
    redo: (0, import_element.useCallback)(() => {
      dispatch({ type: "REDO" });
    }, [])
  };
}
//# sourceMappingURL=index.cjs.map
