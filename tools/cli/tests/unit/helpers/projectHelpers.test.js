/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import {
	dirs,
	projectTypes,
	allProjects,
	allProjectsByType,
	typeFromProject,
} from '../../../helpers/projectHelpers';

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
		chai.expect( dirs( 'projects' ) ).to.have.lengthOf( 4 );
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
	it( 'allProjects should contain prefixed github-actions', function () {
		// Confirms the type/project style.
		chai.expect( allProjects() ).to.contain( 'github-actions/push-to-mirrors' );
	} );

	// Begin tests for allProjectsByType.
	it( 'allProjectsByType should be a function', function () {
		chai.expect( allProjectsByType ).to.be.a( 'function' );
	} );
	it( 'allProjectsByType should return an array for a valid type', function () {
		chai.expect( allProjectsByType( 'plugins' ) ).to.be.an( 'array' );
	} );
	it( 'allProjectsByType should include a known plugin', function () {
		chai.expect( allProjectsByType( 'plugins' ) ).to.contain( 'plugins/jetpack' );
	} );
	it( 'allProjectsByType should include a known package', function () {
		chai.expect( allProjectsByType( 'packages' ) ).to.contain( 'packages/abtest' );
	} );
	it( 'allProjectsByType should include a known GitHub action', function () {
		chai
			.expect( allProjectsByType( 'github-actions' ) )
			.to.contain( 'github-actions/push-to-mirrors' );
	} );

	it( 'typeFromProject should be a function', function () {
		chai.expect( typeFromProject ).to.be.a( 'function' );
	} );
	it( 'typeFromProject should indicate a type from a plugin', function () {
		chai.expect( typeFromProject( 'plugins/jetpack' ) ).to.equal( 'plugins' );
	} );
	it( 'typeFromProject should indicate a type from a package', function () {
		chai.expect( typeFromProject( 'packages/jitm' ) ).to.equal( 'packages' );
	} );
	it( 'typeFromProject should throw an error for an unexpected type', function () {
		chai.expect( () => typeFromProject( 'not-a-real-type/jetpack' ) ).to.throw();
	} );
	it( 'typeFromProject should throw an error malformed project string', function () {
		chai.expect( () => typeFromProject( 'not-a-real-project' ) ).to.throw();
	} );
} );
