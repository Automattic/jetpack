// packages/rich-text/src/store/index.js
import { createReduxStore, register } from "@wordpress/data";
import reducer from "./reducer.mjs";
import * as selectors from "./selectors.mjs";
import * as actions from "./actions.mjs";
var STORE_NAME = "core/rich-text";
var store = createReduxStore(STORE_NAME, {
  reducer,
  selectors,
  actions
});
register(store);
export {
  store
};
//# sourceMappingURL=index.mjs.map
