const assert = require( 'assert' ).strict;

class StringSet extends Set {
	add( v ) {
		assert( typeof v === 'string', `Value must be a string, got ${ typeof v }` );
		assert( ! /[\r\n]/.test( v ), 'Value may not contain newlines' );
		super.add( v );
	}
}

/**
 * Represents a single translation string.
 */
class GettextEntry {
	#msgid;
	#plural;
	#context;
	#domain;
	#locations = new StringSet();
	#comments = new StringSet();

	/**
	 * Constructor.
	 *
	 * @param {object} data - Entry data.
	 * @param {string} data.msgid - Message string.
	 * @param {string} data.plural - Plural string.
	 * @param {string} data.context - Context.
	 * @param {string} data.domain - Text domain.
	 * @param {Iterable<string>} data.comments - Comments.
	 * @param {Iterable<string>} data.locations - Locations.
	 */
	constructor( data ) {
		this.#msgid = data.msgid;
		this.#plural = data.plural;
		this.#context = data.context || '';
		this.#domain = data.domain || '';

		assert(
			typeof this.#msgid === 'string',
			`data.msgid must be a string, got ${ typeof data.msgid }`
		);
		assert(
			typeof this.#plural === 'string' || typeof data.plural === 'undefined',
			`data.plural must be a string, got ${ typeof data.plural }`
		);
		assert(
			typeof this.#context === 'string',
			`data.context must be a string, got ${ typeof data.context }`
		);
		assert(
			typeof this.#domain === 'string',
			`data.domain must be a string, got ${ typeof data.domain }`
		);

		if ( data.comments ) {
			assert(
				typeof data.comments[ Symbol.iterator ] === 'function',
				`data.comments must be an Iterable of single-line strings, got ${ typeof data.comments }`
			);
			for ( const s of data.comments ) {
				assert(
					typeof s === 'string',
					`data.comments must be an Iterable of single-line strings, got an Iterable containing ${ typeof s }`
				);
				assert(
					! /[\r\n]/.test( s ),
					`data.comments must be an Iterable of single-line strings, got an Iterable containing a multi-line string`
				);
				this.comments.add( s );
			}
		}

		if ( data.locations ) {
			assert(
				typeof data.locations[ Symbol.iterator ] === 'function',
				`data.locations must be an Iterable of single-line strings, got ${ typeof data.locations }`
			);
			for ( const s of data.locations ) {
				assert(
					typeof s === 'string',
					`data.locations must be an Iterable of single-line strings, got an Iterable containing ${ typeof s }`
				);
				assert(
					! /[\r\n]/.test( s ),
					`data.locations must be an Iterable of single-line strings, got an Iterable containing a multi-line string`
				);
				this.locations.add( s );
			}
		}
	}

	get msgid() {
		return this.#msgid;
	}
	get plural() {
		return this.#plural;
	}
	get context() {
		return this.#context;
	}
	get domain() {
		return this.#domain;
	}
	get comments() {
		return this.#comments;
	}
	get locations() {
		return this.#locations;
	}

	#enc( s ) {
		return (
			( s.indexOf( '\n' ) < 0 ? '' : '""\n' ) +
			`"${ s.replace( /[\\"]/g, '\\$&' ).split( '\n' ).join( '\\n"\n"' ) }"\n`
		);
	}

	toString() {
		let ret = '';

		if ( this.domain !== '' ) {
			ret += `#  domain: ${ this.domain }\n`;
		}
		for ( const c of this.comments ) {
			ret += `#. ${ c }\n`;
		}
		for ( const l of this.locations ) {
			ret += `#: ${ l }\n`;
		}
		if ( this.context !== '' ) {
			ret += 'msgctxt ' + this.#enc( this.context );
		}
		ret += 'msgid ' + this.#enc( this.msgid );
		if ( this.plural ) {
			ret += 'msgid_plural ' + this.#enc( this.plural );
			ret += 'msgstr[0] ""\nmsgstr[1] ""\n';
		} else {
			ret += 'msgstr ""\n';
		}

		return ret;
	}

	toJSON() {
		return Object.fromEntries(
			Object.entries( {
				msgid: this.msgid,
				plural: this.plural,
				context: this.context === '' ? undefined : this.context,
				domain: this.domain === '' ? undefined : this.domain,
				comments: this.comments.size ? [ ...this.comments ] : undefined,
				locations: this.locations.size ? [ ...this.locations ] : undefined,
			} ).filter( e => typeof e[ 1 ] !== 'undefined' )
		);
	}
}

module.exports = GettextEntry;
