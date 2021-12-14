const assert = require( 'assert/strict' );
const GettextEntry = require( './GettextEntry' );
const PROJECT_NAME = require( './plugin-name.js' );

/**
 * A Set of GettextEntries.
 */
class GettextEntries {
	#map;

	/**
	 * Constructor.
	 *
	 * @param {GettextEntry[]} [entries] - Initial entries.
	 */
	constructor( entries = [] ) {
		this.#map = new Map();
		for ( const entry of entries ) {
			this.add( entry );
		}
	}

	get size() {
		return this.#map.size;
	}

	#makekey( entry ) {
		assert(
			entry instanceof GettextEntry,
			`Entry must be an instance of GettextEntry, got ${ typeof entry }`
		);
		return `${ entry.msgid }\0${ entry.context }`;
	}

	add( entry ) {
		this.#map.set( this.#makekey( entry ), entry );
		return this;
	}

	clear() {
		this.#map.clear();
	}

	delete( entry ) {
		return this.#map.delete( this.#makekey( entry ) );
	}

	*entries() {
		for ( const entry of this.#map.values() ) {
			yield [ entry, entry ];
		}
	}

	forEach( fn, thisArg = undefined ) {
		this.#map.forEach( v => fn.call( thisArg, v, v, this ) );
	}

	has( entry ) {
		return this.#map.has( this.#makekey( entry ) );
	}

	get( entry ) {
		return this.#map.get( this.#makekey( entry ) );
	}

	values() {
		return this.#map.values();
	}

	keys = this.values;
	[ Symbol.iterator ] = this.values;

	toString() {
		return (
			`msgid ""
			msgstr ""
			"Project-Id-Version: \\n"
			"Report-Msgid-Bugs-To: \\n"
			"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
			"Language-Team: LANGUAGE <LL@li.org>\\n"
			"MIME-Version: 1.0\\n"
			"Content-Type: text/plain; charset=UTF-8\\n"
			"Content-Transfer-Encoding: 8bit\\n"
			"POT-Creation-Date: ${ new Date().toISOString() }\\n"
			"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
			"X-Generator: ${ PROJECT_NAME } GettextEntries.js\\n"

		`.replace( /^\t+/gm, '' ) + Array.from( this.values() ).join( '\n' )
		);
	}

	toJSON() {
		return Array.from( this.values() );
	}
}

module.exports = GettextEntries;
