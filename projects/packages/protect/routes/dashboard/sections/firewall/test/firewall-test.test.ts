import apiFetch from '@wordpress/api-fetch';
import {
	CrossOriginError,
	TimeoutError,
	getBlockLabel,
	getTestOutcome,
	runFirewallTest,
} from '../firewall-test';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

describe( 'getTestOutcome', () => {
	it.each( [
		[ 'a 403 with the firewall header is a block', 403, '403 - rule -2', true, 'blocked' ],
		[ 'the header without a 403 is silent mode', 200, '403 - rule -2', true, 'silent' ],
		[ 'a normal page means nothing blocked it', 200, null, true, 'not-blocked' ],
		[ 'a 403 from the host is not the firewall', 403, null, true, 'not-blocked' ],
		[ 'a normal page while the firewall is off is expected', 200, null, false, 'off' ],
		[
			'a block while the firewall is off is not "working"',
			403,
			'403 - rule -2',
			false,
			'blocked-while-off',
		],
	] )( '%s', ( _name, status, header, active, expected ) => {
		expect( getTestOutcome( status, header, null, active ) ).toBe( expected );
	} );

	it( 'a page let through for the IP allow list says so', () => {
		expect( getTestOutcome( 200, null, 'ip allow list', true ) ).toBe( 'allowed' );
	} );
} );

describe( 'getBlockLabel', () => {
	it.each( [
		[ 'the self-check', { ruleId: -2, reason: 'reworded' }, 'Firewall test' ],
		[ 'the IP block list', { ruleId: -1, reason: 'reworded' }, 'Blocked IP address' ],
		[ 'a rule with a reason', { ruleId: 941100, reason: 'XSS attack' }, 'XSS attack' ],
		[ 'a rule without a reason', { ruleId: 941100, reason: '' }, 'Rule 941100' ],
	] )( '%s', ( _name, block, expected ) => {
		expect( getBlockLabel( block ) ).toBe( expected );
	} );
} );

describe( 'runFirewallTest', () => {
	it( 'refuses a site on another origin, whose response headers can’t be read', async () => {
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( {
			url: 'https://elsewhere.example/?jetpack_waf_test=abc',
		} );
		const fetchMock = jest.fn();
		window.fetch = fetchMock;

		await expect( runFirewallTest( true ) ).rejects.toBeInstanceOf( CrossOriginError );
		expect( fetchMock ).not.toHaveBeenCalled();
	} );

	it( 'gives up on a site that doesn’t answer', async () => {
		jest.useFakeTimers();
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( {
			url: `${ window.location.origin }/?jetpack_waf_test=abc`,
		} );
		window.fetch = jest.fn(
			( _url, { signal } ) =>
				new Promise( ( _resolve, reject ) =>
					signal.addEventListener( 'abort', () => reject( new Error( 'aborted' ) ) )
				)
		) as unknown as typeof window.fetch;

		const failure = runFirewallTest( true ).catch( e => e );
		await jest.advanceTimersByTimeAsync( 15000 );

		await expect( failure ).resolves.toBeInstanceOf( TimeoutError );
		jest.useRealTimers();
	} );
} );
