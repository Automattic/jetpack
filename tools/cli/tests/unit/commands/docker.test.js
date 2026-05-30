import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';
import { jest } from '@jest/globals';

const fsStub = {
	readFileSync: jest.fn( () => '' ),
	writeFileSync: jest.fn(),
	appendFileSync: jest.fn(),
	existsSync: jest.fn( () => false ),
	mkdirSync: jest.fn(),
	closeSync: jest.fn(),
	openSync: jest.fn( () => 0 ),
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

const {
	getProjectName,
	buildEnv,
	resolveDevCloneSource,
	normalizeProjectShortName,
	pipeDbDump,
	readEnvFile,
	snapshotFlagArgv,
	augmentArgvFromEnvFile,
	detectEnvConflicts,
	persistParallelEnv,
	applyUpdateEnv,
	shouldManageParallelEnv,
	PARALLEL_ENV_KEYS,
} = await import( '../../../commands/docker.js' );

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
	fsStub.readFileSync.mockReset();
	fsStub.writeFileSync.mockReset();
	fsStub.appendFileSync.mockReset();
	fsStub.existsSync.mockReset();
	fsStub.readFileSync.mockReturnValue( '' );
	fsStub.existsSync.mockReturnValue( false );
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

describe( 'shouldManageParallelEnv', () => {
	test( 'true for `up` on the default dev type', () => {
		expect( shouldManageParallelEnv( { type: 'dev', _: [ 'docker', 'up' ] } ) ).toBe( true );
	} );

	test( 'true for `up --name` on dev', () => {
		expect(
			shouldManageParallelEnv( { type: 'dev', name: 'feature', _: [ 'docker', 'up' ] } )
		).toBe( true );
	} );

	// Regression: the e2e framework runs `docker --type e2e --name t1 up -d`. Before the
	// type gate, that --name leaked COMPOSE_PROJECT_NAME/PORT_* into the shared
	// tools/docker/.env of a plain checkout. See PR #48643 review follow-up.
	test( 'false for the e2e flow (--type e2e --name t1 up)', () => {
		expect( shouldManageParallelEnv( { type: 'e2e', name: 't1', _: [ 'docker', 'up' ] } ) ).toBe(
			false
		);
	} );

	test( 'false for non-up commands on dev', () => {
		expect( shouldManageParallelEnv( { type: 'dev', _: [ 'docker', 'down' ] } ) ).toBe( false );
		expect(
			shouldManageParallelEnv( { type: 'dev', name: 'feature', _: [ 'docker', 'clean' ] } )
		).toBe( false );
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

describe( 'PARALLEL_ENV_KEYS', () => {
	test( 'covers the full parallel-instance key set', () => {
		expect( PARALLEL_ENV_KEYS ).toEqual( [
			'COMPOSE_PROJECT_NAME',
			'PORT_WORDPRESS',
			'PORT_PHPMY',
			'PORT_INBOX',
			'PORT_SMTP',
			'PORT_SFTP',
		] );
	} );
} );

describe( 'readEnvFile', () => {
	test( 'returns {} when the file does not exist', () => {
		fsStub.existsSync.mockReturnValue( false );
		expect( readEnvFile( '/tmp/missing.env' ) ).toEqual( {} );
	} );

	test( 'parses key=value pairs from the file', () => {
		fsStub.existsSync.mockReturnValue( true );
		fsStub.readFileSync.mockReturnValue(
			'COMPOSE_PROJECT_NAME=jetpack_foo\nPORT_WORDPRESS=8080\n'
		);
		expect( readEnvFile( '/tmp/.env' ) ).toEqual( {
			COMPOSE_PROJECT_NAME: 'jetpack_foo',
			PORT_WORDPRESS: '8080',
		} );
	} );

	test( 'tolerates blank lines and comments', () => {
		fsStub.existsSync.mockReturnValue( true );
		fsStub.readFileSync.mockReturnValue(
			'# A comment\n\nWP_ADMIN_USER=cg\n# another\nPORT_INBOX=1180\n'
		);
		const parsed = readEnvFile( '/tmp/.env' );
		expect( parsed.WP_ADMIN_USER ).toBe( 'cg' );
		expect( parsed.PORT_INBOX ).toBe( '1180' );
	} );
} );

describe( 'snapshotFlagArgv', () => {
	test( 'extracts only parallel-instance flag fields', () => {
		const argv = {
			name: 'foo',
			port: 8080,
			portPhpmy: 8281,
			portInbox: 1180,
			portSmtp: 2525,
			portSftp: 1122,
			type: 'dev',
			updateEnv: true,
		};
		expect( snapshotFlagArgv( argv ) ).toEqual( {
			name: 'foo',
			port: 8080,
			portPhpmy: 8281,
			portInbox: 1180,
			portSmtp: 2525,
			portSftp: 1122,
		} );
	} );

	test( 'snapshot does not change when the source argv is mutated later', () => {
		const argv = { name: undefined, port: undefined };
		const snap = snapshotFlagArgv( argv );
		argv.name = 'augmented';
		argv.port = 8090;
		expect( snap.name ).toBeUndefined();
		expect( snap.port ).toBeUndefined();
	} );
} );

describe( 'augmentArgvFromEnvFile', () => {
	test( 'leaves argv alone when fileEnv is empty', () => {
		const argv = { type: 'dev' };
		augmentArgvFromEnvFile( argv, {} );
		expect( argv ).toEqual( { type: 'dev' } );
	} );

	test( 'fills argv.port from PORT_WORDPRESS when --port not passed', () => {
		const argv = { type: 'dev' };
		augmentArgvFromEnvFile( argv, { PORT_WORDPRESS: '8080' } );
		expect( argv.port ).toBe( 8080 );
	} );

	test( 'does NOT overwrite argv.port when --port was passed', () => {
		const argv = { type: 'dev', port: 8090 };
		augmentArgvFromEnvFile( argv, { PORT_WORDPRESS: '8080' } );
		expect( argv.port ).toBe( 8090 );
	} );

	test( 'infers argv.name from COMPOSE_PROJECT_NAME=jetpack_foo', () => {
		const argv = { type: 'dev' };
		augmentArgvFromEnvFile( argv, { COMPOSE_PROJECT_NAME: 'jetpack_foo' } );
		expect( argv.name ).toBe( 'foo' );
	} );

	test( 'does NOT infer argv.name from COMPOSE_PROJECT_NAME=jetpack_dev', () => {
		const argv = { type: 'dev' };
		augmentArgvFromEnvFile( argv, { COMPOSE_PROJECT_NAME: 'jetpack_dev' } );
		expect( argv.name ).toBeUndefined();
	} );

	test( 'does NOT infer argv.name from COMPOSE_PROJECT_NAME=jetpack_e2e', () => {
		const argv = { type: 'e2e' };
		augmentArgvFromEnvFile( argv, { COMPOSE_PROJECT_NAME: 'jetpack_e2e' } );
		expect( argv.name ).toBeUndefined();
	} );

	test( 'ignores malformed COMPOSE_PROJECT_NAME values', () => {
		const argv = { type: 'dev' };
		augmentArgvFromEnvFile( argv, { COMPOSE_PROJECT_NAME: 'something_else' } );
		expect( argv.name ).toBeUndefined();
	} );

	test( 'fills all five auxiliary ports when corresponding flag is undefined', () => {
		const argv = { type: 'dev' };
		augmentArgvFromEnvFile( argv, {
			PORT_PHPMY: '8281',
			PORT_INBOX: '1180',
			PORT_SMTP: '2525',
			PORT_SFTP: '1122',
		} );
		expect( argv.portPhpmy ).toBe( 8281 );
		expect( argv.portInbox ).toBe( 1180 );
		expect( argv.portSmtp ).toBe( 2525 );
		expect( argv.portSftp ).toBe( 1122 );
	} );

	test( 'flags-set fields take precedence per-key, .env fills in the rest', () => {
		const argv = { type: 'dev', port: 9999 };
		augmentArgvFromEnvFile( argv, { PORT_WORDPRESS: '8080', PORT_PHPMY: '8281' } );
		expect( argv.port ).toBe( 9999 );
		expect( argv.portPhpmy ).toBe( 8281 );
	} );
} );

describe( 'detectEnvConflicts', () => {
	test( 'returns [] when fileEnv is empty', () => {
		expect( detectEnvConflicts( { name: 'foo', port: 8080 }, {} ) ).toEqual( [] );
	} );

	test( 'returns [] when flag and .env values agree', () => {
		expect(
			detectEnvConflicts(
				{ name: 'foo', port: 8080 },
				{ COMPOSE_PROJECT_NAME: 'jetpack_foo', PORT_WORDPRESS: '8080' }
			)
		).toEqual( [] );
	} );

	test( 'flags PORT_WORDPRESS conflict', () => {
		expect( detectEnvConflicts( { port: 8090 }, { PORT_WORDPRESS: '8080' } ) ).toEqual( [
			{ key: 'PORT_WORDPRESS', fileValue: '8080', flagValue: '8090' },
		] );
	} );

	test( 'flags COMPOSE_PROJECT_NAME conflict', () => {
		expect(
			detectEnvConflicts( { name: 'bar' }, { COMPOSE_PROJECT_NAME: 'jetpack_foo' } )
		).toEqual( [
			{ key: 'COMPOSE_PROJECT_NAME', fileValue: 'jetpack_foo', flagValue: 'jetpack_bar' },
		] );
	} );

	test( 'aggregates multiple conflicts', () => {
		const conflicts = detectEnvConflicts(
			{ name: 'bar', port: 8090, portInbox: 1280 },
			{
				COMPOSE_PROJECT_NAME: 'jetpack_foo',
				PORT_WORDPRESS: '8080',
				PORT_INBOX: '1280', // matches — should not appear
			}
		);
		expect( conflicts ).toHaveLength( 2 );
		expect( conflicts.map( c => c.key ) ).toEqual( [ 'COMPOSE_PROJECT_NAME', 'PORT_WORDPRESS' ] );
	} );

	test( 'does not flag a conflict when only .env has a value (no flag passed)', () => {
		expect( detectEnvConflicts( {}, { PORT_WORDPRESS: '8080' } ) ).toEqual( [] );
	} );
} );

describe( 'persistParallelEnv', () => {
	test( 'no-op when no parallel keys are present in envOpts', () => {
		const written = persistParallelEnv( {}, '/tmp/.env' );
		expect( written ).toEqual( [] );
		expect( fsStub.appendFileSync ).not.toHaveBeenCalled();
	} );

	test( 'writes all six keys when .env is empty', () => {
		fsStub.existsSync.mockReturnValue( true );
		fsStub.readFileSync.mockReturnValue( '' );
		const envOpts = {
			COMPOSE_PROJECT_NAME: 'jetpack_foo',
			PORT_WORDPRESS: 8080,
			PORT_PHPMY: 8281,
			PORT_INBOX: 1180,
			PORT_SMTP: 2525,
			PORT_SFTP: 1122,
		};
		const written = persistParallelEnv( envOpts, '/tmp/.env' );
		expect( written ).toEqual( PARALLEL_ENV_KEYS );
		expect( fsStub.appendFileSync ).toHaveBeenCalledTimes( 1 );
		const [ path, content ] = fsStub.appendFileSync.mock.calls[ 0 ];
		expect( path ).toBe( '/tmp/.env' );
		for ( const key of PARALLEL_ENV_KEYS ) {
			expect( content ).toContain( `${ key }=${ envOpts[ key ] }` );
		}
	} );

	test( 'skips keys already present in .env (Strategy B)', () => {
		fsStub.existsSync.mockReturnValue( true );
		fsStub.readFileSync.mockReturnValue(
			'WP_ADMIN_USER=cg\nPORT_WORDPRESS=8080\nCOMPOSE_PROJECT_NAME=jetpack_foo\n'
		);
		const envOpts = {
			COMPOSE_PROJECT_NAME: 'jetpack_foo',
			PORT_WORDPRESS: 8080,
			PORT_PHPMY: 8281,
			PORT_INBOX: 1180,
		};
		const written = persistParallelEnv( envOpts, '/tmp/.env' );
		expect( written ).toEqual( [ 'PORT_PHPMY', 'PORT_INBOX' ] );
		const [ , content ] = fsStub.appendFileSync.mock.calls[ 0 ];
		expect( content ).toContain( 'PORT_PHPMY=8281' );
		expect( content ).toContain( 'PORT_INBOX=1180' );
		expect( content ).not.toContain( 'PORT_WORDPRESS=' );
		expect( content ).not.toContain( 'COMPOSE_PROJECT_NAME=' );
	} );

	test( 'fully no-op when every parallel key is already in .env', () => {
		fsStub.existsSync.mockReturnValue( true );
		fsStub.readFileSync.mockReturnValue(
			[
				'COMPOSE_PROJECT_NAME=jetpack_foo',
				'PORT_WORDPRESS=8080',
				'PORT_PHPMY=8281',
				'PORT_INBOX=1180',
				'PORT_SMTP=2525',
				'PORT_SFTP=1122',
			].join( '\n' )
		);
		const written = persistParallelEnv(
			{
				COMPOSE_PROJECT_NAME: 'jetpack_foo',
				PORT_WORDPRESS: 8080,
				PORT_PHPMY: 8281,
				PORT_INBOX: 1180,
				PORT_SMTP: 2525,
				PORT_SFTP: 1122,
			},
			'/tmp/.env'
		);
		expect( written ).toEqual( [] );
		expect( fsStub.appendFileSync ).not.toHaveBeenCalled();
	} );

	test( 'never modifies non-parallel keys', () => {
		fsStub.existsSync.mockReturnValue( true );
		fsStub.readFileSync.mockReturnValue( 'WP_ADMIN_USER=cg\nWP_ADMIN_PASSWORD=secret\n' );
		persistParallelEnv(
			{ COMPOSE_PROJECT_NAME: 'jetpack_foo', PORT_WORDPRESS: 8080 },
			'/tmp/.env'
		);
		expect( fsStub.writeFileSync ).not.toHaveBeenCalled();
		const [ , content ] = fsStub.appendFileSync.mock.calls[ 0 ];
		expect( content ).not.toContain( 'WP_ADMIN_USER' );
		expect( content ).not.toContain( 'WP_ADMIN_PASSWORD' );
	} );
} );

describe( 'applyUpdateEnv', () => {
	test( 'no-op when conflicts is empty', () => {
		const updated = applyUpdateEnv( '/tmp/.env', [] );
		expect( updated ).toEqual( [] );
		expect( fsStub.writeFileSync ).not.toHaveBeenCalled();
	} );

	test( 'replaces a single conflicting line, leaves rest verbatim', () => {
		fsStub.existsSync.mockReturnValue( true );
		fsStub.readFileSync.mockReturnValue(
			'WP_ADMIN_USER=cg\nPORT_WORDPRESS=8080\nWP_DOMAIN=localhost\n'
		);
		applyUpdateEnv( '/tmp/.env', [
			{ key: 'PORT_WORDPRESS', fileValue: '8080', flagValue: '8090' },
		] );
		const [ , content ] = fsStub.writeFileSync.mock.calls[ 0 ];
		expect( content ).toContain( 'WP_ADMIN_USER=cg' );
		expect( content ).toContain( 'PORT_WORDPRESS=8090' );
		expect( content ).not.toContain( 'PORT_WORDPRESS=8080' );
		expect( content ).toContain( 'WP_DOMAIN=localhost' );
	} );

	test( 'replaces multiple conflicts in one pass', () => {
		fsStub.existsSync.mockReturnValue( true );
		fsStub.readFileSync.mockReturnValue(
			'COMPOSE_PROJECT_NAME=jetpack_foo\nPORT_WORDPRESS=8080\nPORT_PHPMY=8281\n'
		);
		const updated = applyUpdateEnv( '/tmp/.env', [
			{ key: 'COMPOSE_PROJECT_NAME', fileValue: 'jetpack_foo', flagValue: 'jetpack_bar' },
			{ key: 'PORT_PHPMY', fileValue: '8281', flagValue: '8381' },
		] );
		expect( updated ).toEqual( [ 'COMPOSE_PROJECT_NAME', 'PORT_PHPMY' ] );
		const [ , content ] = fsStub.writeFileSync.mock.calls[ 0 ];
		expect( content ).toContain( 'COMPOSE_PROJECT_NAME=jetpack_bar' );
		expect( content ).toContain( 'PORT_PHPMY=8381' );
		expect( content ).toContain( 'PORT_WORDPRESS=8080' );
	} );

	test( 'preserves indentation when present', () => {
		fsStub.existsSync.mockReturnValue( true );
		fsStub.readFileSync.mockReturnValue( '  PORT_WORDPRESS=8080\n' );
		applyUpdateEnv( '/tmp/.env', [
			{ key: 'PORT_WORDPRESS', fileValue: '8080', flagValue: '8090' },
		] );
		const [ , content ] = fsStub.writeFileSync.mock.calls[ 0 ];
		expect( content ).toContain( '  PORT_WORDPRESS=8090' );
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
