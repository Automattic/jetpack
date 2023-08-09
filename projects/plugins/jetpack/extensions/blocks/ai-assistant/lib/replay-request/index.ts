/**
 * External dependencies
 */
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-client:suggestions-event-source' );

class Emitter extends EventTarget {
	chunks: Array< string >;
	lineNumber: number;
	line: string;

	constructor() {
		super();
		this.chunks = require( './chunks' );
		this.lineNumber = 0;
		this.line = null;
	}

	readNextLine() {
		return new Promise< boolean >( resolve => {
			setTimeout( () => {
				if ( this.lineNumber >= this.chunks.length ) {
					this.dispatchEvent( new CustomEvent( 'done', { detail: this.line } ) );
					debug( 'Done: %o', this.line );
					return resolve( false );
				}

				this.line = this.chunks[ this.lineNumber++ ];
				this.dispatchEvent( new CustomEvent( 'suggestion', { detail: this.line } ) );
				debug( 'suggestion: %o', this.line );
				return resolve( true );
			}, 20 );
		} );
	}

	start() {
		setTimeout( async () => {
			let hasMore = true;

			while ( hasMore ) {
				hasMore = await this.readNextLine();
			}
		}, 500 );
	}
}

export const replayRequest = () => {
	const instance = new Emitter();

	instance.start();

	return instance;
};
