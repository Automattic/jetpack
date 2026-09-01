import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isCustomDomain } from './celebrate-launch-domain.ts';

describe( 'isCustomDomain', () => {
	it( 'treats a default *.wordpress.com domain as not custom', () => {
		assert.equal( isCustomDomain( 'mysite.wordpress.com' ), false );
	} );

	it( 'treats a *.wpcomstaging.com domain as not custom', () => {
		assert.equal( isCustomDomain( 'mysite.wpcomstaging.com' ), false );
	} );

	it( 'treats a mapped custom domain as custom', () => {
		assert.equal( isCustomDomain( 'example.blog' ), true );
		assert.equal( isCustomDomain( 'example.com' ), true );
	} );

	it( 'is case-insensitive', () => {
		assert.equal( isCustomDomain( 'MySite.WordPress.com' ), false );
	} );

	it( 'does not match a domain that merely contains, but does not end with, a default suffix', () => {
		assert.equal( isCustomDomain( 'wordpress.com.example.org' ), true );
	} );

	it( 'returns false for an empty domain rather than guessing', () => {
		assert.equal( isCustomDomain( '' ), false );
	} );
} );
