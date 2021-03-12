/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import promptForProject, { promptForType } from '../../../helpers/promptForProject';

describe( 'promptForProject', function () {
	it( 'should be a function', function () {
		chai.expect( promptForProject ).to.be.an( 'function' );
	} );
	it( 'should fail when an invalid project is passed', async function () {
		chai.expect( await promptForProject( { project: 'test' } ) ).to.be.an( 'Error' );
	} );

	it( 'should passthrough when type is passed', async function () {
		chai
			.expect( await promptForProject( { project: 'plugins/jetpack' } ) )
			.to.include( { project: 'plugins/jetpack' } );
	} );
} );

describe( 'promptForType', function () {
	it( 'should be a function', function () {
		chai.expect( promptForType ).to.be.an( 'function' );
	} );

	it( 'should fail when an invalid type is passed', async function () {
		chai.expect( await promptForType( { type: 'test' } ) ).to.be.an( 'Error' );
	} );

	it( 'should passthrough when valid type is passed', async function () {
		chai.expect( await promptForType( { type: 'plugins' } ) ).to.include( { type: 'plugins' } );
	} );
} );
