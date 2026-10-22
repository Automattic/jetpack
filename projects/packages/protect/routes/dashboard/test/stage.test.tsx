import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useSearch } from '@wordpress/route';
import { recordPageView } from '../data/page-views';
import { resetHistory } from '../sections/history/store';
import { SCAN_PATH, resetScan, setScan } from '../sections/scan/store';
import { stage as Stage } from '../stage';
import type { ScanState } from '../sections/scan/types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../data/page-views', () => ( { recordPageView: jest.fn() } ) );
const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	useSearch: jest.fn(),
	useNavigate: () => mockNavigate,
	useLinkProps: () => ( { href: '#/' } ),
} ) );
jest.mock( '@automattic/jetpack-components/admin-page', () => {
	const { createElement, Fragment } = jest.requireActual( 'react' );
	return {
		__esModule: true,
		default: ( { title, breadcrumbs, actions, children } ) =>
			createElement(
				Fragment,
				null,
				title && createElement( 'h1', null, title ),
				breadcrumbs,
				actions,
				children
			),
	};
} );
// The first-visit guide is modal, so it would hide the tabs from every query.
jest.mock( '../components/welcome-modal', () => ( { __esModule: true, default: () => null } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const mockUseSearch = useSearch as unknown as jest.Mock;
const HISTORY_PATH = '/jetpack/v4/protect-dashboard/history';
const lastChecked = '2026-10-20 12:00:00';
const threat5 = { id: 5, title: 'Threat 5', severity: 3 };
const responses = new Map< string, unknown[] >();

/**
 * Queue responses for a path, in order; an Error rejects. Unqueued requests never settle.
 *
 * @param path   - The REST path.
 * @param values - The responses.
 */
function respond( path: string, ...values: unknown[] ) {
	responses.set( path, [ ...( responses.get( path ) ?? [] ), ...values ] );
}

/**
 * Render the report for threat 5 over this page state.
 *
 * @param state - The page state from PHP.
 */
function showReport( state: Record< string, unknown > ) {
	window.jetpackProtectDashboard = state;
	mockUseSearch.mockReturnValue( { threats: '5' } );
	render( <Stage /> );
}

const findGroup = ( name: string ) => screen.findByRole( 'heading', { level: 2, name } );

const requestsTo = ( path: string ) =>
	mockApiFetch.mock.calls.filter( ( [ options ] ) => options.path === path ).length;

describe( 'Protect dashboard stage', () => {
	beforeEach( () => {
		( recordPageView as jest.Mock ).mockClear();
		responses.clear();
		mockApiFetch.mockReset().mockImplementation( ( { path } ) => {
			const next = responses.get( path )?.shift();
			if ( next === undefined ) {
				return new Promise( () => {} );
			}
			return next instanceof Error ? Promise.reject( next ) : Promise.resolve( next );
		} );
	} );

	afterEach( () => {
		delete window.jetpackProtectDashboard;
		delete ( window as { JetpackScriptData?: object } ).JetpackScriptData;
		resetScan();
		resetHistory();
	} );

	it.each( [
		[
			'an unknown tab falls back to Overview',
			{ tab: 'bogus', section: 'monitor' },
			'Overview',
			0,
			[ 'overview', undefined ],
		],
		[
			'Settings loads the settings',
			{ tab: 'settings', section: 'monitor' },
			'Settings',
			2,
			[ 'settings', 'monitor' ],
		],
		[
			'Settings ignores an unknown section',
			{ tab: 'settings', section: '<x>' },
			'Settings',
			2,
			[ 'settings', undefined ],
		],
	] )( '%s', ( _name, search, selected, requests, pageView ) => {
		mockUseSearch.mockReturnValue( search );
		const { rerender } = render( <Stage /> );
		rerender( <Stage /> );

		expect( screen.getByRole( 'tab', { selected: true } ) ).toHaveTextContent( selected );
		expect( mockApiFetch ).toHaveBeenCalledTimes( requests );
		expect( ( recordPageView as jest.Mock ).mock.calls ).toEqual( [ pageView ] );
	} );

	it.each( [
		[ 'titles the page Protect', {}, 'Protect' ],
		[ 'names the threat report in the trail', { threats: '5' }, 'Threats from your alert' ],
	] )( '%s, without a Jetpack crumb', ( _name, search, heading ) => {
		( window as { JetpackScriptData?: object } ).JetpackScriptData = {
			site: { admin_url: '/wp-admin/' },
			myJetpack: { isAvailable: true },
		};
		window.jetpackProtectDashboard = { scan: { hasPlan: true, lastChecked } };
		mockUseSearch.mockReturnValue( search );
		render( <Stage /> );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( heading );
		expect( screen.queryByRole( 'link', { name: 'Jetpack' } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'shows the report in place of the tabs', { scan: { hasPlan: true, lastChecked } }, false ],
		[ 'keeps the tabs without a Scan section', {}, true ],
	] )( 'with threat ids in the URL, %s', ( _name, state, hasTabs ) => {
		showReport( state );

		expect( screen.queryAllByRole( 'tab' ).length > 0 ).toBe( hasTabs );
	} );

	it.each( [
		[ 'says the site is safe', [], true, 'Your site is safe right now' ],
		[ 'never calls a site without Scan safe', [], false, 'No known vulnerabilities found' ],
		[
			'only clears the alert when other threats remain',
			[ 9 ],
			true,
			'Nothing from your alert needs fixing',
		],
		[ 'shows no all-clear while a threat is active', [ 5 ], true, null ],
		[
			'never calls the site safe after a failed scan',
			[],
			true,
			'Nothing from your alert needs fixing',
			true,
		],
	] )( 'the threat report %s', async ( _name, activeIds, hasPlan, heading, failed = false ) => {
		const threats = activeIds.map( id => ( { id, title: `Threat ${ id }`, severity: 3 } ) );
		const scan = { hasPlan, lastChecked, threats, lastScanFailed: failed };
		respond( SCAN_PATH, scan );
		showReport( { scan } );

		await expect(
			heading ? screen.findByText( heading ) : findGroup( 'Needs attention' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { level: 3 } )?.textContent ?? null ).toBe( heading );
	} );

	it( 'the threat report reads Scan fresh before calling a threat gone', async () => {
		const cached = { hasPlan: true, lastChecked, threats: [] };
		respond( SCAN_PATH, { ...cached, threats: [ threat5 ] } );
		showReport( { scan: cached } );

		expect( screen.queryByRole( 'heading', { level: 3 } ) ).not.toBeInTheDocument();
		await expect( findGroup( 'Needs attention' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'No longer detected' ) ).not.toBeInTheDocument();
	} );

	it( 'the threat report holds the all-clear until Scan answers', async () => {
		const scan = { hasPlan: true, lastChecked, threats: [] };
		respond( HISTORY_PATH, [ { ...threat5, status: 'fixed', fixedOn: '2026-10-20T12:00:00Z' } ] );
		showReport( { scan, history: { hasPlan: true } } );

		await expect( findGroup( 'Fixed' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { level: 3 } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'Scan’s report failed', { scan: { hasPlan: true, lastChecked } }, new Error( 'Boom' ), null ],
		[
			'Scan hasn’t finished its first check',
			{ scan: { hasPlan: true, scanning: true, lastChecked: null, threats: [] } },
			{ hasPlan: true, scanning: true, lastChecked: null, threats: [] },
			null,
		],
		[
			'Scan history failed',
			{ scan: { hasPlan: true, lastChecked, threats: [] }, history: { hasPlan: true } },
			{ hasPlan: true, lastChecked, threats: [] },
			new Error( 'Boom' ),
		],
	] )(
		'the threat report never reads as clear when %s',
		async ( _name, state, scanResponse, historyResponse ) => {
			respond( SCAN_PATH, scanResponse );
			if ( historyResponse ) {
				respond( HISTORY_PATH, historyResponse );
			}
			showReport( state );

			await expect( screen.findByText( 'Status unavailable' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( 'No longer detected' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'heading', { level: 3 } ) ).not.toBeInTheDocument();
		}
	);

	it.each( [
		[
			'a fix reloads history and lands in Fixed',
			( scan: ScanState ) => ( { ...scan, threats: [] } ),
			'Fixed',
			2,
		],
		[
			'an ignore moves the row without reloading history',
			( scan: ScanState ) => ( {
				...scan,
				threats: [],
				ignored: [ { ...threat5, status: 'ignored' } ],
			} ),
			'Ignored',
			1,
		],
	] )( 'in the threat report, %s', async ( _name, update, group, historyRequests ) => {
		const scan = { hasPlan: true, lastChecked, threats: [ threat5 ] };
		respond( SCAN_PATH, scan );
		respond(
			HISTORY_PATH,
			[],
			[ { ...threat5, status: 'fixed', fixedOn: '2026-10-20T12:00:00Z' } ]
		);
		showReport( { scan, history: { hasPlan: true } } );
		await expect( findGroup( 'Needs attention' ) ).resolves.toBeInTheDocument();

		act( () => setScan( update as ( current: ScanState ) => ScanState ) );

		await expect( findGroup( group ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'No longer detected' ) ).not.toBeInTheDocument();
		expect( requestsTo( HISTORY_PATH ) ).toBe( historyRequests );
	} );

	it( 'the threat report links to the Overview, leaving the report', async () => {
		const scan = {
			hasPlan: true,
			lastChecked,
			threats: [ { id: 9, title: 'Threat 9', severity: 3 } ],
		};
		respond( SCAN_PATH, scan );
		showReport( { scan } );

		await userEvent.click(
			await screen.findByRole( 'link', { name: 'See them on the Overview.' } )
		);

		const { search } = mockNavigate.mock.lastCall[ 0 ];
		expect( search( { threats: '5' } ) ).toEqual( {} );
	} );

	it( 'leaving the threat report records the Overview view', () => {
		window.jetpackProtectDashboard = { scan: { hasPlan: true, lastChecked } };
		mockUseSearch.mockReturnValue( { threats: '5' } );
		const { rerender } = render( <Stage /> );
		expect( recordPageView ).not.toHaveBeenCalled();

		mockUseSearch.mockReturnValue( {} );
		rerender( <Stage /> );

		expect( screen.getByRole( 'tab', { selected: true } ) ).toHaveTextContent( 'Overview' );
		expect( ( recordPageView as jest.Mock ).mock.calls ).toEqual( [ [ 'overview', undefined ] ] );
	} );

	it( 'switching tabs closes the threat inspector', async () => {
		mockUseSearch.mockReturnValue( { threat: '7' } );
		render( <Stage /> );

		await userEvent.click( screen.getByRole( 'tab', { name: 'Settings' } ) );

		const { search } = mockNavigate.mock.lastCall[ 0 ];
		expect( search( { threat: '7', historyThreat: '3' } ) ).toEqual( {
			threat: undefined,
			historyThreat: undefined,
			tab: 'settings',
		} );
	} );

	it( 'shows why a scan started from the header failed, on a tab without the Scan card', async () => {
		window.jetpackProtectDashboard = {
			scan: { hasPlan: true, url: '#', error: false, scanning: false, lastChecked, threats: [] },
		};
		mockUseSearch.mockReturnValue( { tab: 'settings' } );
		respond( SCAN_PATH, new Error( 'Unable to find a valid site.' ) );
		render( <Stage /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Scan site' } ) );

		await expect(
			screen.findByText( 'Unable to find a valid site.' )
		).resolves.toBeInTheDocument();
	} );

	describe( 'with a scan running', () => {
		const running = {
			hasPlan: true,
			url: '#',
			error: false,
			scanning: true,
			lastChecked,
			threats: [],
		};

		beforeEach( () => {
			jest.useFakeTimers();
			window.jetpackProtectDashboard = { scan: running };
			mockUseSearch.mockReturnValue( { tab: 'settings' } );
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'follows it from a tab without the Scan card', async () => {
			respond( SCAN_PATH, { ...running, scanning: false } );
			render( <Stage /> );
			expect( screen.getByRole( 'button', { name: 'Scanning…' } ) ).toBeInTheDocument();

			await act( () => jest.advanceTimersByTimeAsync( 5000 ) );

			expect( screen.getByRole( 'button', { name: 'Scan site' } ) ).toBeInTheDocument();
			expect( requestsTo( SCAN_PATH ) ).toBe( 1 );
		} );

		it( 'offers Check again in the header once polling gives up', async () => {
			respond( SCAN_PATH, ...Array( 41 ).fill( running ) );
			render( <Stage /> );
			for ( let poll = 0; poll < 40; poll++ ) {
				await act( () => jest.advanceTimersByTimeAsync( 15000 ) );
			}
			expect( requestsTo( SCAN_PATH ) ).toBe( 40 );

			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
			await user.click( screen.getByRole( 'button', { name: 'Check again' } ) );

			expect( requestsTo( SCAN_PATH ) ).toBe( 41 );
			await expect(
				screen.findByRole( 'button', { name: 'Scanning…' } )
			).resolves.toBeInTheDocument();
		} );
	} );
} );
