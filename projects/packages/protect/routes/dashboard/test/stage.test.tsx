import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useSearch } from '@wordpress/route';
import { recordPageView } from '../data/page-views';
import { stage as Stage } from '../stage';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../data/page-views', () => ( { recordPageView: jest.fn() } ) );
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
		( recordPageView as jest.Mock ).mockClear();
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
