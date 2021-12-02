/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { readComposerJson, readPackageJson } from '../../../helpers/json';

describe( 'readComposerJson', function () {
	it( 'should be a function', function () {
		chai.expect( readComposerJson ).to.be.an( 'function' );
	} );
	it( 'plugins/jetpack should have data', function () {
		chai.expect( readComposerJson( 'plugins/jetpack', false ) ).to.be.an( 'object' );
	} );
} );

describe( 'readPackageJson', function () {
	it( 'should be a function', function () {
		chai.expect( readPackageJson ).to.be.an( 'function' );
	} );
	it( 'plugins/jetpack should have data', function () {
		chai.expect( readPackageJson( 'plugins/jetpack', false ) ).to.be.an( 'object' );
	} );
	it( 'packages/abtest should not have data', function () {
		chai.expect( readPackageJson( 'packages/abtest', false ) ).to.equal( undefined );
	} );
} );
