/**
 * Regular expression matching format placeholder syntax.
 *
 * The pattern for matching named arguments is a naive and incomplete matcher
 * against valid JavaScript identifier names.
 *
 * via Mathias Bynens:
 *
 * >An identifier must start with $, _, or any character in the Unicode
 * >categories “Uppercase letter (Lu)”, “Lowercase letter (Ll)”, “Titlecase
 * >letter (Lt)”, “Modifier letter (Lm)”, “Other letter (Lo)”, or “Letter
 * >number (Nl)”.
 * >
 * >The rest of the string can contain the same characters, plus any U+200C zero
 * >width non-joiner characters, U+200D zero width joiner characters, and
 * >characters in the Unicode categories “Non-spacing mark (Mn)”, “Spacing
 * >combining mark (Mc)”, “Decimal digit number (Nd)”, or “Connector
 * >punctuation (Pc)”.
 *
 * If browser support is constrained to those supporting ES2015, this could be
 * made more accurate using the `u` flag:
 *
 * ```
 * /^[$_\p{L}\p{Nl}][$_\p{L}\p{Nl}\u200C\u200D\p{Mn}\p{Mc}\p{Nd}\p{Pc}]*$/u;
 * ```
 *
 * @see http://www.pixelbeat.org/programming/gcc/format_specs.html
 * @see https://mathiasbynens.be/notes/javascript-identifiers#valid-identifier-names
 *
 * @type {RegExp}
 */
var PATTERN =
	/%(((\d+)\$)|(\(([$_a-zA-Z][$_a-zA-Z0-9]*)\)))?[ +0#-]*\d*(\.(\d+|\*))?(ll|[lhqL])?([cduxXefgsp%])/g;
//               ▲         ▲                    ▲       ▲  ▲            ▲           ▲ type
//               │         │                    │       │  │            └ Length (unsupported)
//               │         │                    │       │  └ Precision / max width
//               │         │                    │       └ Min width (unsupported)
//               │         │                    └ Flags (unsupported)
//               └ Index   └ Name (for named arguments)
/**
 * Given a format string, returns string with arguments interpolatation.
 * Arguments can either be provided directly via function arguments spread, or
 * with an array as the second argument.
 *
 * @see https://en.wikipedia.org/wiki/Printf_format_string
 *
 * @example
 *
 * ```js
 * import sprintf from '@tannin/sprintf';
 *
 * sprintf( 'Hello %s!', 'world' );
 * // ⇒ 'Hello world!'
 * ```
 * @template {string} T
 * @overload
 * @param {T} string - string printf format string
 * @param {...import('../types').SprintfArgs<T>} args - arguments to interpolate
 *
 * @return {string} Formatted string.
 */

/**
 * Given a format string, returns string with arguments interpolatation.
 * Arguments can either be provided directly via function arguments spread, or
 * with an array as the second argument.
 *
 * @see https://en.wikipedia.org/wiki/Printf_format_string
 *
 * @example
 *
 * ```js
 * import sprintf from '@tannin/sprintf';
 *
 * sprintf( 'Hello %s!', 'world' );
 * // ⇒ 'Hello world!'
 * ```
 * @template {string} T
 * @overload
 * @param {T} string - string printf format string
 * @param {import('../types').SprintfArgs<T>} args - arguments to interpolate
 *
 * @return {string} Formatted string.
 */

/**
 * Given a format string, returns string with arguments interpolatation.
 * Arguments can either be provided directly via function arguments spread, or
 * with an array as the second argument.
 *
 * @see https://en.wikipedia.org/wiki/Printf_format_string
 *
 * @example
 *
 * ```js
 * import sprintf from '@tannin/sprintf';
 *
 * sprintf( 'Hello %s!', 'world' );
 * // ⇒ 'Hello world!'
 * ```
 * @template {string} T
 * @param {T} string - string printf format string
 * @param {...import('../types').SprintfArgs<T>} args - arguments to interpolate
 *
 * @return {string} Formatted string.
 */
export default function sprintf(string, ...args) {
	var i = 0;
	if (Array.isArray(args[0])) {
		args = /** @type {import('../types').SprintfArgs<T>[]} */ (
			/** @type {unknown} */ args[0]
		);
	}

	return string.replace(PATTERN, function () {
		var index,
			// name needs to be documented as `string | undefined` else value will have tpye unknown.
			/**
			 * Name of the argument to substitute, if any.
			 *
			 * @type {string | undefined}
			 */
			name,
			precision,
			type,
			value;

		index = arguments[3];
		name = arguments[5];
		precision = arguments[7];
		type = arguments[9];

		// There's no placeholder substitution in the explicit "%", meaning it
		// is not necessary to increment argument index.
		if (type === '%') {
			return '%';
		}

		// Asterisk precision determined by peeking / shifting next argument.
		if (precision === '*') {
			precision = args[i];
			i++;
		}

		if (name === undefined) {
			// If not a positional argument, use counter value.
			if (index === undefined) {
				index = i + 1;
			}

			i++;

			// Positional argument.
			value = args[index - 1];
		} else if (
			args[0] &&
			typeof args[0] === 'object' &&
			args[0].hasOwnProperty(name)
		) {
			// If it's a named argument, use name.
			value = args[0][name];
		}

		// Parse as type.
		if (type === 'f') {
			value = parseFloat(value) || 0;
		} else if (type === 'd') {
			value = parseInt(value) || 0;
		}

		// Apply precision.
		if (precision !== undefined) {
			if (type === 'f') {
				value = value.toFixed(precision);
			} else if (type === 's') {
				value = value.substr(0, precision);
			}
		}

		// To avoid "undefined" concatenation, return empty string if no
		// placeholder substitution can be performed.
		return value !== undefined && value !== null ? value : '';
	});
}
