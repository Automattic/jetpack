// packages/hooks/src/createDidHook.ts
import validateHookName from "./validateHookName.mjs";
function createDidHook(hooks, storeKey) {
  return function didHook(hookName) {
    const hooksStore = hooks[storeKey];
    if (!validateHookName(hookName)) {
      return;
    }
    return hooksStore[hookName] && hooksStore[hookName].runs ? hooksStore[hookName].runs : 0;
  };
}
var createDidHook_default = createDidHook;
export {
  createDidHook_default as default
};
//# sourceMappingURL=createDidHook.mjs.map
