import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useSearch } from '@wordpress/route';
import { stage as Stage } from '../stage';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( { useSearch: jest.fn(), useNavigate: () => jest.fn() } ) );
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
} );
