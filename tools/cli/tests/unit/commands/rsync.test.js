import { jest } from '@jest/globals';

jest.unstable_mockModule( 'configstore', () => ( { default: class {} } ) );

const { getRshOption } = await import( '../../../commands/rsync.js' );

const passwordOpts = '-o NumberOfPasswordPrompts=1 -o PubkeyAuthentication=no';

describe( 'getRshOption', () => {
	test.each( [
		[ 'no password', null, {}, null ],
		[ 'no password, with RSYNC_RSH', null, { RSYNC_RSH: 'ssh -p 2222' }, null ],
		[ 'password', 'secret', {}, `--rsh=ssh ${ passwordOpts }` ],
		[
			'password, with RSYNC_RSH',
			'secret',
			{ RSYNC_RSH: 'ssh -p 2222' },
			`--rsh=ssh -p 2222 ${ passwordOpts }`,
		],
	] )( '%s', ( _, password, env, expected ) => {
		expect( getRshOption( password, env ) ).toBe( expected );
	} );

	test( 'uses the SSH proxy when RSYNC_PROXY_SOCKET is set', () => {
		expect( getRshOption( null, { RSYNC_PROXY_SOCKET: '/sock' } ) ).toMatch(
			/^--rsh=\/.*\/tools\/docker\/bin\/rsync-rsh-proxy\.sh$/
		);
	} );
} );
