/**
 * External dependencies
 */
import { expect } from 'chai';
import { jetpackConfigGet, jetpackConfigHas } from '../';

it( 'jetpackConfigGet gets existing variable', () => {
	expect( jetpackConfigGet( 'missingConfig' ) ).to.equal( true );
} );

it( 'jetpackConfigHas should return true for existing entry', () => {
	expect( jetpackConfigHas( 'missingConfig' ) ).to.equal( true );
} );

it( 'jetpackConfigHas should return false for non existing entry', () => {
	expect( jetpackConfigHas( 'unknown' ) ).to.equal( false );
} );

it( 'should throw if getting key that does not exist', () => {
	expect( () => {
		jetpackConfigGet( 'unknown' );
	} ).throw(
		'This app requires the "unknown" Jetpack Config to be defined in your webpack configuration file. See details in @automattic/jetpack-config package docs.'
	);
} );
