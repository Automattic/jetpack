/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useDashboardSections } from './use-dashboard-sections';

const mockUseEntityRecords = jest.fn();

jest.mock( '@wordpress/core-data', () => ( {
	useEntityRecords: ( ...args: unknown[] ) => mockUseEntityRecords( ...args ),
} ) );

describe( 'useDashboardSections', () => {
	beforeEach( () => {
		mockUseEntityRecords.mockReset();
	} );

	it( 'asks core-data for every dashboard section, not its default first page', () => {
		mockUseEntityRecords.mockReturnValue( { records: null, hasResolved: false } );

		renderHook( () => useDashboardSections() );

		expect( mockUseEntityRecords ).toHaveBeenCalledWith( 'root', 'dashboardSection', {
			per_page: -1,
		} );
	} );

	it( 'reports an empty, unresolved list while the query is in flight', () => {
		mockUseEntityRecords.mockReturnValue( { records: null, hasResolved: false } );

		const { result } = renderHook( () => useDashboardSections() );

		expect( result.current ).toEqual( { sections: [], hasResolved: false } );
	} );

	it( 'hands back the records in the server order once resolved', () => {
		const records = [
			{ id: 'analytics/traffic', slug: 'traffic' },
			{ id: 'analytics/insights', slug: 'insights' },
		];
		mockUseEntityRecords.mockReturnValue( { records, hasResolved: true } );

		const { result } = renderHook( () => useDashboardSections() );

		expect( result.current.sections ).toBe( records );
		expect( result.current.hasResolved ).toBe( true );
	} );
} );
