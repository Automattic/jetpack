/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { readComposerJson } from '../../helpers/readComposerJson';

describe( 'readComposerJson', function () {
	it( 'should be a function', function () {
		chai.expect( readComposerJson ).to.be.an( 'function' );
	} );
	it( 'plugins/jetpack should have data', async function () {
		chai.expect( await readComposerJson( 'plugins/jetpack', false ) ).to.be.an( 'object' );
	} );
	// @todo Write a test for parseJSON. I like rewire, but doesn't work in es6. If I introduce babel...
} );
