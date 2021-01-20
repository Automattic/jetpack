/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { readPackageJson } from '../../helpers/readPackageJson';

describe( 'readPackageJson', function () {
	it( 'should be a function', function () {
		chai.expect( readPackageJson ).to.be.an( 'function' );
	} );
	it( 'plugins/jetpack should have data', async function () {
		chai.expect( await readPackageJson( 'plugins/jetpack', false ) ).to.be.an( 'object' );
	} );
	it( 'packages/abtest should not have data', async function () {
		chai.expect( await readPackageJson( 'packages/abtest', false ) ).to.be.false;
	} );
	// @todo Write a test for parseJSON. I like rewire, but doesn't work in es6. If I introduce babel...
} );
