/*
 * Kept free of `@wordpress/i18n` on purpose: this module is imported by the front-end
 * form runtime, which builds as a WordPress script module, and script modules cannot
 * import that package yet. Translated operator labels live in ./operator-labels.ts,
 * which only the editor loads.
 */

/**
 * Operator wire strings shared with the PHP evaluator.
 *
 * This object is the source of truth: `Conditional_Logic`'s `OP_*` constants must
 * match these values exactly, and `Conditional_Logic_Parity_Test` parses this file
 * to enforce that. Changing a value here is a breaking change to stored rules.
 */
export const OPERATORS = {
	IS: 'is',
	IS_NOT: 'is_not',
	CONTAINS: 'contains',
	DOES_NOT_CONTAIN: 'does_not_contain',
	IS_EMPTY: 'is_empty',
	IS_NOT_EMPTY: 'is_not_empty',
	EQUALS: 'equals',
	NOT_EQUALS: 'not_equals',
	GREATER_THAN: 'greater_than',
	LESS_THAN: 'less_than',
	GTE: 'gte',
	LTE: 'lte',
	BEFORE: 'before',
	AFTER: 'after',
	IS_CHECKED: 'is_checked',
	IS_NOT_CHECKED: 'is_not_checked',
} as const;

export type Operator = ( typeof OPERATORS )[ keyof typeof OPERATORS ];

/**
 * A field's comparison behavior, derived from its block type. Several blocks share a
 * key: a slider and a rating both compare numerically, a select and a radio group both
 * compare against a fixed option list.
 */
export type TypeKey =
	| 'string'
	| 'choice'
	| 'multichoice'
	| 'number'
	| 'date'
	| 'time'
	| 'boolean'
	| 'hidden'
	| 'file';

export type ValueInputKind = 'text' | 'options' | 'number' | 'date' | 'time' | 'none';

/**
 * Operators that compare a field against nothing, so the UI renders no value input and
 * the evaluators ignore `rule.value` entirely.
 */
const OPERATORS_WITHOUT_VALUE: Set< string > = new Set( [
	OPERATORS.IS_EMPTY,
	OPERATORS.IS_NOT_EMPTY,
	OPERATORS.IS_CHECKED,
	OPERATORS.IS_NOT_CHECKED,
] );

/**
 * Front-end and submission-side lookup: shortcode `type` to comparison behavior.
 *
 * Fields flatten to `[contact-field type="…"]` before rendering, so the browser runtime and
 * PHP see these strings rather than block names. Mirrored by
 * `Conditional_Logic::TYPE_KEY_BY_FIELD_TYPE`.
 *
 * `field-telephone` emits `telephone` or `phone` depending on its country-selector setting,
 * so both appear here.
 */
export const TYPE_KEY_BY_FIELD_TYPE: Record< string, TypeKey > = {
	text: 'string',
	name: 'string',
	email: 'string',
	url: 'string',
	textarea: 'string',
	telephone: 'string',
	phone: 'string',
	select: 'choice',
	radio: 'choice',
	'image-select': 'choice',
	'checkbox-multiple': 'multichoice',
	number: 'number',
	slider: 'number',
	rating: 'number',
	date: 'date',
	time: 'time',
	checkbox: 'boolean',
	consent: 'boolean',
	hidden: 'hidden',
	file: 'file',
};

const OPERATORS_BY_TYPE_KEY: Record< TypeKey, Operator[] > = {
	string: [
		OPERATORS.IS,
		OPERATORS.IS_NOT,
		OPERATORS.CONTAINS,
		OPERATORS.DOES_NOT_CONTAIN,
		OPERATORS.IS_EMPTY,
		OPERATORS.IS_NOT_EMPTY,
	],
	choice: [ OPERATORS.IS, OPERATORS.IS_NOT, OPERATORS.IS_EMPTY, OPERATORS.IS_NOT_EMPTY ],
	multichoice: [
		OPERATORS.CONTAINS,
		OPERATORS.DOES_NOT_CONTAIN,
		OPERATORS.IS_EMPTY,
		OPERATORS.IS_NOT_EMPTY,
	],
	number: [
		OPERATORS.EQUALS,
		OPERATORS.NOT_EQUALS,
		OPERATORS.GREATER_THAN,
		OPERATORS.LESS_THAN,
		OPERATORS.GTE,
		OPERATORS.LTE,
		OPERATORS.IS_EMPTY,
		OPERATORS.IS_NOT_EMPTY,
	],
	date: [ OPERATORS.IS, OPERATORS.IS_NOT, OPERATORS.BEFORE, OPERATORS.AFTER ],
	time: [ OPERATORS.IS, OPERATORS.IS_NOT, OPERATORS.BEFORE, OPERATORS.AFTER ],
	boolean: [ OPERATORS.IS_CHECKED, OPERATORS.IS_NOT_CHECKED ],
	hidden: [ OPERATORS.IS, OPERATORS.IS_NOT, OPERATORS.CONTAINS ],
	file: [ OPERATORS.IS_EMPTY, OPERATORS.IS_NOT_EMPTY ],
};

const VALUE_INPUT_BY_TYPE_KEY: Record< TypeKey, ValueInputKind > = {
	string: 'text',
	choice: 'options',
	multichoice: 'options',
	number: 'number',
	date: 'date',
	time: 'time',
	boolean: 'none',
	hidden: 'text',
	file: 'none',
};

/**
 * Resolve a shortcode field type to its comparison behavior.
 *
 * @param fieldType - The shortcode `type` attribute, e.g. `checkbox-multiple`.
 * @return The type key; unknown types compare textually rather than being dropped.
 */
export const getTypeKeyForFieldType = ( fieldType?: string ): TypeKey => {
	if ( ! fieldType ) {
		return 'string';
	}
	return TYPE_KEY_BY_FIELD_TYPE[ fieldType ] ?? 'string';
};

/**
 * Operators offered for a given comparison behavior.
 *
 * @param typeKey - The field's type key.
 * @return Ordered operator list; empty for an unrecognized key.
 */
export const getOperatorsForTypeKey = ( typeKey: TypeKey | string ): Operator[] =>
	OPERATORS_BY_TYPE_KEY[ typeKey as TypeKey ] ?? [];

/**
 * Which value control the rule builder should render for a comparison behavior.
 *
 * @param typeKey - The field's type key.
 * @return The value input kind; falls back to a plain text box.
 */
export const getValueInputForTypeKey = ( typeKey: TypeKey | string ): ValueInputKind =>
	VALUE_INPUT_BY_TYPE_KEY[ typeKey as TypeKey ] ?? 'text';

/**
 * Whether an operator compares against a value the author must supply.
 *
 * @param operator - The operator wire string.
 * @return True when a value input is required.
 */
export const operatorNeedsValue = ( operator: Operator | string ): boolean =>
	! OPERATORS_WITHOUT_VALUE.has( operator );
