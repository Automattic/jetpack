import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readOnce } from './initial-read.ts';

describe( 'readOnce', () => {
	it( 'shares one request within a tick and starts a fresh one afterwards', async () => {
		let starts = 0;
		const start = async () => ++starts;

		const [ a, b ] = [ readOnce( 'k', start ), readOnce( 'k', start ) ];
		assert.equal( a, b );
		assert.equal( await a, 1 );

		await new Promise( resolve => setTimeout( resolve, 1 ) );
		assert.equal( await readOnce( 'k', start ), 2 );
	} );
} );
