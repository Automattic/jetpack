import { ExternalTokenizer, InputStream } from '@lezer/lr';
import * as terms from './blocks.grammar?terms';

const chars = {
	'-': 0x2d,
	'/': 0x2f,
	'>': 0x3e,
	'{': 0x7b,
	'}': 0x7d,
};

/**
 * Token
 *
 * @param {string}      literal - Literal
 * @param {InputStream} input   - Input stream
 * @return {boolean} whether the token was matched
 */
const token = ( literal, input ) => {
	for ( let i = 0; i < literal.length; i++ ) {
		if ( literal[ i ].codePointAt( 0 ) !== input.next ) {
			return false;
		}

		input.advance();
	}

	input.advance();
	return true;
};

/**
 * Skip whitespace.
 *
 * @param {InputStream} input - Input stream.
 * @return {number} how many code points of whitespace were skipped
 */
const skipWhitespaceOuter = input => {
	const startedAt = input.pos;

	while ( input.next > 0 && /\s/.test( String.fromCharCode( input.next ) ) ) {
		input.advance();
	}

	return input.pos - startedAt;
};

export const OpeningBlockStart = new ExternalTokenizer( input => {
	const start = input.pos;

	if ( ! token( '<!--', input ) ) {
		input.advance( start - input.pos );
		return;
	}

	skipWhitespaceOuter( input );

	if ( ! token( 'wp:', input ) ) {
		input.advance( start - input.pos );
		return;
	}

	input.acceptToken( terms.OpeningBlockStart, -1 );
} );

export const ClosingBlockStart = new ExternalTokenizer( input => {
	const start = input.pos;

	if ( ! token( '<!--', input ) ) {
		input.advance( start - input.pos );
		return;
	}

	skipWhitespaceOuter( input );

	if ( ! token( '/wp:', input ) ) {
		input.advance( start - input.pos );
		return;
	}

	input.acceptToken( terms.ClosingBlockStart, -1 );
} );

/**
 * Consumes all input from the current position to the end.
 *
 * This is useful in the block parser because the rule is
 * _either_ that a block delimiter is parser _or_ the entire
 * content is a regular HTML comment, _because_ this is a
 * nested parser under the HTML parser. That is, everything
 * this analyzes will be a full HTML comment, but some of the
 * documents will also be block delimiters.
 */
export const consumeToEnd = new ExternalTokenizer( input => {
	while ( input.next >= 0 ) {
		input.advance();
	}

	input.acceptToken( terms.consumeToEnd );
} );

/**
 * Matches the behavior of the official block parsing spec for
 * WordPress by starting at a `{` and matching the last `}`
 * which immediately falls before a closing `-->` or `/-->`,
 * allowing for whitespace between them.
 */
export const JsonAttributes = new ExternalTokenizer( input => {
	const start = input.pos;

	if ( chars[ '{' ] !== input.next ) {
		return;
	}

	/** @type {number} */
	let closerAt = input.pos;

	/**
	 * Find closer
	 * @return {void}
	 */
	const findCloser = () => {
		while ( chars[ '}' ] !== input.next ) {
			if ( input.next < 0 ) {
				input.advance( start - input.pos );
				return;
			}

			input.advance();
		}

		closerAt = input.pos;
		input.advance();
		return skipWhitespace();
	};

	/**
	 * Skip whitespace
	 * @return {void}
	 */
	const skipWhitespace = () => {
		while ( chars[ '-' ] !== input.next ) {
			if ( input.next < 0 ) {
				input.advance( start - input.pos );
				return;
			}

			if ( chars[ '/' ] === input.next && chars[ '-' ] === input.peek( 1 ) ) {
				input.advance();
				return findEnd();
			}

			if ( ! /\s/.test( String.fromCharCode( input.next ) ) ) {
				return findCloser();
			}

			input.advance();
		}

		return findEnd();
	};

	/**
	 * Find end
	 * @return {void}
	 */
	const findEnd = () => {
		input.advance();
		if ( chars[ '-' ] !== input.next ) {
			return findCloser();
		}

		// Double-dashes are not allowed in the syntax.
		input.advance();

		if ( chars[ '>' ] !== input.next ) {
			input.advance( start - input.pos );
			return;
		}

		/**
		 * @example
		 * ```
		 * 0123456789A
		 * {...}   -->
		 *     │  │  └─ input.pos     =  A
		 *     │  └──── input.pos - 3 =  7
		 *     └─────── closerAt      =  4
		 * closerAt - input.pos       = -6
		 * ```
		 */
		input.acceptTokenTo( terms.JsonAttributes, closerAt );
		input.advance( closerAt - input.pos );
	};

	return findCloser();
} );
