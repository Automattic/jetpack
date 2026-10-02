"use client";
import { HeadingContext } from "./heading-context.js";
import { useContext } from "react";
import { jsx } from "react/jsx-runtime";
//#region src/heading/heading-level.tsx
/**
* A component that sets the heading level for its children. It doesn't render
* any HTML element, just sets the
* [`level`](https://ariakit.com/reference/heading-level#level) prop on the
* context.
* @see https://ariakit.com/components/heading
* @example
* ```jsx
* <HeadingLevel>
*   <Heading>Heading 1</Heading>
*   <HeadingLevel>
*     <Heading>Heading 2</Heading>
*   </HeadingLevel>
* </HeadingLevel>
* ```
*/
function HeadingLevel({ level, children }) {
	const contextLevel = useContext(HeadingContext);
	const nextLevel = Math.max(Math.min(level || contextLevel + 1, 6), 1);
	return /* @__PURE__ */ jsx(HeadingContext.Provider, {
		value: nextLevel,
		children
	});
}
//#endregion
export { HeadingLevel };

//# sourceMappingURL=heading-level.js.map