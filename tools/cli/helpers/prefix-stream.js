/**
 * External dependencies
 */
import { Buffer } from 'buffer';
import * as stream from 'stream';

/**
 * Internal dependencies
 */
import formatDuration from './format-duration.js';

/**
 * A Transform stream to prefix each line with a string.
 *
 * The data is line buffered to try to avoid interleaved output.
 */
export default class PrefixTransformStream extends stream.Transform {
	static #openBracket = Buffer.from( '[' );
	static #sep = Buffer.from( ' ' );
	static #closeBracket = Buffer.from( '] ' );

	#prefix;
	#startTime;
	#rest;
	#onDrain;

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
		super( opts );

		this.#prefix = Buffer.from( options.prefix || '' );
		this.#rest = Buffer.alloc( 0 );
		if ( options.time === true ) {
			this.#startTime = Date.now();
		} else if ( options.time ) {
			this.#startTime = options.time;
		}
	}

	/**
	 * Push a line to the stream.
	 *
	 * @param {Buffer} line - Line to push.
	 * @returns {boolean} Whether the push succeeded.
	 */
	#doPush( line ) {
		if ( ! this.#prefix.length && ! this.#startTime ) {
			return this.push( line );
		}

		// Push to the stream as a single buffer to try to avoid split writes.
		const bufs = [ PrefixTransformStream.#openBracket ];
		if ( this.#prefix.length > 0 ) {
			bufs.push( this.#prefix );
		}
		if ( this.#startTime ) {
			if ( bufs.length > 1 ) {
				bufs.push( PrefixTransformStream.#sep );
			}
			bufs.push( Buffer.from( formatDuration( Date.now() - this.#startTime ) ) );
		}
		bufs.push( PrefixTransformStream.#closeBracket, line );

		return this.push( Buffer.concat( bufs ) );
	}

	_transform( chunk, encoding, callback ) {
		this.#rest = Buffer.concat( [ this.#rest, chunk ] );
		const func = () => {
			let i;
			while ( ( i = this.#rest.indexOf( '\n' ) ) >= 0 ) {
				const line = this.#rest.slice( 0, ++i );
				this.#rest = this.#rest.slice( i );
				if ( ! this.#doPush( line ) ) {
					this.#onDrain = func;
					return false;
				}
			}
			callback();
			return true;
		};
		func();
	}

	_flush( callback ) {
		if ( this.#rest.length ) {
			this.#doPush( this.#rest );
		}
		callback();
	}

	_read( size ) {
		if ( this.#onDrain ) {
			const onDrain = this.#onDrain;
			this.#onDrain = null;
			if ( onDrain() ) {
				super._read( size );
			}
		} else {
			super._read( size );
		}
	}
}
