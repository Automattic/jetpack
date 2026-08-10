/**
 * Default value of the `conditionalLogic` attribute.
 *
 * Kept in one place because three things must agree on it: the block attribute default in
 * shared/settings, the "Reset all" utility, and the panel's own normalization of a partially
 * populated attribute.
 */
export const DEFAULT_LOGIC = {
	enabled: false,
	action: 'show',
	logicalOperator: 'any',
	controls: {},
};

/**
 * Merge a stored attribute over the defaults.
 *
 * @param {object} stored - The block's `conditionalLogic` attribute, possibly undefined.
 * @return {object} A complete logic object.
 */
export const normalizeLogic = stored => ( {
	...DEFAULT_LOGIC,
	...( stored || {} ),
	controls: { ...( stored?.controls || {} ) },
} );
