import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { KeptModals } from './kept-modals.ts';

describe( 'KeptModals', () => {
	it( 'hands a kept modal back once', () => {
		const kept = new KeptModals< string >( 3 );

		assert.deepEqual( kept.keep( 'yoast', 'yoast modal' ), [] );
		assert.equal( kept.take( 'yoast' ), 'yoast modal' );
		assert.equal( kept.take( 'yoast' ), undefined );
	} );

	it( 'drops the oldest once past the limit', () => {
		const kept = new KeptModals< string >( 2 );

		kept.keep( 'a', 'A' );
		kept.keep( 'b', 'B' );

		assert.deepEqual( kept.keep( 'c', 'C' ), [ 'A' ] );
		assert.equal( kept.take( 'a' ), undefined );
		assert.equal( kept.take( 'b' ), 'B' );
		assert.equal( kept.take( 'c' ), 'C' );
	} );

	it( 'counts a modal kept again as the most recent', () => {
		const kept = new KeptModals< string >( 2 );

		kept.keep( 'a', 'A' );
		kept.keep( 'b', 'B' );
		kept.keep( 'a', 'A again' );

		assert.deepEqual( kept.keep( 'c', 'C' ), [ 'B' ] );
		assert.equal( kept.take( 'a' ), 'A again' );
	} );

	it( 'never hands back a modal it was not given', () => {
		assert.equal( new KeptModals< string >( 3 ).take( 'missing' ), undefined );
	} );
} );
