<?php
/**
 * Conditional Logic evaluator for Jetpack form fields.
 *
 * Mirrors the JS implementation in
 * src/blocks/shared/conditional-logic/util/evaluate.ts and MUST stay in sync.
 *
 * The browser decides what a visitor sees; this class decides what gets validated and
 * stored. A disagreement between the two either discards a real answer or accepts one for
 * a field that was never shown, so Conditional_Logic_Parity_Test pins the operator
 * vocabulary and Conditional_Logic_Test mirrors the JS cases one for one.
 *
 * Targets PHP 7.2: no arrow functions, no typed properties, no match expressions.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Pure evaluator for field conditional-logic rules.
 */
class Conditional_Logic {

	const OP_IS               = 'is';
	const OP_IS_NOT           = 'is_not';
	const OP_CONTAINS         = 'contains';
	const OP_DOES_NOT_CONTAIN = 'does_not_contain';
	const OP_IS_EMPTY         = 'is_empty';
	const OP_IS_NOT_EMPTY     = 'is_not_empty';
	const OP_EQUALS           = 'equals';
	const OP_NOT_EQUALS       = 'not_equals';
	const OP_GREATER_THAN     = 'greater_than';
	const OP_LESS_THAN        = 'less_than';
	const OP_GTE              = 'gte';
	const OP_LTE              = 'lte';
	const OP_BEFORE           = 'before';
	const OP_AFTER            = 'after';
	const OP_IS_CHECKED       = 'is_checked';
	const OP_IS_NOT_CHECKED   = 'is_not_checked';

	/**
	 * Shortcode field type to comparison behavior.
	 *
	 * Mirrors TYPE_KEY_BY_FIELD_TYPE in
	 * src/blocks/shared/conditional-logic/util/field-types.ts. `field-telephone` renders as
	 * either `telephone` or `phone` depending on its country-selector setting, so both appear.
	 *
	 * @var array
	 */
	const TYPE_KEY_BY_FIELD_TYPE = array(
		'text'              => 'string',
		'name'              => 'string',
		'email'             => 'string',
		'url'               => 'string',
		'textarea'          => 'string',
		'telephone'         => 'string',
		'phone'             => 'string',
		'select'            => 'choice',
		'radio'             => 'choice',
		'image-select'      => 'choice',
		'checkbox-multiple' => 'multichoice',
		'number'            => 'number',
		'slider'            => 'number',
		'rating'            => 'number',
		'date'              => 'date',
		'time'              => 'time',
		'checkbox'          => 'boolean',
		'consent'           => 'boolean',
		'hidden'            => 'hidden',
		'file'              => 'file',
	);

	/**
	 * Operators that compare against nothing, so `value` is ignored.
	 *
	 * @var array
	 */
	const OPERATORS_WITHOUT_VALUE = array(
		self::OP_IS_EMPTY,
		self::OP_IS_NOT_EMPTY,
		self::OP_IS_CHECKED,
		self::OP_IS_NOT_CHECKED,
	);

	/**
	 * Resolve a shortcode field type to its comparison behavior.
	 *
	 * @param string $field_type The shortcode `type` attribute.
	 *
	 * @return string The type key; unknown types compare textually rather than being dropped.
	 */
	public static function type_key_for_field_type( $field_type ): string {
		if ( ! is_string( $field_type ) || '' === $field_type ) {
			return 'string';
		}

		return self::TYPE_KEY_BY_FIELD_TYPE[ $field_type ] ?? 'string';
	}

	/**
	 * Evaluate a field's conditional logic.
	 *
	 * A rule whose subject field is absent from `$field_types` is ignored rather than
	 * compared against an empty value, so deleting an unrelated block cannot silently hide a
	 * field. When every rule is ignored the field stays visible.
	 *
	 * @param array|null $logic       The field's conditional-logic config.
	 * @param array      $field_types   Map of field id to shortcode type, for every form field.
	 * @param array      $form_values   Map of field id to submitted value.
	 * @param array      $field_formats Map of field id to date format, for date fields.
	 *
	 * @return bool True when the field should be visible.
	 */
	public static function evaluate( $logic, array $field_types, array $form_values, array $field_formats = array() ): bool {
		if ( ! is_array( $logic ) || empty( $logic['enabled'] ) ) {
			return true;
		}

		$rules = array();
		if ( isset( $logic['controls']['fieldValue']['rules'] ) && is_array( $logic['controls']['fieldValue']['rules'] ) ) {
			$rules = $logic['controls']['fieldValue']['rules'];
		}

		if ( empty( $rules ) ) {
			return true;
		}

		$outcomes = array();
		foreach ( $rules as $rule ) {
			if ( ! is_array( $rule ) || empty( $rule['field'] ) || empty( $rule['operator'] ) ) {
				continue;
			}

			$field_id = (string) $rule['field'];
			if ( ! array_key_exists( $field_id, $field_types ) ) {
				continue; // Subject field no longer exists: ignore this rule.
			}

			$type_key = self::type_key_for_field_type( $field_types[ $field_id ] );
			$actual   = array_key_exists( $field_id, $form_values ) ? $form_values[ $field_id ] : '';
			// A date field's value is written in its own format, so the comparison needs it.
			$format  = isset( $field_formats[ $field_id ] ) ? (string) $field_formats[ $field_id ] : '';
			$outcome = self::evaluate_rule_value( $rule, $type_key, $actual, $format );

			if ( null !== $outcome ) {
				$outcomes[] = $outcome;
			}
		}

		if ( empty( $outcomes ) ) {
			return true;
		}

		$logical_operator = $logic['logicalOperator'] ?? 'any';

		if ( 'all' === $logical_operator ) {
			$matched = ! in_array( false, $outcomes, true );
		} else {
			$matched = in_array( true, $outcomes, true );
		}

		$action = $logic['action'] ?? 'show';

		return 'hide' === $action ? ! $matched : $matched;
	}

	/**
	 * Resolve visibility for every field in a form at once.
	 *
	 * Runs to a fixed point so a hidden field's value reads as empty for everyone else: if the
	 * question was never asked, its answer must not satisfy another field's condition. On
	 * ambiguity — circular rules, or passes exhausted — the field is left visible, because a
	 * stray value in a response is recoverable and a silently discarded answer is not.
	 *
	 * @param array $fields      Map of field id to `array( 'logic' => array|null, 'type' => string )`.
	 * @param array $form_values Map of field id to submitted value.
	 *
	 * @return array Map of field id to bool visibility.
	 */
	public static function resolve_visibility( array $fields, array $form_values ): array {
		$visible = array();
		foreach ( $fields as $field_id => $descriptor ) {
			$visible[ $field_id ] = true;
		}

		$with_logic  = array();
		$field_types   = array();
		$field_formats = array();
		foreach ( $fields as $field_id => $descriptor ) {
			$field_types[ $field_id ] = $descriptor['type'] ?? 'text';
			if ( isset( $descriptor['format'] ) ) {
				$field_formats[ $field_id ] = (string) $descriptor['format'];
			}
			if ( isset( $descriptor['logic'] ) && is_array( $descriptor['logic'] ) && ! empty( $descriptor['logic']['enabled'] ) ) {
				$with_logic[] = $field_id;
			}
		}

		if ( empty( $with_logic ) ) {
			return $visible;
		}

		// An acyclic dependency chain settles at least one more level per pass, so one pass
		// per conditional field, plus one to confirm nothing moved, always reaches the fixed
		// point unless the rules are circular.
		//
		// This used to be clamped to a constant 25, which made that claim false: a chain
		// deeper than 24 ran out of passes, was read as circular, and failed open with
		// fields left visible that should have been hidden. The bound is the field count
		// because that is what actually guarantees convergence -- and it is self-limiting,
		// since it can only be as large as the form.
		$max_passes = count( $with_logic ) + 1;

		// Fields that change after the opening pass are reacting to another field's change,
		// which is the signature of an oscillation. Collected across every pass, because a
		// participant in a cycle need not be the one that flipped on the final pass.
		$unstable = array();

		for ( $pass = 0; $pass < $max_passes; $pass++ ) {
			$effective = array();
			foreach ( $fields as $field_id => $descriptor ) {
				$value                  = array_key_exists( $field_id, $form_values ) ? $form_values[ $field_id ] : '';
				$effective[ $field_id ] = $visible[ $field_id ] ? $value : '';
			}

			$changed_count = 0;
			foreach ( $with_logic as $field_id ) {
				$next = self::evaluate( $fields[ $field_id ]['logic'], $field_types, $effective, $field_formats );
				if ( $next !== $visible[ $field_id ] ) {
					$visible[ $field_id ] = $next;
					++$changed_count;
					if ( $pass > 0 ) {
						$unstable[ $field_id ] = true;
					}
				}
			}

			if ( 0 === $changed_count ) {
				return $visible; // Fixed point.
			}
		}

		// Passes exhausted, so the rules are circular. Fail open for everything in the cycle.
		foreach ( array_keys( $unstable ) as $field_id ) {
			$visible[ $field_id ] = true;
		}

		return $visible;
	}

	/**
	 * Evaluate a single rule against a submitted value.
	 *
	 * @param array  $rule     The rule.
	 * @param string $type_key Comparison behavior of the rule's subject field.
	 * @param mixed  $actual   The subject field's current value.
	 *
	 * @return bool|null True or false, or null when the rule must be ignored.
	 */
	private static function evaluate_rule_value( array $rule, $type_key, $actual, $format = '' ) {
		$operator = (string) $rule['operator'];
		$expected = '';
		if ( ! in_array( $operator, self::OPERATORS_WITHOUT_VALUE, true ) && isset( $rule['value'] ) ) {
			$expected = $rule['value'];
		}

		switch ( $operator ) {
			case self::OP_IS_EMPTY:
				return self::is_empty_value( $actual );
			case self::OP_IS_NOT_EMPTY:
				return ! self::is_empty_value( $actual );
			case self::OP_IS_CHECKED:
				return ! self::is_empty_value( $actual );
			case self::OP_IS_NOT_CHECKED:
				return self::is_empty_value( $actual );
		}

		if ( 'multichoice' === $type_key ) {
			$selection = self::to_selection_list( $actual );
			$target    = trim( self::to_comparable_string( $expected ) );

			switch ( $operator ) {
				case self::OP_CONTAINS:
					return in_array( $target, $selection, true );
				case self::OP_DOES_NOT_CONTAIN:
					return ! in_array( $target, $selection, true );
			}

			return null;
		}

		if ( 'number' === $type_key ) {
			$pair = self::to_numeric_pair( $actual, $expected );
			if ( null === $pair ) {
				return false;
			}

			switch ( $operator ) {
				case self::OP_EQUALS:
					return $pair[0] === $pair[1];
				case self::OP_NOT_EQUALS:
					return $pair[0] !== $pair[1];
				case self::OP_GREATER_THAN:
					return $pair[0] > $pair[1];
				case self::OP_LESS_THAN:
					return $pair[0] < $pair[1];
				case self::OP_GTE:
					return $pair[0] >= $pair[1];
				case self::OP_LTE:
					return $pair[0] <= $pair[1];
			}

			return null;
		}

		if ( 'date' === $type_key || 'time' === $type_key ) {
			$pair = self::to_temporal_pair( $actual, $expected, $type_key, $format );
			if ( null === $pair ) {
				return false;
			}

			switch ( $operator ) {
				case self::OP_IS:
					return $pair[0] === $pair[1];
				case self::OP_IS_NOT:
					return $pair[0] !== $pair[1];
				case self::OP_BEFORE:
					return $pair[0] < $pair[1];
				case self::OP_AFTER:
					return $pair[0] > $pair[1];
			}

			return null;
		}

		// string, choice, hidden and file all compare textually.
		$left  = self::to_comparable_string( $actual );
		$right = self::to_comparable_string( $expected );

		switch ( $operator ) {
			case self::OP_IS:
				return $left === $right;
			case self::OP_IS_NOT:
				return $left !== $right;
			case self::OP_CONTAINS:
				return '' !== $right && false !== strpos( $left, $right );
			case self::OP_DOES_NOT_CONTAIN:
				return '' === $right || false === strpos( $left, $right );
		}

		return null;
	}

	/**
	 * Normalize a multi-select value into a list of selected option strings.
	 *
	 * Membership comparison exists so `contains "Blue"` does not match an option named
	 * "Blueberry", and so an option containing a comma cannot corrupt the comparison.
	 *
	 * @param mixed $value The submitted value.
	 *
	 * @return array Selected options, trimmed, with blanks removed.
	 */
	private static function to_selection_list( $value ): array {
		$raw  = is_array( $value ) ? $value : array( $value );
		$list = array();

		foreach ( $raw as $item ) {
			$text = trim( self::to_comparable_string( $item ) );
			if ( '' !== $text ) {
				$list[] = $text;
			}
		}

		return $list;
	}

	/**
	 * Parse both sides of a numeric comparison.
	 *
	 * @param mixed $actual   The submitted value.
	 * @param mixed $expected The value configured on the rule.
	 *
	 * @return array|null Both sides as floats, or null when either side is not numeric.
	 */
	private static function to_numeric_pair( $actual, $expected ) {
		$left  = trim( self::to_comparable_string( $actual ) );
		$right = trim( self::to_comparable_string( $expected ) );

		if ( '' === $left || '' === $right || ! is_numeric( $left ) || ! is_numeric( $right ) ) {
			return null;
		}

		return array( (float) $left, (float) $right );
	}

	/**
	 * Parse both sides of a date or time comparison into comparable numbers.
	 *
	 * Times become minutes since midnight, so a bare `HH:MM` needs no date context.
	 *
	 * @param mixed  $actual   The submitted value.
	 * @param mixed  $expected The value configured on the rule.
	 * @param string $type_key Either `date` or `time`.
	 *
	 * @return array|null Both sides as ints, or null when either side cannot be parsed.
	 */
	private static function to_temporal_pair( $actual, $expected, $type_key, $format = '' ) {
		// The submitted value is written in the field's format; a rule's value is always ISO.
		$left  = self::parse_temporal( $actual, $type_key, $format );
		$right = self::parse_temporal( $expected, $type_key, '' );

		if ( null === $left || null === $right ) {
			return null;
		}

		return array( $left, $right );
	}

	/**
	 * Parse one side of a temporal comparison.
	 *
	 * @param mixed  $value    The value to parse.
	 * @param string $type_key Either `date` or `time`.
	 *
	 * @return int|null Comparable integer, or null when unparseable.
	 */
	private static function parse_temporal( $value, $type_key, $format = '' ) {
		$text = trim( self::to_comparable_string( $value ) );
		if ( '' === $text ) {
			return null;
		}

		if ( 'time' === $type_key ) {
			if ( ! preg_match( '/^(\d{1,2}):(\d{2})/', $text, $matches ) ) {
				return null;
			}
			return ( (int) $matches[1] ) * 60 + (int) $matches[2];
		}

		return self::parse_date( $text, $format );
	}

	/**
	 * Parse a date into a comparable YYYYMMDD integer.
	 *
	 * Deliberately not strtotime(). The browser has to reach the same answer, and its
	 * Date.parse() reads a bare `YYYY-MM-DD` as UTC while reading `mm/dd/yy` as local time --
	 * so for any visitor away from UTC the two engines disagreed by the offset, and `is` was
	 * false on one side while `after` was true on the other. A `dd/mm/yy` field was worse:
	 * neither engine could read `31/12/2026` at all, so a show-rule hid its field permanently
	 * and the answer was then dropped at storage.
	 *
	 * The field's own format decides how to read the value, the same way the datepicker
	 * writes it. A rule's value always arrives as ISO, since the rule builder uses a native
	 * date input, so ISO is accepted regardless of the field's format.
	 *
	 * @param string $text   Date text.
	 * @param string $format Field date format: `mm/dd/yy`, `dd/mm/yy` or `yy-mm-dd`.
	 *
	 * @return int|null YYYYMMDD, or null when the text does not match.
	 */
	private static function parse_date( $text, $format = '' ) {
		// ISO first: the rule side is always ISO, and it is the default field format.
		if ( preg_match( '/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $text, $m ) ) {
			return self::to_date_int( (int) $m[1], (int) $m[2], (int) $m[3] );
		}

		if ( ! preg_match( '/^(\d{1,4})[\/.-](\d{1,2})[\/.-](\d{1,4})$/', $text, $m ) ) {
			return null;
		}

		// jQuery UI tokens, as used by the field: `yy` is the four-digit year.
		switch ( $format ) {
			case 'dd/mm/yy':
				return self::to_date_int( (int) $m[3], (int) $m[2], (int) $m[1] );
			case 'mm/dd/yy':
				return self::to_date_int( (int) $m[3], (int) $m[1], (int) $m[2] );
			default:
				return self::to_date_int( (int) $m[1], (int) $m[2], (int) $m[3] );
		}
	}

	/**
	 * Combine date parts, rejecting anything out of range.
	 *
	 * @param int $year  Four-digit year.
	 * @param int $month Month.
	 * @param int $day   Day.
	 *
	 * @return int|null YYYYMMDD, or null when the parts cannot be a date.
	 */
	private static function to_date_int( $year, $month, $day ) {
		if ( $month < 1 || $month > 12 || $day < 1 || $day > 31 ) {
			return null;
		}

		return $year * 10000 + $month * 100 + $day;
	}

	/**
	 * Reduce any submitted value to a comparable string.
	 *
	 * @param mixed $value The submitted value.
	 *
	 * @return string Comparable string; empty for values with no sensible text form.
	 */
	private static function to_comparable_string( $value ): string {
		if ( null === $value ) {
			return '';
		}
		if ( is_bool( $value ) ) {
			return $value ? '1' : '';
		}
		if ( is_array( $value ) ) {
			$parts = array();
			foreach ( $value as $item ) {
				$parts[] = self::to_comparable_string( $item );
			}
			return implode( ',', $parts );
		}
		if ( is_object( $value ) ) {
			return '';
		}

		return (string) $value;
	}

	/**
	 * Whether a submitted value counts as unanswered.
	 *
	 * @param mixed $value The submitted value.
	 *
	 * @return bool True when the field has no answer.
	 */
	private static function is_empty_value( $value ): bool {
		if ( null === $value ) {
			return true;
		}
		if ( is_string( $value ) ) {
			return '' === trim( $value );
		}
		if ( is_bool( $value ) ) {
			return ! $value;
		}
		if ( is_array( $value ) ) {
			foreach ( $value as $item ) {
				if ( ! self::is_empty_value( $item ) ) {
					return false;
				}
			}
			return true;
		}
		if ( is_object( $value ) ) {
			foreach ( get_object_vars( $value ) as $item ) {
				if ( ! self::is_empty_value( $item ) ) {
					return false;
				}
			}
			return true;
		}

		return false;
	}
}
