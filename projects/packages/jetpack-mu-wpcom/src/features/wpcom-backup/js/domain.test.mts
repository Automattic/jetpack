import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { splitDomainName } from './domain.ts';

describe( 'splitDomainName', () => {
	it( 'splits the truncatable subdomain off the rest', () => {
		assert.deepEqual( splitDomainName( 'example.wordpress.com' ), {
			first: 'example',
			rest: '.wordpress.com',
		} );
	} );

	it( 'handles the staging address the transfer moves a site to', () => {
		assert.deepEqual( splitDomainName( 'example.wpcomstaging.com' ), {
			first: 'example',
			rest: '.wpcomstaging.com',
		} );
	} );

	it( 'leaves no stray dot on a single-label host', () => {
		assert.deepEqual( splitDomainName( 'localhost' ), { first: 'localhost', rest: '' } );
	} );

	it( 'keeps a two-label domain whole', () => {
		assert.deepEqual( splitDomainName( 'example.com' ), { first: 'example', rest: '.com' } );
	} );
} );
