"use client";
import { useCompositeStoreProps } from "../composite/composite-store.js";
import { useStore } from "@ariakit/react-store";
import * as Core from "@ariakit/components/menubar/menubar-store";
//#region src/menubar/menubar-store.ts
function useMenubarStoreProps(store, update, props) {
	return useCompositeStoreProps(store, update, props);
}
/**
* Creates a menubar store to control the state of
* [Menubar](https://ariakit.com/components/menubar) components.
* @see https://ariakit.com/components/menubar
* @example
* ```jsx
* const menubar = useMenubarStore();
*
* <Menubar store={menubar} />
* ```
*/
function useMenubarStore(props = {}) {
	const [store, update] = useStore(Core.createMenubarStore, props);
	return useMenubarStoreProps(store, update, props);
}
//#endregion
export { useMenubarStore, useMenubarStoreProps };

//# sourceMappingURL=menubar-store.js.map