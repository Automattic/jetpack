import { fileURLToPath } from 'url';
import { toBeArray } from 'jest-extended';
import {
	dirs,
	projectTypes,
	allProjects,
	allProjectsByType,
} from '../../../helpers/projectHelpers.js';

expect.extend( { toBeArray } );

const oldCwd = process.cwd();
beforeAll( () => process.chdir( fileURLToPath( new URL( '../../../../../', import.meta.url ) ) ) );
afterAll( () => process.chdir( oldCwd ) );

describe( 'projectHelpers', () => {
	// Begins tests for dirs.
	test( 'dirs should be a function', () => {
		expect( dirs ).toBeInstanceOf( Function );
	} );
	test( 'dirs should output an array', () => {
		expect( dirs( 'tools/cli' ) ).toBeArray();
	} );
	test( 'dirs should output number of subfolders for the given path', () => {
		// The repo-root projects dir.
		expect( dirs( 'projects' ) ).toHaveLength( 5 );
	} );
	test( 'dirs should output a subfolder of given path', () => {
		expect( dirs( 'projects/plugins' ) ).toContain( 'jetpack' );
	} );
	test( 'dirs should not output an non-existent subfolder of given path', () => {
		expect( dirs( 'projects/plugins' ) ).not.toContain( 'fake' );
	} );
	test( 'dirs should append a prefix when passed', () => {
		expect( dirs( 'projects/plugins', 'prefix-' ) ).toContain( 'prefix-jetpack' );
	} );

	// Begin tests for projectTypes.
	test( 'projectTypes should be an array', () => {
		expect( projectTypes ).toBeArray();
	} );
	test( 'projectTypes should include plugins', () => {
		expect( projectTypes ).toContain( 'plugins' );
	} );

	// Begin tests for allProjects.
	test( 'allProjects should be a function', () => {
		expect( allProjects ).toBeInstanceOf( Function );
	} );
	test( 'allProjects should output an array', () => {
		expect( allProjects() ).toBeArray();
	} );
	test( 'allProjects should contain prefixed plugins', () => {
		// Confirms the type/project style.
		expect( allProjects() ).toContain( 'plugins/jetpack' );
	} );
	test( 'allProjects should contain prefixed packages', () => {
		// Confirms the type/project style.
		expect( allProjects() ).toContain( 'packages/abtest' );
	} );
	test( 'allProjects should contain prefixed github-actions', () => {
		// Confirms the type/project style.
		expect( allProjects() ).toContain( 'github-actions/push-to-mirrors' );
	} );

	// Begin tests for allProjectsByType.
	test( 'allProjectsByType should be a function', () => {
		expect( allProjectsByType ).toBeInstanceOf( Function );
	} );
	test( 'allProjectsByType should return an array for a valid type', () => {
		expect( allProjectsByType( 'plugins' ) ).toBeArray();
	} );
	test( 'allProjectsByType should include a known plugin', () => {
		expect( allProjectsByType( 'plugins' ) ).toContain( 'plugins/jetpack' );
	} );
	test( 'allProjectsByType should include a known package', () => {
		expect( allProjectsByType( 'packages' ) ).toContain( 'packages/abtest' );
	} );
	test( 'allProjectsByType should include a known GitHub action', () => {
		expect( allProjectsByType( 'github-actions' ) ).toContain( 'github-actions/push-to-mirrors' );
	} );
} );
