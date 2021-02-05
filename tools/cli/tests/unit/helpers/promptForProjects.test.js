/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { promptForProject } from '../../../helpers/promptForProject';

describe( 'promptForProject', function () {
	it( 'should be a function', function () {
		chai.expect( promptForProject ).to.be.an( 'function' );
	} );
	it( 'should have two default options', function () {
		//	chai.expect( cli-firsttry.details.options ).to.have.length( 2 );
	} );
} );
