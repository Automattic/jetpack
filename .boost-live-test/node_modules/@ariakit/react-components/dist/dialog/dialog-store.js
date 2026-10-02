"use client";
import { useDisclosureStoreProps } from "../disclosure/disclosure-store.js";
import { useStore } from "@ariakit/react-store";
import * as Core from "@ariakit/components/dialog/dialog-store";
//#region src/dialog/dialog-store.ts
function useDialogStoreProps(store, update, props) {
	return useDisclosureStoreProps(store, update, props);
}
/**
* Creates a dialog store to control the state of
* [Dialog](https://ariakit.com/components/dialog) components.
* @see https://ariakit.com/components/dialog
* @example
* ```jsx
* const dialog = useDialogStore();
*
* <button onClick={dialog.toggle}>Open dialog</button>
* <Dialog store={dialog}>Content</Dialog>
* ```
*/
function useDialogStore(props = {}) {
	const [store, update] = useStore(Core.createDialogStore, props);
	return useDialogStoreProps(store, update, props);
}
//#endregion
export { useDialogStore, useDialogStoreProps };

//# sourceMappingURL=dialog-store.js.map