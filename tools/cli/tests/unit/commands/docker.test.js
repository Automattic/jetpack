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

const { getProjectName, buildEnv, resolveCloneSource, normalizeProjectShortName } = await import(
	'../../../commands/docker.js'
);

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

describe( 'resolveCloneSource', () => {
	test( 'returns null when --name is not set (primary dev instance path)', () => {
		expect( resolveCloneSource( { type: 'dev', clone: true } ) ).toBeNull();
	} );

	test( 'auto-picks jetpack_dev when --name is set', () => {
		expect( resolveCloneSource( { type: 'dev', name: 'feature', clone: true } ) ).toEqual( {
			source: 'jetpack_dev',
			explicit: false,
		} );
	} );

	test( '--no-clone (clone=false) short-circuits auto-clone', () => {
		expect( resolveCloneSource( { type: 'dev', name: 'feature', clone: false } ) ).toBeNull();
	} );

	test( '--clone-from wins over --no-clone', () => {
		expect(
			resolveCloneSource( { type: 'dev', name: 'feature', clone: false, cloneFrom: 'other' } )
		).toEqual( { source: 'jetpack_other', explicit: true } );
	} );

	test( '--clone-from works without --name (explicit wins over auto gating)', () => {
		expect( resolveCloneSource( { type: 'dev', clone: true, cloneFrom: 'other' } ) ).toEqual( {
			source: 'jetpack_other',
			explicit: true,
		} );
	} );

	test( '--clone-from normalizes short name to full project name', () => {
		expect(
			resolveCloneSource( { type: 'dev', name: 'feature', clone: true, cloneFrom: 'scratch' } )
		).toEqual( { source: 'jetpack_scratch', explicit: true } );
	} );

	test( 'returns null when target would be the same as source (--name dev)', () => {
		expect( resolveCloneSource( { type: 'dev', name: 'dev', clone: true } ) ).toBeNull();
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
