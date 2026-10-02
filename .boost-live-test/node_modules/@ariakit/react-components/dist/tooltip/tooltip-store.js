"use client";
import { useHovercardStoreProps } from "../hovercard/hovercard-store.js";
import { useStore, useStoreProps } from "@ariakit/react-store";
import * as Core from "@ariakit/components/tooltip/tooltip-store";
//#region src/tooltip/tooltip-store.ts
function useTooltipStoreProps(store, update, props) {
	useStoreProps(store, props, "type");
	useStoreProps(store, props, "skipTimeout");
	return useHovercardStoreProps(store, update, props);
}
/**
* Creates a tooltip store to control the state of
* [Tooltip](https://ariakit.com/components/tooltip) components.
* @see https://ariakit.com/components/tooltip
* @example
* ```jsx
* const tooltip = useTooltipStore();
*
* <TooltipAnchor store={tooltip}>Anchor</TooltipAnchor>
* <Tooltip store={tooltip}>Tooltip</Tooltip>
* ```
*/
function useTooltipStore(props = {}) {
	const [store, update] = useStore(Core.createTooltipStore, props);
	return useTooltipStoreProps(store, update, props);
}
//#endregion
export { useTooltipStore, useTooltipStoreProps };

//# sourceMappingURL=tooltip-store.js.map