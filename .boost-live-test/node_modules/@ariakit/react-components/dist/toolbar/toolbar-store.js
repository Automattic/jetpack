"use client";
import { useCompositeStoreProps } from "../composite/composite-store.js";
import { useStore } from "@ariakit/react-store";
import * as Core from "@ariakit/components/toolbar/toolbar-store";
//#region src/toolbar/toolbar-store.ts
function useToolbarStoreProps(store, update, props) {
	return useCompositeStoreProps(store, update, props);
}
/**
* Creates a toolbar store to control the state of
* [Toolbar](https://ariakit.com/components/toolbar) components.
* @see https://ariakit.com/components/toolbar
* @example
* ```jsx
* const toolbar = useToolbarStore();
*
* <Toolbar store={toolbar}>
*   <ToolbarItem>Item 1</ToolbarItem>
*   <ToolbarItem>Item 2</ToolbarItem>
*   <ToolbarItem>Item 3</ToolbarItem>
* </Toolbar>
* ```
*/
function useToolbarStore(props = {}) {
	const [store, update] = useStore(Core.createToolbarStore, props);
	return useToolbarStoreProps(store, update, props);
}
//#endregion
export { useToolbarStore, useToolbarStoreProps };

//# sourceMappingURL=toolbar-store.js.map