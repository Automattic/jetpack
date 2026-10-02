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

// packages/components/src/input-control/reducer/reducer.ts
var reducer_exports = {};
__export(reducer_exports, {
  useInputControlStateReducer: () => useInputControlStateReducer
});
module.exports = __toCommonJS(reducer_exports);
var import_element = require("@wordpress/element");
var import_state = require("./state.cjs");
var actions = __toESM(require("./actions.cjs"));
function mergeInitialState(initialState = import_state.initialInputControlState) {
  const {
    value
  } = initialState;
  return {
    ...import_state.initialInputControlState,
    ...initialState,
    initialValue: value
  };
}
function inputControlStateReducer(composedStateReducers) {
  return (state, action) => {
    const nextState = {
      ...state
    };
    switch (action.type) {
      /*
       * Controlled updates
       */
      case actions.CONTROL:
        nextState.value = action.payload.value;
        nextState.isDirty = false;
        nextState._event = void 0;
        return nextState;
      /**
       * Keyboard events
       */
      case actions.PRESS_UP:
        nextState.isDirty = false;
        break;
      case actions.PRESS_DOWN:
        nextState.isDirty = false;
        break;
      /**
       * Drag events
       */
      case actions.DRAG_START:
        nextState.isDragging = true;
        break;
      case actions.DRAG_END:
        nextState.isDragging = false;
        break;
      /**
       * Input events
       */
      case actions.CHANGE:
        nextState.error = null;
        nextState.value = action.payload.value;
        if (state.isPressEnterToChange) {
          nextState.isDirty = true;
        }
        break;
      case actions.COMMIT:
        nextState.value = action.payload.value;
        nextState.isDirty = false;
        break;
      case actions.RESET:
        nextState.error = null;
        nextState.isDirty = false;
        nextState.value = action.payload.value || state.initialValue;
        break;
      /**
       * Validation
       */
      case actions.INVALIDATE:
        nextState.error = action.payload.error;
        break;
    }
    nextState._event = action.payload.event;
    return composedStateReducers(nextState, action);
  };
}
function useInputControlStateReducer(stateReducer = import_state.initialStateReducer, initialState = import_state.initialInputControlState, onChangeHandler) {
  const [state, dispatch] = (0, import_element.useReducer)(inputControlStateReducer(stateReducer), mergeInitialState(initialState));
  const createChangeEvent = (type) => (nextValue, event) => {
    dispatch({
      type,
      payload: {
        value: nextValue,
        event
      }
    });
  };
  const createKeyEvent = (type) => (event) => {
    dispatch({
      type,
      payload: {
        event
      }
    });
  };
  const createDragEvent = (type) => (payload) => {
    dispatch({
      type,
      payload
    });
  };
  const change = createChangeEvent(actions.CHANGE);
  const invalidate = (error, event) => dispatch({
    type: actions.INVALIDATE,
    payload: {
      error,
      event
    }
  });
  const reset = createChangeEvent(actions.RESET);
  const commit = createChangeEvent(actions.COMMIT);
  const dragStart = createDragEvent(actions.DRAG_START);
  const drag = createDragEvent(actions.DRAG);
  const dragEnd = createDragEvent(actions.DRAG_END);
  const pressUp = createKeyEvent(actions.PRESS_UP);
  const pressDown = createKeyEvent(actions.PRESS_DOWN);
  const pressEnter = createKeyEvent(actions.PRESS_ENTER);
  const currentStateRef = (0, import_element.useRef)(state);
  const refPropsRef = (0, import_element.useRef)({
    value: initialState.value,
    onChangeHandler
  });
  (0, import_element.useLayoutEffect)(() => {
    currentStateRef.current = state;
    refPropsRef.current = {
      value: initialState.value,
      onChangeHandler
    };
  });
  (0, import_element.useLayoutEffect)(() => {
    if (currentStateRef.current._event !== void 0 && state.value !== refPropsRef.current.value && !state.isDirty) {
      refPropsRef.current.onChangeHandler(state.value ?? "", {
        event: currentStateRef.current._event
      });
    }
  }, [state.value, state.isDirty]);
  (0, import_element.useLayoutEffect)(() => {
    if (initialState.value !== currentStateRef.current.value && !currentStateRef.current.isDirty) {
      dispatch({
        type: actions.CONTROL,
        payload: {
          value: initialState.value ?? ""
        }
      });
    }
  }, [initialState.value]);
  return {
    change,
    commit,
    dispatch,
    drag,
    dragEnd,
    dragStart,
    invalidate,
    pressDown,
    pressEnter,
    pressUp,
    reset,
    state
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useInputControlStateReducer
});
//# sourceMappingURL=reducer.cjs.map
