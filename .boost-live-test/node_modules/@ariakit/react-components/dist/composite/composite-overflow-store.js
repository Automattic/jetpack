"use client";
import { usePopoverStoreProps } from "../popover/popover-store.js";
import { useStore } from "@ariakit/react-store";
import * as Core from "@ariakit/components/composite/composite-overflow-store";
//#region src/composite/composite-overflow-store.ts
function useCompositeOverflowStoreProps(store, update, props) {
	return usePopoverStoreProps(store, update, props);
}
/**
* Creates a composite overflow store.
* @see https://ariakit.com/components/composite
* @example
* ```jsx
* const composite = useCompositeStore();
* const overflow = useCompositeOverflowStore();
* <Composite store={composite}>
*   <CompositeItem>Item 1</CompositeItem>
*   <CompositeItem>Item 2</CompositeItem>
*   <CompositeOverflowDisclosure store={overflow}>
*     +2 items
*   </CompositeOverflowDisclosure>
*   <CompositeOverflow store={overflow}>
*     <CompositeItem>Item 3</CompositeItem>
*     <CompositeItem>Item 4</CompositeItem>
*   </CompositeOverflow>
* </Composite>
* ```
*/
function useCompositeOverflowStore(props = {}) {
	const [store, update] = useStore(Core.createCompositeOverflowStore, props);
	return useCompositeOverflowStoreProps(store, update, props);
}
//#endregion
export { useCompositeOverflowStore, useCompositeOverflowStoreProps };

//# sourceMappingURL=composite-overflow-store.js.map