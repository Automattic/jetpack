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
