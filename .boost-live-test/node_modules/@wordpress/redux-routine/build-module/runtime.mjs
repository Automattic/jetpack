// packages/redux-routine/src/runtime.ts
import { create } from "rungen";
import isPromise from "is-promise";
import { isActionOfType, isAction } from "./is-action.mjs";
function createRuntime(controls = {}, dispatch) {
  const rungenControls = Object.entries(controls).map(
    ([actionType, control]) => (value, next, iterate, yieldNext, yieldError) => {
      if (!isActionOfType(value, actionType)) {
        return false;
      }
      const routine = control(value);
      if (isPromise(routine)) {
        routine.then(yieldNext, yieldError);
      } else {
        yieldNext(routine);
      }
      return true;
    }
  );
  const unhandledActionControl = (value, next) => {
    if (!isAction(value)) {
      return false;
    }
    dispatch(value);
    next();
    return true;
  };
  rungenControls.push(unhandledActionControl);
  const rungenRuntime = create(rungenControls);
  return (action) => new Promise(
    (resolve, reject) => rungenRuntime(
      action,
      (result) => {
        if (isAction(result)) {
          dispatch(result);
        }
        resolve(result);
      },
      reject
    )
  );
}
export {
  createRuntime as default
};
//# sourceMappingURL=runtime.mjs.map
