/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { doesRepoExist } from '../../../helpers/github';

describe( 'doesRepoExist Unit Tests', function () {
	it( 'should be a function', function () {
		chai.expect( doesRepoExist ).to.be.an( 'function' );
	} );
} );
