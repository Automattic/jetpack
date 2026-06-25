/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { DASHBOARD_NAME, DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_REST_NAMESPACE } from './constants';
import { useDashboardLayout } from './use-dashboard-layout';
import { useDashboardSectionLayout } from './use-dashboard-section-layout';
import type { DashboardSectionLayouts } from '../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/data' );
jest.mock( '@wordpress/preferences', () => ( {
	store: { name: 'core/preferences' },
} ) );
jest.mock( './use-dashboard-layout' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;
const mockUseDispatch = useDispatch as jest.MockedFunction< typeof useDispatch >;
const mockUseSelect = useSelect as jest.MockedFunction< typeof useSelect >;
const mockUseDashboardLayout = useDashboardLayout as jest.MockedFunction<
	typeof useDashboardLayout
>;
const mockSet = jest.fn();

let sectionLayouts: DashboardSectionLayouts;

const flatDefaultLayout: DashboardWidget[] = [
	{
		uuid: 'flat-default-widget',
		type: 'jpa/hello-world',
	},
];

beforeEach( () => {
	sectionLayouts = {};
	mockApiFetch.mockResolvedValue( [] );
	mockUseDashboardLayout.mockReturnValue( [ flatDefaultLayout, jest.fn(), jest.fn() ] );
	mockUseDispatch.mockReturnValue( { set: mockSet } as never );
	mockUseSelect.mockImplementation( callback =>
		callback(
			() =>
				( {
					get: () => sectionLayouts,
				} ) as never
		)
	);
} );

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'useDashboardSectionLayout', () => {
	it( 'uses an explicit empty section layout instead of falling back to the flat default', () => {
		sectionLayouts = {
			insights: [],
		};

		const { result } = renderHook( () => useDashboardSectionLayout( DASHBOARD_NAME, 'insights' ) );

		expect( result.current[ 0 ] ).toEqual( [] );
	} );

	it( 'resets the active section from the section-aware default route', async () => {
		const existingTrafficLayout: DashboardWidget[] = [
			{
				uuid: 'custom-traffic-widget',
				type: 'jpa/custom-traffic',
			},
		];
		const resetTrafficLayout: DashboardWidget[] = [
			{
				uuid: 'default-traffic-top-posts-widget-instance',
				type: 'jpa/stats-top-posts',
			},
		];
		sectionLayouts = {
			traffic: existingTrafficLayout,
			insights: [],
		};
		mockApiFetch.mockResolvedValue( resetTrafficLayout );

		const { result } = renderHook( () => useDashboardSectionLayout( DASHBOARD_NAME, 'traffic' ) );

		await act( async () => {
			await result.current[ 2 ]();
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: `/${ DASHBOARD_REST_NAMESPACE }/dashboards/${ DASHBOARD_NAME }/sections/traffic/default-layout`,
		} );
		expect( mockSet ).toHaveBeenCalledWith(
			DASHBOARD_PREFERENCES_SCOPE,
			'dashboardSectionLayouts',
			{
				traffic: resetTrafficLayout,
				insights: [],
			}
		);
	} );
} );
