import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { fetchDnsLookup, fetchStatus, postAction } from '../../../data/api';
import { sendStore } from '../../../data/store';
import { nextDelay, useDnsPolling } from '../use-dns-polling';
import type { DnsLookup, SendStatus } from '../../../data/types';

jest.mock( '../../../data/api', () => ( {
	fetchStatus: jest.fn(),
	fetchDnsLookup: jest.fn(),
	postAction: jest.fn(),
	errorMessage: ( error: { message?: string } ) => error?.message ?? 'Something went wrong.',
} ) );

const mockLookup = fetchDnsLookup as jest.MockedFunction< typeof fetchDnsLookup >;
const mockPost = postAction as jest.MockedFunction< typeof postAction >;
const mockStatus = fetchStatus as jest.MockedFunction< typeof fetchStatus >;

const lookup = ( overrides: Partial< DnsLookup > = {} ): DnsLookup => ( {
	domain: 'example.com',
	checked_at: '2026-10-18T10:00:00Z',
	records: [],
	all_found: false,
	can_enable: false,
	...overrides,
} );

const setHidden = ( hidden: boolean ) => {
	Object.defineProperty( document, 'hidden', { configurable: true, get: () => hidden } );
	document.dispatchEvent( new Event( 'visibilitychange' ) );
};

/**
 * Advance fake time and let the awaited requests settle.
 * @param ms - Milliseconds to advance.
 */
const advance = async ( ms: number ) => {
	await act( async () => {
		await jest.advanceTimersByTimeAsync( ms );
	} );
};

describe( 'nextDelay', () => {
	it.each( [
		[ 'setup', 0, 15000 ],
		[ 'setup', 2 * 60000 - 1, 15000 ],
		[ 'setup', 2 * 60000, 30000 ],
		[ 'setup', 10 * 60000, 60000 ],
		[ 'setup', 30 * 60000, null ],
		[ 'overview', 0, 60000 ],
		[ 'overview', 120 * 60000, 60000 ],
	] as const )( '%s after %d ms waits %p', ( mode, elapsed, delay ) => {
		expect( nextDelay( mode, elapsed ) ).toBe( delay );
	} );
} );

describe( 'useDnsPolling', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		mockLookup.mockReset().mockResolvedValue( lookup() );
		mockPost.mockReset().mockResolvedValue( { can_enable: false } as SendStatus );
		mockStatus.mockReset().mockResolvedValue( { can_enable: false } as SendStatus );
		// Mark the store loaded so reading it in a test doesn't fetch the status itself.
		(
			dispatch( sendStore ) as unknown as {
				finishResolution: ( selector: string, args: unknown[] ) => void;
			}
		 ).finishResolution( 'getStatus', [] );
		setHidden( false );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'looks up at once, then backs off from 15 s to 30 s', async () => {
		const { result } = renderHook( () => useDnsPolling( { enabled: true, mode: 'setup' } ) );
		await advance( 0 );
		expect( mockLookup ).toHaveBeenCalledTimes( 1 );
		expect( result.current.lastCheckedAt ).not.toBeNull();

		await advance( 15000 );
		expect( mockLookup ).toHaveBeenCalledTimes( 2 );
		await advance( 105000 ); // 2 minutes in.
		expect( mockLookup ).toHaveBeenCalledTimes( 9 );
		await advance( 15000 );
		expect( mockLookup ).toHaveBeenCalledTimes( 9 );
		await advance( 15000 );
		expect( mockLookup ).toHaveBeenCalledTimes( 10 );
	} );

	it( 'does nothing while disabled', async () => {
		renderHook( () => useDnsPolling( { enabled: false, mode: 'setup' } ) );
		await advance( 60000 );
		expect( mockLookup ).not.toHaveBeenCalled();
	} );

	it( 'pauses while the tab is hidden and checks once on return', async () => {
		renderHook( () => useDnsPolling( { enabled: true, mode: 'setup' } ) );
		await advance( 0 );
		act( () => setHidden( true ) );
		await advance( 5 * 60000 );
		expect( mockLookup ).toHaveBeenCalledTimes( 1 );

		act( () => setHidden( false ) );
		await advance( 0 );
		expect( mockLookup ).toHaveBeenCalledTimes( 2 );
		await advance( 15000 );
		expect( mockLookup ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'asks the mail service once every record is found, at most once a minute', async () => {
		mockLookup.mockResolvedValue( lookup( { all_found: true } ) );
		renderHook( () => useDnsPolling( { enabled: true, mode: 'setup' } ) );
		await advance( 0 );
		expect( mockPost ).toHaveBeenCalledWith( 'check-dns' );
		await advance( 45000 );
		expect( mockPost ).toHaveBeenCalledTimes( 1 );
		await advance( 15000 );
		expect( mockPost ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'asks the mail service every 5 minutes even when nothing is found', async () => {
		renderHook( () => useDnsPolling( { enabled: true, mode: 'overview' } ) );
		await advance( 4 * 60000 );
		expect( mockPost ).not.toHaveBeenCalled();
		await advance( 60000 );
		expect( mockPost ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stops once the domain verifies and re-reads the records', async () => {
		mockLookup
			.mockResolvedValueOnce( lookup( { all_found: true } ) )
			.mockResolvedValue( lookup( { all_found: true, can_enable: true } ) );
		mockPost.mockResolvedValue( { can_enable: true } as SendStatus );
		const { result } = renderHook( () => useDnsPolling( { enabled: true, mode: 'setup' } ) );
		await advance( 0 );
		expect( mockLookup ).toHaveBeenCalledTimes( 2 );
		expect( result.current.lookup?.can_enable ).toBe( true );
		await advance( 10 * 60000 );
		expect( mockLookup ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'refreshes the stored status when the domain verified some other way', async () => {
		mockLookup.mockResolvedValue( lookup( { all_found: true, can_enable: true } ) );
		mockStatus.mockResolvedValue( { can_enable: true, site_title: 'Verified away' } as SendStatus );
		const { result } = renderHook( () => useDnsPolling( { enabled: true, mode: 'setup' } ) );
		await advance( 0 );

		expect( mockPost ).not.toHaveBeenCalled();
		expect( mockStatus ).toHaveBeenCalledTimes( 1 );
		expect( select( sendStore ).getStatus()?.site_title ).toBe( 'Verified away' );
		expect( result.current.lookup?.can_enable ).toBe( true );
		// Nothing left to wait for on the setup page.
		await advance( 10 * 60000 );
		expect( mockLookup ).toHaveBeenCalledTimes( 1 );
		expect( mockStatus ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps trying to refresh the status if that request fails', async () => {
		mockLookup.mockResolvedValue( lookup( { all_found: true, can_enable: true } ) );
		mockStatus
			.mockRejectedValueOnce( new Error( 'offline' ) )
			.mockResolvedValue( { can_enable: true } as SendStatus );
		renderHook( () => useDnsPolling( { enabled: true, mode: 'setup' } ) );
		await advance( 0 );
		expect( mockStatus ).toHaveBeenCalledTimes( 1 );
		await advance( 15000 );
		expect( mockStatus ).toHaveBeenCalledTimes( 2 );
		await advance( 60000 );
		expect( mockStatus ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'keeps asking the mail service on the Overview after it verifies, so a broken record shows', async () => {
		mockLookup
			.mockResolvedValueOnce( lookup( { all_found: true, can_enable: true } ) )
			.mockResolvedValue( lookup( { can_enable: true } ) );
		mockStatus.mockResolvedValue( { can_enable: true } as SendStatus );
		mockPost.mockResolvedValue( { can_enable: false } as SendStatus );
		const { result } = renderHook( () => useDnsPolling( { enabled: true, mode: 'overview' } ) );
		await advance( 4 * 60000 );
		expect( mockPost ).not.toHaveBeenCalled();

		mockLookup.mockResolvedValue( lookup( { can_enable: false } ) );
		await advance( 60000 );
		expect( mockPost ).toHaveBeenCalledWith( 'check-dns' );
		expect( select( sendStore ).getStatus()?.can_enable ).toBe( false );
		expect( result.current.lookup?.can_enable ).toBe( false );
	} );

	it( 'gives up after 30 minutes and starts again on Check now', async () => {
		const { result } = renderHook( () => useDnsPolling( { enabled: true, mode: 'setup' } ) );
		await advance( 30 * 60000 );
		expect( result.current.stopped ).toBe( true );
		const calls = mockLookup.mock.calls.length;
		await advance( 10 * 60000 );
		expect( mockLookup ).toHaveBeenCalledTimes( calls );

		act( () => result.current.checkNow() );
		await advance( 0 );
		expect( result.current.stopped ).toBe( false );
		expect( mockLookup ).toHaveBeenCalledTimes( calls + 1 );
	} );

	it( 'goes back to fast polling on nudge', async () => {
		const { result } = renderHook( () => useDnsPolling( { enabled: true, mode: 'setup' } ) );
		await advance( 10 * 60000 ); // Now at 60 s intervals.
		const calls = mockLookup.mock.calls.length;
		act( () => result.current.nudge() );
		await advance( 15000 );
		expect( mockLookup ).toHaveBeenCalledTimes( calls + 1 );
	} );

	it( 'reports a failed lookup and keeps going', async () => {
		mockLookup.mockRejectedValueOnce( { message: 'Nope' } );
		const { result } = renderHook( () => useDnsPolling( { enabled: true, mode: 'setup' } ) );
		await advance( 0 );
		expect( result.current.error ).toBe( 'Nope' );
		await advance( 15000 );
		expect( result.current.error ).toBeNull();
	} );
} );
