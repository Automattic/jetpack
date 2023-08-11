import { Buffer } from 'buffer';
import * as stream from 'stream';

/**
 * A Transform stream to filter each line.
 */
export default class FilterStream extends stream.Transform {
	#filter;
	#rest;
	#onDrain;

	/**
	 * Constructor.
	 *
	 * @param {Function} filter - Function taking a line (without trailing newline) as a parameter and returning a string (replacement line) or null/undefined (to skip the line).
	 * @param {object} options - Options for stream constructors.
	 */
	constructor( filter, options = {} ) {
		super( options );
		this.#filter = filter;
		this.#rest = null;
	}

	_transform( chunk, encoding, callback ) {
		this.#rest = this.#rest ? Buffer.concat( [ this.#rest, chunk ] ) : chunk;
		const func = () => {
			let s = 0,
				e,
				ok = true;
			while ( ok && ( e = this.#rest.indexOf( '\n', s ) ) >= 0 ) {
				let line = this.#rest.slice( s, e ).toString();
				try {
					line = this.#filter( line );
				} catch ( err ) {
					this.#rest = null;
					callback( err );
					return false;
				}
				s = e + 1;
				if ( line || line === '' ) {
					ok = this.push( Buffer.from( line + '\n' ) );
				}
			}
			if ( ok ) {
				this.#rest = s < this.#rest.length ? this.#rest.slice( s ) : null;
				callback();
			} else {
				this.#rest = this.#rest.slice( s );
				this.#onDrain = func;
			}
			return ok;
		};
		func();
	}

	_flush( callback ) {
		if ( this.#rest ) {
			let line = this.#rest.toString();
			this.#rest = null;
			try {
				line = this.#filter( line );
			} catch ( err ) {
				callback( err );
				return;
			}
			if ( line || line === '' ) {
				this.push( Buffer.from( line ) );
			}
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
