/**
 * No own settings — the reading is fixed by the connected plan, not by the
 * dashboard date picker. `Record< never, never >` (not `Record< string, never >`)
 * so `render.tsx` can compose host fields like `reportParams` without collapsing
 * them to `never`.
 */
export type PlanUsageAttributes = Record< never, never >;

export default {
	attributes: [],
	example: {
		attributes: {},
	},
};
