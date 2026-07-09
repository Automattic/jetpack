/* eslint-disable import/no-extraneous-dependencies */
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import {
	getDashboardSectionLayoutPath,
	getDashboardSectionsPath,
	useDashboardSections,
} from './use-dashboard-sections';
import type { DashboardName } from './use-dashboard-layout';
import type { DashboardSection } from '../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;
const dashboardName = 'jetpack-premium-analytics_dashboard' as DashboardName;

const defaultLayout: DashboardWidget[] = [
	{
		uuid: 'default-traffic-widget',
		type: 'jpa/visitors-over-time',
	},
];

const customLayout: DashboardWidget[] = [
	{
		uuid: 'custom-subscribers-widget',
		type: 'jpa/subscribers-chart',
	},
];

const trafficSection: DashboardSection = {
	id: 'analytics/traffic',
	label: 'Traffic',
	order: 10,
	layout: defaultLayout,
	hasCustomLayout: false,
};

const subscribersSection: DashboardSection = {
	id: 'analytics/subscribers',
	label: 'Subscribers',
	order: 30,
	layout: customLayout,
	hasCustomLayout: true,
};

beforeEach( () => {
	mockApiFetch.mockReset();
} );

describe( 'useDashboardSections', () => {
	it( 'loads the server-resolved section layouts', async () => {
		mockApiFetch.mockResolvedValueOnce( [ subscribersSection, trafficSection ] );

		const { result } = renderHook( () => useDashboardSections( dashboardName ) );

		expect( result.current.isResolvingSections ).toBe( true );
		await waitFor( () => expect( result.current.isResolvingSections ).toBe( false ) );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: getDashboardSectionsPath( dashboardName ),
		} );
		expect( result.current.sections ).toEqual( [ trafficSection, subscribersSection ] );
		expect( result.current.sections[ 0 ].layout ).toBe( defaultLayout );
		expect( result.current.sections[ 0 ].hasCustomLayout ).toBe( false );
	} );

	it( 'persists section layout changes through the section layout API', async () => {
		mockApiFetch.mockResolvedValueOnce( [ trafficSection ] );
		const { result } = renderHook( () => useDashboardSections( dashboardName ) );
		await waitFor( () => expect( result.current.sections ).toEqual( [ trafficSection ] ) );

		const updatedSection: DashboardSection = {
			...trafficSection,
			layout: customLayout,
			hasCustomLayout: true,
		};
		mockApiFetch.mockResolvedValueOnce( updatedSection );

		await act( async () => {
			await result.current.updateSectionLayout( 'analytics/traffic', customLayout );
		} );

		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: getDashboardSectionLayoutPath( dashboardName, 'analytics/traffic' ),
			method: 'PUT',
			data: { layout: customLayout },
		} );
		expect( result.current.sections ).toEqual( [ updatedSection ] );
	} );

	it( 'resets active section layouts through the section layout API', async () => {
		const customizedTrafficSection: DashboardSection = {
			...trafficSection,
			layout: customLayout,
			hasCustomLayout: true,
		};
		mockApiFetch.mockResolvedValueOnce( [ customizedTrafficSection ] );
		const { result } = renderHook( () => useDashboardSections( dashboardName ) );
		await waitFor( () =>
			expect( result.current.sections ).toEqual( [ customizedTrafficSection ] )
		);

		mockApiFetch.mockResolvedValueOnce( trafficSection );

		await act( async () => {
			await result.current.resetSectionLayout( 'analytics/traffic' );
		} );

		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: getDashboardSectionLayoutPath( dashboardName, 'analytics/traffic' ),
			method: 'DELETE',
		} );
		expect( result.current.sections ).toEqual( [ trafficSection ] );
	} );
} );
