"use client";
import { useSafeLayoutEffect } from "@ariakit/react-utils";
import { chain } from "@ariakit/utils";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { jsx } from "react/jsx-runtime";
import { sync } from "@ariakit/store";
//#region src/dialog/utils/use-nested-dialogs.tsx
const NestedDialogsContext = createContext({});
function useNestedDialogs(store) {
	const context = useContext(NestedDialogsContext);
	const [dialogs, setDialogs] = useState([]);
	const add = useCallback((dialog) => {
		setDialogs((dialogs) => [...dialogs, dialog]);
		return chain(context.add?.(dialog), () => {
			setDialogs((dialogs) => dialogs.filter((d) => d !== dialog));
		});
	}, [context]);
	useSafeLayoutEffect(() => {
		return sync(store, ["open", "contentElement"], (state) => {
			if (!state.open) return;
			if (!state.contentElement) return;
			return context.add?.(store);
		});
	}, [store, context]);
	const providerValue = useMemo(() => ({
		store,
		add
	}), [store, add]);
	return {
		wrapElement: useCallback((element) => /* @__PURE__ */ jsx(NestedDialogsContext.Provider, {
			value: providerValue,
			children: element
		}), [providerValue]),
		nestedDialogs: dialogs
	};
}
//#endregion
export { useNestedDialogs };

//# sourceMappingURL=use-nested-dialogs.js.map