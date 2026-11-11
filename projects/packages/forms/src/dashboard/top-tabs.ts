/**
 * The dashboard's top tabs and where each lands, kept import-free so the root route bundle stays small.
 */

export const TOP_TAB_PATHS = {
	forms: '/forms',
	responses: '/responses/inbox',
} as const;

export type TopTab = keyof typeof TOP_TAB_PATHS;

export const isTopTab = ( value?: string ): value is TopTab =>
	Object.keys( TOP_TAB_PATHS ).includes( value ?? '' );
