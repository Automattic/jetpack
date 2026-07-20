/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { useDashboardSections } from './use-dashboard-sections';
import type { DashboardSection } from '../config';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockGetScriptData = getScriptData as jest.Mock;
const mockApiFetch = apiFetch as unknown as jest.Mock;

const DASHBOARD_NAME = 'jetpack-premium-analytics_dashboard';
const SECTIONS_PATH = `/wpcom/v2/dashboards/${ DASHBOARD_NAME }/sections`;

const SERVER_SECTIONS: DashboardSection[] = [
	{ id: 'analytics/traffic', slug: 'traffic', label: 'Traffic', order: 10 },
	{ id: 'analytics/insights', slug: 'insights', label: 'Insights', order: 20 },
	{ id: 'woocommerce/store', slug: 'store', label: 'Store', order: 40 },
];

beforeEach( () => {
	mockGetScriptData.mockReset();
	mockApiFetch.mockReset();
} );

describe( 'useDashboardSections', () => {
	it( 'resolves the section list synchronously from the preload', () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: {
				dashboard_sections_preload: { [ SECTIONS_PATH ]: { body: SERVER_SECTIONS } },
			},
		} );

		const { result } = renderHook( () => useDashboardSections( DASHBOARD_NAME ) );

		// First render already carries the full list — no async gap, no tab-bar flash.
		expect( result.current ).toEqual( SERVER_SECTIONS );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'fetches the section list when no preload is present', async () => {
		mockGetScriptData.mockReturnValue( {} );
		mockApiFetch.mockResolvedValue( SERVER_SECTIONS );

		const { result } = renderHook( () => useDashboardSections( DASHBOARD_NAME ) );

		expect( result.current ).toEqual( [] );

		await waitFor( () => expect( result.current ).toEqual( SERVER_SECTIONS ) );
		expect( mockApiFetch ).toHaveBeenCalledWith( { path: SECTIONS_PATH } );
	} );

	it( 'leaves the section list empty when the fetch fails', async () => {
		mockGetScriptData.mockReturnValue( {} );
		mockApiFetch.mockRejectedValue( new Error( 'nope' ) );

		const { result } = renderHook( () => useDashboardSections( DASHBOARD_NAME ) );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		expect( result.current ).toEqual( [] );
	} );
} );
