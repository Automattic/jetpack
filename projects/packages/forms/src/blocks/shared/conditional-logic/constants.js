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
	// How the groups combine with each other. Inert while there is one group.
	logicalOperator: 'any',
	groups: [],
};

/**
 * The rule type this release understands.
 *
 * Rules carry their own type so further condition kinds -- query string, user role, date and
 * time -- become new rule types inside the existing groups rather than another reshape. An
 * evaluator that meets a type it does not know ignores that rule, so a form saved by a newer
 * editor degrades to its remaining conditions instead of breaking.
 */
export const RULE_TYPE_FIELD_VALUE = 'fieldValue';

/**
 * An empty condition group.
 *
 * @param {string} logicalOperator - How this group's own rules combine: `any` or `all`.
 * @return {object} A new group.
 */
export const createGroup = ( logicalOperator = 'any' ) => ( {
	logicalOperator,
	rules: [],
} );

/**
 * Merge a stored attribute over the defaults.
 *
 * Groups are an array rather than a map keyed by condition kind. A map cannot express "any of
 * these AND all of those", which is where this is heading: several groups, each combining its
 * own rules its own way, combined with each other by the top-level operator. The V1 panel
 * writes exactly one group, so its Any/All selector binds to that group's operator, and the
 * stored shape needs no migration when the second group becomes editable.
 *
 * @param {object} stored - The block's `conditionalLogic` attribute, possibly undefined.
 * @return {object} A complete logic object.
 */
export const normalizeLogic = stored => {
	const logic = { ...DEFAULT_LOGIC, ...( stored || {} ) };
	const groups = Array.isArray( logic.groups ) ? logic.groups : [];

	return {
		...logic,
		groups: groups.map( group => ( {
			logicalOperator: 'all' === group?.logicalOperator ? 'all' : 'any',
			rules: Array.isArray( group?.rules ) ? group.rules : [],
		} ) ),
	};
};

/**
 * The group the V1 panel edits.
 *
 * One group is all the UI offers for now; everything below it already reads an array, so
 * showing a second one is a panel change rather than a storage change.
 *
 * @param {object} logic - A normalized logic object.
 * @return {object} The first group, or an empty one when there is none yet.
 */
export const getPrimaryGroup = logic => logic.groups[ 0 ] || createGroup();

/**
 * Replace the rules of the group the panel edits.
 *
 * @param {object} logic           - A normalized logic object.
 * @param {Array}  rules           - The group's next rules.
 * @param {string} logicalOperator - How those rules combine.
 * @return {object} The next logic object.
 */
export const withPrimaryGroupRules = ( logic, rules, logicalOperator ) => {
	const [ , ...rest ] = logic.groups;
	const groups = rules.length ? [ { logicalOperator, rules }, ...rest ] : rest;

	return {
		...logic,
		groups,
		// Derived rather than exposed as a toggle, so a field only carries conditional logic
		// once it actually has a condition and untouched fields add nothing to the page.
		enabled: groups.some( group => group.rules.length > 0 ),
	};
};

/**
 * Total rules across every group.
 *
 * @param {object} logic - A normalized logic object.
 * @return {number} Rule count.
 */
export const countRules = logic =>
	logic.groups.reduce( ( total, group ) => total + group.rules.length, 0 );

/**
 * Whether the field is hidden before any condition is met.
 *
 * A show rule starts hidden and something reveals it; a hide rule starts visible and something
 * removes it; a field with no conditions is simply visible. This is what the toolbar icon and
 * the builder's opening line both report, so they cannot disagree about it.
 *
 * @param {object} logic - A normalized logic object.
 * @return {boolean} True when the field starts out hidden.
 */
export const startsHidden = logic => countRules( logic ) > 0 && 'show' === logic.action;
