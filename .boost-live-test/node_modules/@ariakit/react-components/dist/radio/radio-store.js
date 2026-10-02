"use client";
import { useCompositeStoreOptions, useCompositeStoreProps } from "../composite/composite-store.js";
import { useStore, useStoreProps } from "@ariakit/react-store";
import * as Core from "@ariakit/components/radio/radio-store";
//#region src/radio/radio-store.ts
function useRadioStoreProps(store, update, props) {
	store = useCompositeStoreProps(store, update, props);
	useStoreProps(store, props, "value", "setValue");
	return store;
}
/**
* Creates a radio store to control the state of
* [Radio](https://ariakit.com/components/radio) components.
* @see https://ariakit.com/components/radio
* @example
* ```jsx
* const radio = useRadioStore();
*
* <RadioGroup store={radio}>
*   <Radio value="Apple" />
*   <Radio value="Orange" />
* </RadioGroup>
* ```
*/
function useRadioStore(props = {}) {
	props = useCompositeStoreOptions(props);
	const [store, update] = useStore(Core.createRadioStore, props);
	return useRadioStoreProps(store, update, props);
}
//#endregion
export { useRadioStore, useRadioStoreProps };

//# sourceMappingURL=radio-store.js.map