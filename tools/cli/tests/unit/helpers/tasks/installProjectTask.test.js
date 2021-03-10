/**
 * External dependencies
 */
import chai from 'chai';
import path from 'path';

/**
 * Internal dependencies
 */
import { determineComposerCommand } from '../../../../helpers/tasks/installProjectTask';

describe( 'installProjectTask', function () {
	// Begin tests for determineComposerCommand.
	it( 'determineComposerCommand should be a function', function () {
		chai.expect( determineComposerCommand ).to.be.an( 'function' );
	} );
	// This test "forces" an invalid state by passing an empty cwd argument. This would produce a caught exception, which returns the 'update'.
	it( 'determineComposerCommand should return update for a package that does not validate', function () {
		chai.expect( determineComposerCommand( '', 'packages/jitm' ) ).to.equal( 'update' );
	} );
	// This test presumes the lock file is up to date. Maybe should add a test file that we know would be inline?
	it( 'determineComposerCommand should return update for a package that does not validate', function () {
		chai
			.expect(
				determineComposerCommand( path.resolve( `projects/packages/jitm` ), 'packages/jitm' )
			)
			.to.equal( 'install' );
	} );
} );
