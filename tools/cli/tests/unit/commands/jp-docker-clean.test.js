import { jest } from '@jest/globals';

const fsStub = {
	readFileSync: jest.fn( () => '' ),
	existsSync: jest.fn( () => false ),
	readdirSync: jest.fn( () => [] ),
};
jest.unstable_mockModule( 'fs', () => ( {
	default: fsStub,
	...fsStub,
} ) );

// The `jp` host CLI is excluded from the pnpm workspace, so it has no jest of its own.
const {
	resolveDockerEnv,
	buildCleanupPaths,
	findUnsupportedHostFlag,
	resolveCleanConsent,
	stripYesFlags,
} = await import( '../../../../../projects/js-packages/jetpack-cli/src/docker-host.js' );

const ROOT = '/repo';
const ENV_FILE = '/repo/tools/docker/.env';
const WP_DEVELOP = '/repo/tools/docker/wordpress-develop';

const parseEnv = buffer => Object.fromEntries( new URLSearchParams( String( buffer ) ) );

beforeEach( () => {
	fsStub.readFileSync.mockReset();
	fsStub.existsSync.mockReset();
	fsStub.readdirSync.mockReset();
	fsStub.readFileSync.mockReturnValue( '' );
	fsStub.existsSync.mockReturnValue( false );
	fsStub.readdirSync.mockReturnValue( [] );
	delete process.env.COMPOSE_PROJECT_NAME;
} );

describe( 'resolveDockerEnv', () => {
	test( 'defaults to jetpack_dev when no .env sets a project name', () => {
		expect( resolveDockerEnv( ROOT, [ 'docker', 'clean' ], parseEnv ).COMPOSE_PROJECT_NAME ).toBe(
			'jetpack_dev'
		);
	} );

	test( 'defaults to jetpack_e2e for --type=e2e', () => {
		expect(
			resolveDockerEnv( ROOT, [ 'docker', 'clean', '--type=e2e' ], parseEnv ).COMPOSE_PROJECT_NAME
		).toBe( 'jetpack_e2e' );
	} );

	test( "takes the worktree .env's project name over the default", () => {
		fsStub.existsSync.mockImplementation( path => path === ENV_FILE );
		fsStub.readFileSync.mockImplementation( path =>
			path === ENV_FILE ? 'COMPOSE_PROJECT_NAME=jetpack_cleanguard' : ''
		);

		expect( resolveDockerEnv( ROOT, [ 'docker', 'clean' ], parseEnv ).COMPOSE_PROJECT_NAME ).toBe(
			'jetpack_cleanguard'
		);
	} );
} );

describe( 'buildCleanupPaths', () => {
	test( 'scopes the logs and mysql paths to the given project', () => {
		expect( buildCleanupPaths( ROOT, 'jetpack_cleanguard' ) ).toEqual( [
			'/repo/tools/docker/wordpress',
			'/repo/tools/docker/logs/jetpack_cleanguard',
			'/repo/tools/docker/data/jetpack_cleanguard_mysql',
		] );
	} );

	// fs.rmSync does no glob expansion and force:true swallows the ENOENT, so a literal
	// 'wordpress-develop/*' entry deleted nothing while the plan promised it would.
	test( 'expands wordpress-develop to its entries, skipping dotfiles like rm -rf does', () => {
		fsStub.existsSync.mockImplementation( path => path === WP_DEVELOP );
		fsStub.readdirSync.mockReturnValue( [ '.gitkeep', 'tests', 'wp-tests-config.php' ] );

		expect( buildCleanupPaths( ROOT, 'jetpack_cleanguard' ) ).toEqual( [
			'/repo/tools/docker/wordpress',
			'/repo/tools/docker/wordpress-develop/tests',
			'/repo/tools/docker/wordpress-develop/wp-tests-config.php',
			'/repo/tools/docker/logs/jetpack_cleanguard',
			'/repo/tools/docker/data/jetpack_cleanguard_mysql',
		] );
	} );

	test( 'never names another instance', () => {
		expect( buildCleanupPaths( ROOT, 'jetpack_cleanguard' ).join( '\n' ) ).not.toContain(
			'jetpack_dev'
		);
	} );

	test( 'follows the .env project name the compose call resolves', () => {
		fsStub.existsSync.mockImplementation( path => path === ENV_FILE );
		fsStub.readFileSync.mockImplementation( path =>
			path === ENV_FILE ? 'COMPOSE_PROJECT_NAME=jetpack_cleanguard' : ''
		);
		const { COMPOSE_PROJECT_NAME } = resolveDockerEnv( ROOT, [ 'docker', 'clean' ], parseEnv );

		expect( buildCleanupPaths( ROOT, COMPOSE_PROJECT_NAME ) ).toContain(
			'/repo/tools/docker/data/jetpack_cleanguard_mysql'
		);
	} );
} );

describe( 'resolveCleanConsent', () => {
	test( '--yes proceeds with or without a TTY', () => {
		expect( resolveCleanConsent( { yes: true, isTty: true } ) ).toBe( 'proceed' );
		expect( resolveCleanConsent( { yes: true, isTty: false } ) ).toBe( 'proceed' );
	} );

	test( 'prompts when a TTY is available', () => {
		expect( resolveCleanConsent( { yes: false, isTty: true } ) ).toBe( 'prompt' );
	} );

	test( 'refuses without a TTY and without --yes', () => {
		expect( resolveCleanConsent( { yes: false, isTty: false } ) ).toBe( 'refuse' );
	} );
} );

describe( 'findUnsupportedHostFlag', () => {
	test.each( [ '--name', '-n', '--type' ] )( 'catches %s, which docker compose rejects', flag => {
		expect( findUnsupportedHostFlag( [ 'docker', 'clean', flag, 'foo' ] ) ).toBe( flag );
	} );

	test.each( [ '--name=foo', '--type=e2e' ] )( 'reports %s as the flag, not the value', arg => {
		expect( findUnsupportedHostFlag( [ 'docker', 'up', arg ] ) ).toBe( arg.split( '=' )[ 0 ] );
	} );

	// A seeded .env outranks both flags in resolveDockerEnv, so `clean --type=e2e` from a
	// worktree would prompt to destroy the dev instance the user did not name.
	test( 'catches --type, which selects an instance just as --name does', () => {
		expect( findUnsupportedHostFlag( [ 'docker', 'clean', '--type=e2e' ] ) ).toBe( '--type' );
	} );

	// `docker compose down -t 30` is a timeout, not `jetpack docker`'s --type.
	test( 'passes flags compose does accept, including -t', () => {
		expect( findUnsupportedHostFlag( [ 'docker', 'down', '-v', '-t', '30' ] ) ).toBeNull();
		expect( findUnsupportedHostFlag( [ 'docker', 'up', '-d' ] ) ).toBeNull();
	} );
} );

describe( 'stripYesFlags', () => {
	test( 'removes --yes so it never reaches docker compose', () => {
		const args = [ 'docker', 'clean', '--yes' ];
		expect( stripYesFlags( args ) ).toBe( true );
		expect( args ).toEqual( [ 'docker', 'clean' ] );
	} );

	test( 'removes -y as well', () => {
		const args = [ 'docker', 'clean', '-y' ];
		expect( stripYesFlags( args ) ).toBe( true );
		expect( args ).toEqual( [ 'docker', 'clean' ] );
	} );

	test( 'reports false and changes nothing when neither flag is present', () => {
		const args = [ 'docker', 'clean' ];
		expect( stripYesFlags( args ) ).toBe( false );
		expect( args ).toEqual( [ 'docker', 'clean' ] );
	} );
} );
