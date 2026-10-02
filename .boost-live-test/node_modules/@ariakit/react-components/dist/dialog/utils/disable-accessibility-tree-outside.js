"use client";
import { setAttribute } from "./orchestrate.js";
//#region src/dialog/utils/disable-accessibility-tree-outside.ts
function hideElementFromAccessibilityTree(element) {
	return setAttribute(element, "aria-hidden", "true");
}
//#endregion
export { hideElementFromAccessibilityTree };

//# sourceMappingURL=disable-accessibility-tree-outside.js.map