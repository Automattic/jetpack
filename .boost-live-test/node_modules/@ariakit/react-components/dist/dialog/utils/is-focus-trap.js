"use client";
//#region src/dialog/utils/is-focus-trap.ts
function isFocusTrap(element, ...ids) {
	if (!element) return false;
	const attr = element.getAttribute("data-focus-trap");
	if (attr == null) return false;
	if (!ids.length) return true;
	if (attr === "") return false;
	return ids.some((id) => attr === id);
}
//#endregion
export { isFocusTrap };

//# sourceMappingURL=is-focus-trap.js.map