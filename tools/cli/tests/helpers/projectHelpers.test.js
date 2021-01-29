/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { dirs, projectTypes, allProjects } from '../../helpers/projectHelpers';

describe( 'projectHelpers', function () {
	// Begins tests for dirs.
	it( 'dirs should be a function', function () {
		chai.expect( dirs ).to.be.an( 'function' );
	} );
	it( 'dirs should output an array', function () {
		chai.expect( dirs( 'tools/cli' ) ).to.be.an( 'array' );
	} );
	it( 'dirs should output number of subfolders for the given path', function () {
		// The repo-root projects dir.
		chai.expect( dirs( 'projects' ) ).to.have.lengthOf( 3 );
	} );
	it( 'dirs should output a subfolder of given path', function () {
		chai.expect( dirs( 'projects/plugins' ) ).to.have.contains( 'jetpack' );
	} );
	it( 'dirs should not output an non-existent subfolder of given path', function () {
		chai.expect( dirs( 'projects/plugins' ) ).to.not.contain( 'fake' );
	} );
	it( 'dirs should append a prefix when passed', function () {
		chai.expect( dirs( 'projects/plugins', 'prefix-' ) ).to.have.contains( 'prefix-jetpack' );
	} );

	// Begin tests for projectTypes.
	it( 'projectTypes should be an array', function () {
		chai.expect( projectTypes ).to.be.an( 'array' );
	} );
	it( 'projectTypes should include plugins', function () {
		chai.expect( projectTypes ).to.contain( 'plugins' );
	} );

	// Begin tests for allProjects.
	it( 'allProjects should be a function', function () {
		chai.expect( allProjects ).to.be.a( 'function' );
	} );
	it( 'allProjects should output an array', function () {
		chai.expect( allProjects() ).to.be.an( 'array' );
	} );
	it( 'allProjects should contain prefixed plugins', function () {
		// Confirms the type/project style.
		chai.expect( allProjects() ).to.contain( 'plugins/jetpack' );
	} );
	it( 'allProjects should contain prefixed packages', function () {
		// Confirms the type/project style.
		chai.expect( allProjects() ).to.contain( 'packages/abtest' );
	} );
} );
