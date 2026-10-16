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
 * key: a select and a radio group both compare against a fixed option list. A rating
 * compares numerically but is not a `number`: it submits `selected/max`, e.g. `4/5`, and
 * offers its own scale as the values to compare against.
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
	| 'file'
	| 'rating';

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
	rating: 'rating',
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
	rating: [
		OPERATORS.EQUALS,
		OPERATORS.NOT_EQUALS,
		OPERATORS.GREATER_THAN,
		OPERATORS.LESS_THAN,
		OPERATORS.GTE,
		OPERATORS.LTE,
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
	// The field carries its own scale, so the rule builder lists 1..max rather than a free
	// number box that would accept 6 stars out of 5.
	rating: 'options',
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

/**
 * Whether `<input type="date">` will show this value.
 *
 * The format has to match and the day has to exist: a well-formed date that does not exist rolls
 * over rather than failing to parse -- `2026-02-31` becomes 2 March -- so what came back has to be
 * compared against what went in.
 *
 * @param value - A trimmed candidate value.
 * @return True when the date input can display it.
 */
const isDisplayableDate = ( value: string ): boolean => {
	if ( ! /^\d{4}-\d{2}-\d{2}$/.test( value ) ) {
		return false;
	}

	const parsed = new Date( `${ value }T00:00:00Z` );

	return ! Number.isNaN( parsed.getTime() ) && parsed.toISOString().startsWith( value );
};

/**
 * The value a subject change carries over, or null when it cannot be carried.
 *
 * Returns the value to store rather than a yes/no, because the decision is made on the
 * trimmed form: handing back a verdict left the caller storing the padded original, which
 * every control here then failed to display -- a dropdown has no option named `" Small "`,
 * and a date input renders nothing for `" 2026-03-15 "`. One function owns both halves so
 * they cannot disagree.
 *
 * A value the new subject's control cannot represent is dropped rather than kept out of
 * sight, where the evaluators would go on comparing against it.
 *
 * @param value   - The value currently on the rule.
 * @param typeKey - The new subject's comparison behavior.
 * @param options - The new subject's selectable options, where it has any.
 * @return The value to store, or null when the new subject cannot represent it.
 */
export const getCarriedOverValue = (
	value: unknown,
	typeKey: TypeKey | string,
	options: ReadonlyArray< { value: string } > = []
): string | null => {
	const raw = String( value ?? '' ).trim();

	if ( '' === raw ) {
		return null;
	}

	switch ( getValueInputForTypeKey( typeKey ) ) {
		// No value box at all: `is checked` and friends compare against nothing.
		case 'none':
			return null;

		case 'options':
			return options.some( option => option.value === raw ) ? raw : null;

		// The grammar a number input accepts, rather than whatever `Number()` can coerce: it
		// blanks `.5`, `5.`, `+5` and `0x10`, all of which `Number()` reads happily.
		case 'number':
			return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test( raw ) ? raw : null;

		// A date or time input renders nothing for a value outside its own format, and nothing
		// for one that is well-formed but not a real date or clock time. Stricter than
		// `evaluate.ts`'s parser on purpose: that answers what the evaluator can read, this
		// answers what the control can show, so `15/03/2026` and `2026-02-31` both have to go.
		case 'date':
			return isDisplayableDate( raw ) ? raw : null;

		case 'time':
			return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test( raw ) ? raw : null;

		default:
			return raw;
	}
};
