// packages/rich-text/src/store/reducer.js
import { combineReducers } from "@wordpress/data";
function formatTypes(state = {}, action) {
  switch (action.type) {
    case "ADD_FORMAT_TYPES":
      return {
        ...state,
        // Key format types by their name.
        ...action.formatTypes.reduce(
          (newFormatTypes, type) => ({
            ...newFormatTypes,
            [type.name]: type
          }),
          {}
        )
      };
    case "REMOVE_FORMAT_TYPES":
      return Object.fromEntries(
        Object.entries(state).filter(
          ([key]) => !action.names.includes(key)
        )
      );
  }
  return state;
}
var reducer_default = combineReducers({ formatTypes });
export {
  reducer_default as default,
  formatTypes
};
//# sourceMappingURL=reducer.mjs.map
