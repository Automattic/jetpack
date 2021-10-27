/**
 * External dependencies
 */
import { expect } from 'chai';
import { setEnv, getEnv } from '../';

it( 'sets and gets', () => {
	setEnv( 'test1', 1234 );
	expect( getEnv( 'test1' ) ).to.equal( 1234 );
} );

it( 'should throw if setting a key that already exists', () => {
	expect( () => {
		setEnv( 'test1', 2345 );
	} ).throw( 'Env variable "test1" is already set.' );
} );

it( 'should throw if getting key that does not exist', () => {
	expect( () => {
		getEnv( 'unknown' );
	} ).throw( 'This app requires the "unknown" env variable to be defined.' );
} );
