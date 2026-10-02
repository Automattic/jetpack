import { createCompositeStore } from "../composite/composite-store.js";
import { defaultValue } from "@ariakit/utils";
//#region src/toolbar/toolbar-store.ts
/**
* Creates a toolbar store.
*/
function createToolbarStore(props = {}) {
	const syncState = props.store?.getState();
	return createCompositeStore({
		...props,
		orientation: defaultValue(props.orientation, syncState?.orientation, "horizontal"),
		focusLoop: defaultValue(props.focusLoop, syncState?.focusLoop, true)
	});
}
//#endregion
export { createToolbarStore };

//# sourceMappingURL=toolbar-store.js.map