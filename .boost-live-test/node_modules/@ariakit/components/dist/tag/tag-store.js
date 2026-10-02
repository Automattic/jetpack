import { createCompositeStore } from "../composite/composite-store.js";
import { createStore, setup, sync } from "@ariakit/store";
import { UndoManager, applyState, defaultValue } from "@ariakit/utils";
//#region src/tag/tag-store.ts
/**
* Creates a tag store.
*/
function createTagStore(props = {}) {
	const syncState = props.store?.getState();
	const composite = createCompositeStore(props);
	const initialState = {
		...composite.getState(),
		inputElement: defaultValue(syncState?.inputElement, null),
		labelElement: defaultValue(syncState?.labelElement, null),
		value: defaultValue(props.value, syncState?.value, props.defaultValue, ""),
		values: defaultValue(props.values, syncState?.values, props.defaultValues, [])
	};
	const tag = createStore(initialState, composite, props.store);
	setup(tag, () => sync(tag, ["inputElement", "activeId"], (state) => {
		if (!state.inputElement) return;
		if (state.activeId !== void 0) return;
		tag.setState("activeId", state.inputElement.id);
	}));
	const setValues = (values) => {
		const { values: previousValues } = tag.getState();
		UndoManager.execute(() => {
			let changed = true;
			tag.setState("values", (prev) => {
				const next = applyState(values, prev);
				if (next === prev) changed = false;
				return next;
			});
			if (!changed) return;
			return () => {
				tag.setState("values", previousValues);
				composite.move(tag.getState().inputElement?.id);
			};
		});
	};
	return {
		...composite,
		...tag,
		setInputElement: (inputElement) => tag.setState("inputElement", inputElement),
		setLabelElement: (labelElement) => tag.setState("labelElement", labelElement),
		setValue: (value) => tag.setState("value", value),
		resetValue: () => tag.setState("value", initialState.value),
		setValues,
		addValue: (value) => {
			setValues((values) => {
				if (values.includes(value)) return values;
				return [...values, value];
			});
		},
		removeValue: (value) => setValues((values) => values.filter((v) => v !== value))
	};
}
//#endregion
export { createTagStore };

//# sourceMappingURL=tag-store.js.map