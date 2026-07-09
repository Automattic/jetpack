export const route = {
	/**
	 * Scan does not use a sidebar inspector — the row-level details and
	 * fix / ignore / unignore flows render as DataViews-managed modals.
	 *
	 * @return Always false — Scan never opens the inspector slot.
	 */
	inspector: () => {
		return false;
	},
};
