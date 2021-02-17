/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { doesRepoExist } from '../../../helpers/github';

describe( 'doesRepoExist Integration Tests', function () {
	it( 'checks for an existing mirror repo', function () {
		this.timeout( 0 );
		return doesRepoExist( 'jetpack' ).then( data => {
			chai.expect( data ).to.be.true;
		} );
	} );
	it( 'checks for an non-existent repo', function () {
		this.timeout( 0 );
		return doesRepoExist( 'jetpack-zzz-test-not-exist' ).then( data => {
			chai.expect( data ).to.be.false;
		} );
	} );
	it( 'checks for an existent private repo', function () {
		this.timeout( 0 );
		return doesRepoExist( 'jpop-issues' ).then( data => {
			chai.expect( data ).to.be.true;
		} );
	} );
} );
