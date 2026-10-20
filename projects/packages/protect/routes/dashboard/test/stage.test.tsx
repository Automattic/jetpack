import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useSearch } from '@wordpress/route';
import { stage as Stage } from '../stage';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	useSearch: jest.fn(),
	useNavigate: () => mockNavigate,
} ) );
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const mockUseSearch = useSearch as unknown as jest.Mock;
const lastChecked = '2026-10-20 12:00:00';

describe( 'Protect dashboard stage', () => {
	beforeEach( () => {
		mockApiFetch.mockReset().mockReturnValue( new Promise( () => {} ) );
	} );

	it.each( [
		[ 'an unknown tab falls back to Overview', { tab: 'bogus' }, 'Overview', 0 ],
		[ 'Settings loads the settings', { tab: 'settings' }, 'Settings', 2 ],
	] )( '%s', ( _name, search, selected, requests ) => {
		mockUseSearch.mockReturnValue( search );
		render( <Stage /> );

		expect( screen.getByRole( 'tab', { selected: true } ) ).toHaveTextContent( selected );
		expect( mockApiFetch ).toHaveBeenCalledTimes( requests );
	} );

	it.each( [
		[
			'shows the report in place of the tabs',
			{ scan: { hasPlan: true, lastChecked, threats: [] } },
			false,
		],
		[ 'keeps the tabs without a Scan section', {}, true ],
	] )( 'with threat ids in the URL, %s', ( _name, state, hasTabs ) => {
		window.jetpackProtectDashboard = state;
		mockUseSearch.mockReturnValue( { threats: '5' } );
		render( <Stage /> );
		delete window.jetpackProtectDashboard;

		expect( screen.queryAllByRole( 'tab' ).length > 0 ).toBe( hasTabs );
		expect( Boolean( screen.queryByText( 'No longer detected' ) ) ).toBe( ! hasTabs );
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
	] )( 'the threat report %s', ( _name, activeIds, hasPlan, heading ) => {
		const threats = activeIds.map( id => ( { id, title: `Threat ${ id }`, severity: 3 } ) );
		window.jetpackProtectDashboard = { scan: { hasPlan, lastChecked, threats } };
		mockUseSearch.mockReturnValue( { threats: '5' } );
		render( <Stage /> );
		delete window.jetpackProtectDashboard;

		expect( screen.queryByRole( 'heading', { level: 3 } )?.textContent ?? null ).toBe( heading );
	} );

	it.each( [
		[ 'Scan’s report failed', { scan: { hasPlan: true, error: true } } ],
		[
			'Scan hasn’t finished its first check',
			{ scan: { hasPlan: true, scanning: true, lastChecked: null, threats: [] } },
		],
		[
			'Scan history failed',
			{ scan: { hasPlan: true, lastChecked, threats: [] }, history: { hasPlan: true } },
		],
	] )( 'the threat report never reads as clear when %s', async ( _name, state ) => {
		mockApiFetch.mockRejectedValue( new Error( 'Boom' ) );
		window.jetpackProtectDashboard = state;
		mockUseSearch.mockReturnValue( { threats: '5' } );
		render( <Stage /> );

		await expect( screen.findByText( 'Status unavailable' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'No longer detected' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { level: 3 } ) ).not.toBeInTheDocument();
		delete window.jetpackProtectDashboard;
	} );

	it( 'the threat report links to the Overview, leaving the report', async () => {
		const threats = [ { id: 9, title: 'Threat 9', severity: 3 } ];
		window.jetpackProtectDashboard = { scan: { hasPlan: true, lastChecked, threats } };
		mockUseSearch.mockReturnValue( { threats: '5' } );
		render( <Stage /> );
		delete window.jetpackProtectDashboard;

		await userEvent.click( screen.getByRole( 'link', { name: 'See them on the Overview.' } ) );

		const { search } = mockNavigate.mock.lastCall[ 0 ];
		expect( search( { threats: '5' } ) ).toEqual( {} );
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
} );
