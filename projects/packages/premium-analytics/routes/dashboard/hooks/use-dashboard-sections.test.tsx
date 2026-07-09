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

/**
 * Builds unique dashboard names so the module-level hook cache stays isolated per test.
 *
 * @param slug - Test-specific dashboard suffix.
 * @return Dashboard name.
 */
function getDashboardName( slug: string ): DashboardName {
	return `jetpack-premium-analytics_${ slug }` as DashboardName;
}

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
		const dashboardName = getDashboardName( 'loads-sections' );
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
		const dashboardName = getDashboardName( 'updates-section-layout' );
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
		const dashboardName = getDashboardName( 'resets-section-layout' );
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

	it( 'shares an in-flight section request across consumers', async () => {
		const dashboardName = getDashboardName( 'dedupes-section-requests' );
		let resolveSections!: ( sections: DashboardSection[] ) => void;
		const sectionsPromise = new Promise< DashboardSection[] >( resolve => {
			resolveSections = resolve;
		} );
		mockApiFetch.mockReturnValueOnce( sectionsPromise );

		const { result: firstResult } = renderHook( () => useDashboardSections( dashboardName ) );
		const { result: secondResult } = renderHook( () => useDashboardSections( dashboardName ) );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: getDashboardSectionsPath( dashboardName ),
		} );

		await act( async () => {
			resolveSections( [ trafficSection ] );
			await sectionsPromise;
		} );

		await waitFor( () => expect( firstResult.current.isResolvingSections ).toBe( false ) );
		await waitFor( () => expect( secondResult.current.isResolvingSections ).toBe( false ) );
		expect( firstResult.current.sections ).toEqual( [ trafficSection ] );
		expect( secondResult.current.sections ).toEqual( [ trafficSection ] );
	} );
} );
