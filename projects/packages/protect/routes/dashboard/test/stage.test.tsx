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
		[ 'shows the report in place of the tabs', { scan: { hasPlan: true, threats: [] } }, false ],
		[ 'keeps the tabs without a Scan section', {}, true ],
	] )( 'with threat ids in the URL, %s', ( _name, state, hasTabs ) => {
		window.jetpackProtectDashboard = state;
		mockUseSearch.mockReturnValue( { threats: '5' } );
		render( <Stage /> );
		delete window.jetpackProtectDashboard;

		expect( screen.queryAllByRole( 'tab' ).length > 0 ).toBe( hasTabs );
		expect( Boolean( screen.queryByText( 'No longer detected' ) ) ).toBe( ! hasTabs );
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
