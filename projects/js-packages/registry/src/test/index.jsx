/**
 * External dependencies
 */
import { expect } from 'chai';
import { registrySet, registryGet, registryHas } from '../';

it( 'sets and gets', () => {
	registrySet( 'test1', 1234 );
	expect( registryGet( 'test1' ) ).to.equal( 1234 );
} );

it( 'sets and gets works if sets the same value again', () => {
	registrySet( 'test1', 1234 );
	expect( registryGet( 'test1' ) ).to.equal( 1234 );
} );

it( 'should throw if changing the value of a key that already exists', () => {
	expect( () => {
		registrySet( 'test1', 2344 );
	} ).throw( 'Jetpack Registry entry "test1" is already set.' );
} );

it( 'registryHas should return true for existing entry', () => {
	expect( registryHas( 'test1' ) ).to.equal( true );
} );

it( 'registryHas should return false for non existing entry', () => {
	expect( registryHas( 'unknown' ) ).to.equal( false );
} );

it( 'should throw if getting key that does not exist', () => {
	expect( () => {
		registryGet( 'unknown' );
	} ).throw( 'This app requires the "unknown" Jetpack Registry entry to be defined.' );
} );
