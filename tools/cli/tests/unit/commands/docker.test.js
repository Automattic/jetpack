import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';
import { jest } from '@jest/globals';

const fsStub = {
	readFileSync: () => '',
	writeFileSync: () => {},
	existsSync: () => false,
	mkdirSync: () => {},
	closeSync: () => {},
	openSync: () => 0,
};
jest.unstable_mockModule( 'fs', () => ( {
	default: fsStub,
	...fsStub,
} ) );

const cpStub = {
	spawn: jest.fn(),
	spawnSync: jest.fn( () => ( { status: 0, stdout: '', stderr: '' } ) ),
};
jest.unstable_mockModule( 'child_process', () => ( {
	default: cpStub,
	...cpStub,
} ) );

const { getProjectName, buildEnv, resolveDevCloneSource, normalizeProjectShortName, pipeDbDump } =
	await import( '../../../commands/docker.js' );

/**
 * Build a minimum-viable mock child_process. Emits `exit` (and `close`) on the next tick
 * with the configured exit code; `stdout` ends with the optional payload; `stdin` is a
 * sink so `source.stdout.pipe(target.stdin)` doesn't backpressure the test.
 *
 * @param {object} opts                 - Mock-process options.
 * @param {number} [opts.exitCode=0]    - Exit code to emit.
 * @param {string} [opts.stdoutData=''] - Bytes to push on stdout before EOF.
 * @param {Error}  [opts.error]         - If set, emit 'error' before exit.
 * @return {EventEmitter} Mock process with .stdout / .stdin streams attached.
 */
const makeMockProc = ( { exitCode = 0, stdoutData = '', error = null } = {} ) => {
	const proc = new EventEmitter();
	proc.stdout = new Readable( { read() {} } );
	proc.stdin = new Writable( {
		write( _chunk, _enc, cb ) {
			cb();
		},
	} );
	setImmediate( () => {
		if ( error ) {
			proc.emit( 'error', error );
		}
		if ( stdoutData ) {
			proc.stdout.push( stdoutData );
		}
		proc.stdout.push( null );
		proc.emit( 'exit', exitCode );
		proc.emit( 'close', exitCode );
	} );
	return proc;
};

beforeEach( () => {
	cpStub.spawn.mockReset();
	cpStub.spawnSync.mockReset();
	cpStub.spawnSync.mockReturnValue( { status: 0, stdout: '', stderr: '' } );
} );

describe( 'getProjectName', () => {
	test( 'defaults to jetpack_dev for dev type with no name', () => {
		expect( getProjectName( { type: 'dev' } ) ).toBe( 'jetpack_dev' );
	} );

	test( 'defaults to jetpack_e2e for e2e type with no name', () => {
		expect( getProjectName( { type: 'e2e' } ) ).toBe( 'jetpack_e2e' );
	} );

	test( 'honors --name for dev type', () => {
		expect( getProjectName( { type: 'dev', name: 'feature' } ) ).toBe( 'jetpack_feature' );
	} );

	test( 'honors --name for e2e type', () => {
		expect( getProjectName( { type: 'e2e', name: 'custom' } ) ).toBe( 'jetpack_custom' );
	} );
} );

describe( 'buildEnv', () => {
	test( 'omits PORT_WORDPRESS for dev type when --port not set', () => {
		const env = buildEnv( { type: 'dev' } );
		expect( env.PORT_WORDPRESS ).toBeUndefined();
		expect( env.COMPOSE_PROJECT_NAME ).toBe( 'jetpack_dev' );
	} );

	test( 'defaults PORT_WORDPRESS to 8889 for e2e without --port', () => {
		const env = buildEnv( { type: 'e2e' } );
		expect( env.PORT_WORDPRESS ).toBe( 8889 );
	} );

	test( 'honors --port for dev type', () => {
		const env = buildEnv( { type: 'dev', port: 8080 } );
		expect( env.PORT_WORDPRESS ).toBe( 8080 );
	} );

	test( '--port overrides the e2e default', () => {
		const env = buildEnv( { type: 'e2e', port: 9000 } );
		expect( env.PORT_WORDPRESS ).toBe( 9000 );
	} );

	test( 'passes auxiliary port flags through as env vars', () => {
		const env = buildEnv( {
			type: 'dev',
			name: 'feature',
			port: 8080,
			portPhpmy: 8281,
			portInbox: 1180,
			portSmtp: 2525,
			portSftp: 1122,
		} );
		expect( env.COMPOSE_PROJECT_NAME ).toBe( 'jetpack_feature' );
		expect( env.PORT_WORDPRESS ).toBe( 8080 );
		expect( env.PORT_PHPMY ).toBe( 8281 );
		expect( env.PORT_INBOX ).toBe( 1180 );
		expect( env.PORT_SMTP ).toBe( 2525 );
		expect( env.PORT_SFTP ).toBe( 1122 );
	} );

	test( 'omits auxiliary port env vars when flags are not set', () => {
		const env = buildEnv( { type: 'dev' } );
		expect( env.PORT_PHPMY ).toBeUndefined();
		expect( env.PORT_INBOX ).toBeUndefined();
		expect( env.PORT_SMTP ).toBeUndefined();
		expect( env.PORT_SFTP ).toBeUndefined();
	} );
} );

describe( 'resolveDevCloneSource', () => {
	test( 'returns null when --name is not set (primary dev instance path)', () => {
		expect( resolveDevCloneSource( { type: 'dev', clone: true } ) ).toBeNull();
	} );

	test( 'returns null for type=e2e regardless of other flags', () => {
		expect( resolveDevCloneSource( { type: 'e2e', name: 'foo', clone: true } ) ).toBeNull();
		expect( resolveDevCloneSource( { type: 'e2e', name: 'foo', cloneFrom: 'dev' } ) ).toBeNull();
	} );

	test( 'auto-picks jetpack_dev when --name is set', () => {
		expect( resolveDevCloneSource( { type: 'dev', name: 'feature', clone: true } ) ).toEqual( {
			source: 'jetpack_dev',
			explicit: false,
		} );
	} );

	test( '--no-clone (clone=false) short-circuits auto-clone', () => {
		expect( resolveDevCloneSource( { type: 'dev', name: 'feature', clone: false } ) ).toBeNull();
	} );

	test( '--clone-from wins over --no-clone', () => {
		expect(
			resolveDevCloneSource( { type: 'dev', name: 'feature', clone: false, cloneFrom: 'other' } )
		).toEqual( { source: 'jetpack_other', explicit: true } );
	} );

	test( '--clone-from works without --name (explicit wins over auto gating)', () => {
		expect( resolveDevCloneSource( { type: 'dev', clone: true, cloneFrom: 'other' } ) ).toEqual( {
			source: 'jetpack_other',
			explicit: true,
		} );
	} );

	test( '--clone-from normalizes short name to full project name', () => {
		expect(
			resolveDevCloneSource( { type: 'dev', name: 'feature', clone: true, cloneFrom: 'scratch' } )
		).toEqual( { source: 'jetpack_scratch', explicit: true } );
	} );

	test( 'returns null when target would be the same as source (--name dev)', () => {
		expect( resolveDevCloneSource( { type: 'dev', name: 'dev', clone: true } ) ).toBeNull();
	} );
} );

describe( 'normalizeProjectShortName', () => {
	test( 'lowercases mixed-case input', () => {
		expect( normalizeProjectShortName( 'Feature' ) ).toBe( 'feature' );
		expect( normalizeProjectShortName( 'MyTask' ) ).toBe( 'mytask' );
		expect( normalizeProjectShortName( 'cloneTest' ) ).toBe( 'clonetest' );
	} );

	test( 'passes through already-valid names', () => {
		expect( normalizeProjectShortName( 'feature' ) ).toBe( 'feature' );
		expect( normalizeProjectShortName( 'my-task_2' ) ).toBe( 'my-task_2' );
		expect( normalizeProjectShortName( '42-branch' ) ).toBe( '42-branch' );
	} );

	test( 'throws on invalid characters', () => {
		expect( () => normalizeProjectShortName( 'my feature' ) ).toThrow( /Invalid project name/ );
		expect( () => normalizeProjectShortName( 'foo/bar' ) ).toThrow( /Invalid project name/ );
		expect( () => normalizeProjectShortName( 'dots.in.name' ) ).toThrow( /Invalid project name/ );
	} );

	test( 'throws when name starts with a non-alphanumeric character', () => {
		expect( () => normalizeProjectShortName( '-leading-dash' ) ).toThrow( /Invalid project name/ );
		expect( () => normalizeProjectShortName( '_leading-underscore' ) ).toThrow(
			/Invalid project name/
		);
	} );
} );

describe( 'pipeDbDump', () => {
	test( 'resolves when both source and target exit 0', async () => {
		cpStub.spawn
			.mockReturnValueOnce( makeMockProc( { exitCode: 0, stdoutData: 'INSERT INTO ...' } ) )
			.mockReturnValueOnce( makeMockProc( { exitCode: 0 } ) );
		await expect( pipeDbDump( 'src-wp-1', 'tgt-wp-1', '/var/www/html' ) ).resolves.toBeUndefined();
		expect( cpStub.spawn ).toHaveBeenCalledTimes( 2 );
		const sourceCall = cpStub.spawn.mock.calls[ 0 ];
		const targetCall = cpStub.spawn.mock.calls[ 1 ];
		expect( sourceCall[ 0 ] ).toBe( 'docker' );
		expect( sourceCall[ 1 ] ).toEqual(
			expect.arrayContaining( [ 'exec', 'src-wp-1', 'wp', 'db', 'export' ] )
		);
		expect( targetCall[ 0 ] ).toBe( 'docker' );
		expect( targetCall[ 1 ] ).toEqual(
			expect.arrayContaining( [ 'exec', '-i', 'tgt-wp-1', 'wp', 'db', 'import' ] )
		);
	} );

	test( 'rejects with source attribution when source export fails (target import "succeeds")', async () => {
		// This is the silent-failure scenario the bash version masked: source exits 1 but
		// the importer happily consumed whatever bytes it got and exits 0. The pipe used
		// to report success because pipefail wasn't set.
		cpStub.spawn
			.mockReturnValueOnce( makeMockProc( { exitCode: 1, stdoutData: '' } ) )
			.mockReturnValueOnce( makeMockProc( { exitCode: 0 } ) );
		await expect( pipeDbDump( 'src-wp-1', 'tgt-wp-1', '/var/www/html' ) ).rejects.toThrow(
			/source.*wp db export.*exit 1/i
		);
	} );

	test( 'rejects with target attribution when target import fails', async () => {
		cpStub.spawn
			.mockReturnValueOnce( makeMockProc( { exitCode: 0, stdoutData: 'INSERT...' } ) )
			.mockReturnValueOnce( makeMockProc( { exitCode: 2 } ) );
		await expect( pipeDbDump( 'src-wp-1', 'tgt-wp-1', '/var/www/html' ) ).rejects.toThrow(
			/target.*wp db import.*exit 2/i
		);
	} );

	test( 'rejects mentioning both sides when both fail', async () => {
		cpStub.spawn
			.mockReturnValueOnce( makeMockProc( { exitCode: 1 } ) )
			.mockReturnValueOnce( makeMockProc( { exitCode: 3 } ) );
		await expect( pipeDbDump( 'src-wp-1', 'tgt-wp-1', '/var/www/html' ) ).rejects.toThrow(
			/source.*exit 1.*target.*exit 3/is
		);
	} );
} );
