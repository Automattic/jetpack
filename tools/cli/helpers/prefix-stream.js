import { Buffer } from 'buffer';
import FilterStream from './filter-stream.js';
import formatDuration from './format-duration.js';

/**
 * A Transform stream to prefix each line with a string.
 *
 * The data is line buffered to try to avoid interleaved output.
 */
export default class PrefixStream extends FilterStream {
	#prefix;
	#startTime;

	/**
	 * Constructor.
	 *
	 * @param {object} options - Options for stream constructors. In addition, the following options are recognized.
	 * @param {string|Buffer|number[]|ArrayBuffer|Uint8Array|object} options.prefix - Prefix. Anything accepted by `Buffer.from()` is ok.
	 * @param {boolean|number} options.time - Include time-since-start on each line. Value is the start timestamp (e.g. `Date.now()`), or boolean true to use `Date.now()`.
	 */
	constructor( options = {} ) {
		const opts = { ...options };
		delete opts.prefix, opts.time;
		super( s => this.#addPrefix( s ), opts );

		this.#prefix = options.prefix || '';
		if ( options.time === true ) {
			this.#startTime = Date.now();
		} else if ( options.time ) {
			this.#startTime = options.time;
		}
	}

	/**
	 * Prefixer.
	 *
	 * @param {string} line - Line to prefix.
	 * @returns {string} Prefixed line.
	 */
	#addPrefix( line ) {
		const parts = [];
		if ( this.#prefix.length ) {
			parts.push( this.#prefix );
		}
		if ( this.#startTime ) {
			parts.push( formatDuration( Date.now() - this.#startTime ) );
		}

		return parts.length ? '[' + parts.join( ' ' ) + '] ' + line : line;
	}
}
