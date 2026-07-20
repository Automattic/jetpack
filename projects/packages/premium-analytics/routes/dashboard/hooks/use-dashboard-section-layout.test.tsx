/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { DASHBOARD_NAME, DASHBOARD_PREFERENCES_SCOPE } from './constants';
import { useDashboardSectionLayout } from './use-dashboard-section-layout';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/preferences', () => ( {
	store: 'core/preferences',
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;
const mockUseDispatch = useDispatch as jest.Mock;

const PREFERENCES_KEY = 'dashboardSectionLayouts';

const widget = ( uuid: string ): DashboardWidget => ( { uuid, type: 'jpa/story-widget' } );

/**
 * Mock the preferences store with stored values keyed by preference name.
 *
 * @param stored - Stored preference values.
 * @return The preferences `set` spy.
 */
function mockPreferences( stored: Record< string, unknown > ) {
	const set = jest.fn();

	mockUseSelect.mockImplementation( selector =>
		selector( () => ( {
			get: ( _scope: string, key: string ) => stored[ key ],
		} ) )
	);
	mockUseDispatch.mockReturnValue( { set } );

	return set;
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockUseSelect.mockReset();
	mockUseDispatch.mockReset();
} );

describe( 'useDashboardSectionLayout', () => {
	it( 'reads the active section layout from the preferences map keyed by slug', () => {
		mockPreferences( {
			[ PREFERENCES_KEY ]: { store: [ widget( 'store-widget' ) ] },
		} );

		const { result } = renderHook( () => useDashboardSectionLayout( DASHBOARD_NAME, 'store' ) );

		expect( result.current[ 0 ] ).toEqual( [ widget( 'store-widget' ) ] );
	} );

	it( 'writes the section layout through the preferences store', () => {
		const set = mockPreferences( {
			[ PREFERENCES_KEY ]: { traffic: [ widget( 'traffic-widget' ) ] },
		} );

		const { result } = renderHook( () => useDashboardSectionLayout( DASHBOARD_NAME, 'store' ) );

		act( () => {
			result.current[ 1 ]( [ widget( 'store-widget' ) ] );
		} );

		expect( set ).toHaveBeenCalledWith( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, {
			traffic: [ widget( 'traffic-widget' ) ],
			store: [ widget( 'store-widget' ) ],
		} );
	} );

	it( 'resets by fetching the section default and persisting it as a preference', async () => {
		const set = mockPreferences( { [ PREFERENCES_KEY ]: {} } );
		mockApiFetch.mockResolvedValue( [ widget( 'default-widget' ) ] );

		const { result } = renderHook( () => useDashboardSectionLayout( DASHBOARD_NAME, 'traffic' ) );

		await act( async () => {
			await result.current[ 2 ]();
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/dashboards/traffic/default-layout',
		} );
		expect( set ).toHaveBeenCalledWith( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, {
			traffic: [ widget( 'default-widget' ) ],
		} );
	} );
} );
