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

const { getProjectName, buildEnv } = await import( '../../../commands/docker.js' );

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
