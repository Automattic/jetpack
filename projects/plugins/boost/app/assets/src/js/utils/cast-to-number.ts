/**
 * Given an unknown value from an external source (e.g.: API response), parse
 * it as a number. Returns defaultValue if the value does not seem to be a valid
 * number.
 *
 * @template DefaultType
 * @param {*}           value        - External value to process as a number
 * @param {DefaultType} defaultValue - Default value to return if not a number.
 * @return {number | DefaultType} value as a number, of defaultValue.
 */
export function castToNumber< DefaultType = number >(
	value: unknown,
	defaultValue: DefaultType = undefined
): number | DefaultType {
	if ( typeof value === 'number' ) {
		return value;
	}

	if ( typeof value === 'string' ) {
		const float = parseFloat( value );
		if ( ! isNaN( float ) ) {
			return float;
		}
	}

	return defaultValue;
}
