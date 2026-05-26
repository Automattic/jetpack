import {
	ACTION_RANK,
	mergeAction,
	ownsRuntimeClassmap,
	resolveAction,
	summarizeExecError,
} from '../../../commands/fast-build.js';

describe( 'fast-build.resolveAction', () => {
	test( 'higher-rank action wins', () => {
		expect( resolveAction( 'dump-autoload', 'build' ) ).toBe( 'build' );
		expect( resolveAction( 'build', 'dump-autoload' ) ).toBe( 'build' );
	} );

	test( 'equal ranks pick the first argument', () => {
		expect( resolveAction( 'dump-autoload', 'dump-autoload' ) ).toBe( 'dump-autoload' );
		expect( resolveAction( 'build', 'build' ) ).toBe( 'build' );
	} );

	test( 'unknown actions rank as 0 (skip)', () => {
		expect( resolveAction( 'mystery', 'dump-autoload' ) ).toBe( 'dump-autoload' );
		expect( resolveAction( 'mystery', 'skip' ) ).toBe( 'mystery' );
	} );

	test( 'ACTION_RANK is strictly ordered', () => {
		expect( ACTION_RANK.skip ).toBeLessThan( ACTION_RANK[ 'dump-autoload' ] );
		expect( ACTION_RANK[ 'dump-autoload' ] ).toBeLessThan( ACTION_RANK.build );
	} );
} );

describe( 'fast-build.mergeAction', () => {
	test( 'sets a fresh entry when the project is absent', () => {
		const plan = new Map();
		mergeAction( plan, 'plugins/jetpack', 'dump-autoload' );
		expect( plan.get( 'plugins/jetpack' ) ).toBe( 'dump-autoload' );
	} );

	test( 'upgrades to the higher-rank action when one already exists', () => {
		const plan = new Map( [ [ 'plugins/jetpack', 'dump-autoload' ] ] );
		mergeAction( plan, 'plugins/jetpack', 'build' );
		expect( plan.get( 'plugins/jetpack' ) ).toBe( 'build' );
	} );

	test( 'does not downgrade when the lower-rank action is provided second', () => {
		const plan = new Map( [ [ 'plugins/jetpack', 'build' ] ] );
		mergeAction( plan, 'plugins/jetpack', 'dump-autoload' );
		expect( plan.get( 'plugins/jetpack' ) ).toBe( 'build' );
	} );
} );

describe( 'fast-build.ownsRuntimeClassmap', () => {
	test( 'plugins own a runtime classmap', () => {
		expect( ownsRuntimeClassmap( 'plugins/jetpack' ) ).toBe( true );
		expect( ownsRuntimeClassmap( 'plugins/mu-wpcom-plugin' ) ).toBe( true );
	} );

	test( 'packages do not own a runtime classmap', () => {
		expect( ownsRuntimeClassmap( 'packages/connection' ) ).toBe( false );
		expect( ownsRuntimeClassmap( 'js-packages/components' ) ).toBe( false );
		expect( ownsRuntimeClassmap( 'monorepo' ) ).toBe( false );
	} );
} );

describe( 'fast-build.summarizeExecError', () => {
	test( 'extracts the meaningful lines from composer stderr', () => {
		const err = {
			stderr:
				'Generating autoload files\n\nIn ClassMapGenerator.php line 137:\n  Could not scan for classes inside "jetpack_vendor/automattic/foo/src/"\n  which does not appear to be a file nor a folder\n\ndump-autoload [-o|--optimize] [-a|--classmap-authoritative] ...\n',
			stdout: '',
			shortMessage: 'Command failed with exit code 1',
		};
		const summary = summarizeExecError( err );
		expect( summary ).toContain( 'Could not scan for classes' );
		expect( summary ).toContain( 'ClassMapGenerator.php' );
		// Composer's "dump-autoload [-o|...]" usage trailer should be stripped.
		expect( summary ).not.toContain( 'dump-autoload [-o' );
	} );

	test( 'falls back to stdout when stderr is empty', () => {
		const err = { stderr: '', stdout: 'first line\nsecond line\n', message: 'whatever' };
		expect( summarizeExecError( err ) ).toBe( 'first line\nsecond line' );
	} );

	test( 'falls back to shortMessage when no output is captured', () => {
		const err = { stderr: '', stdout: '', shortMessage: 'Command failed' };
		expect( summarizeExecError( err ) ).toBe( 'Command failed' );
	} );

	test( 'caps the result at N lines', () => {
		const big = Array.from( { length: 30 }, ( _, i ) => `line ${ i }` ).join( '\n' );
		const err = { stderr: big, stdout: '', message: '' };
		expect( summarizeExecError( err, 4 ).split( '\n' ) ).toHaveLength( 4 );
	} );
} );
