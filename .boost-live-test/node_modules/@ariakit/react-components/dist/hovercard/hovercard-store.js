"use client";
import { usePopoverStoreProps } from "../popover/popover-store.js";
import { useStore, useStoreProps } from "@ariakit/react-store";
import * as Core from "@ariakit/components/hovercard/hovercard-store";
//#region src/hovercard/hovercard-store.ts
function useHovercardStoreProps(store, update, props) {
	useStoreProps(store, props, "timeout");
	useStoreProps(store, props, "showTimeout");
	useStoreProps(store, props, "hideTimeout");
	return usePopoverStoreProps(store, update, props);
}
/**
* Creates a hovercard store to control the state of
* [Hovercard](https://ariakit.com/reference/hovercard) components.
* @see https://ariakit.com/components/hovercard
* @example
* ```jsx
* const hovercard = useHovercardStore({ placement: "top" });
*
* <HovercardAnchor store={hovercard}>@username</HovercardAnchor>
* <Hovercard store={hovercard}>Details</Hovercard>
* ```
*/
function useHovercardStore(props = {}) {
	const [store, update] = useStore(Core.createHovercardStore, props);
	return useHovercardStoreProps(store, update, props);
}
//#endregion
export { useHovercardStore, useHovercardStoreProps };

//# sourceMappingURL=hovercard-store.js.map