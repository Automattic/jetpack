// packages/components/src/input-control/reducer/reducer.ts
import { useReducer, useLayoutEffect, useRef } from "@wordpress/element";
import { initialInputControlState, initialStateReducer } from "./state.mjs";
import * as actions from "./actions.mjs";
function mergeInitialState(initialState = initialInputControlState) {
  const {
    value
  } = initialState;
  return {
    ...initialInputControlState,
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
function useInputControlStateReducer(stateReducer = initialStateReducer, initialState = initialInputControlState, onChangeHandler) {
  const [state, dispatch] = useReducer(inputControlStateReducer(stateReducer), mergeInitialState(initialState));
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
  const currentStateRef = useRef(state);
  const refPropsRef = useRef({
    value: initialState.value,
    onChangeHandler
  });
  useLayoutEffect(() => {
    currentStateRef.current = state;
    refPropsRef.current = {
      value: initialState.value,
      onChangeHandler
    };
  });
  useLayoutEffect(() => {
    if (currentStateRef.current._event !== void 0 && state.value !== refPropsRef.current.value && !state.isDirty) {
      refPropsRef.current.onChangeHandler(state.value ?? "", {
        event: currentStateRef.current._event
      });
    }
  }, [state.value, state.isDirty]);
  useLayoutEffect(() => {
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
export {
  useInputControlStateReducer
};
//# sourceMappingURL=reducer.mjs.map
