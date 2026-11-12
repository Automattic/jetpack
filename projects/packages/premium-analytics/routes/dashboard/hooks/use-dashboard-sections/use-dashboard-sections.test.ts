/**
 * External dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE, setSectionOrder } from '@jetpack-premium-analytics/data';
import { act, renderHook } from '@testing-library/react';
// Registers the store the order is kept in.
import '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { useDashboardSections } from './use-dashboard-sections';

const mockUseEntityRecords = jest.fn();

jest.mock( '@wordpress/core-data', () => ( {
	useEntityRecords: ( ...args: unknown[] ) => mockUseEntityRecords( ...args ),
} ) );

const RECORDS = [
	{ id: 'analytics/traffic', slug: 'traffic' },
	{ id: 'analytics/insights', slug: 'insights' },
];

describe( 'useDashboardSections', () => {
	beforeEach( () => {
		mockUseEntityRecords.mockReset();
	} );

	afterEach( () => {
		// The hook is still mounted, and follows the store.
		act( () => setSectionOrder( DASHBOARD_PREFERENCES_SCOPE ) );
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
		mockUseEntityRecords.mockReturnValue( { records: RECORDS, hasResolved: true } );

		const { result } = renderHook( () => useDashboardSections() );

		expect( result.current.sections ).toBe( RECORDS );
		expect( result.current.hasResolved ).toBe( true );
	} );

	it( 'follows the order the reader arranges, as they arrange it', () => {
		mockUseEntityRecords.mockReturnValue( { records: RECORDS, hasResolved: true } );
		const { result } = renderHook( () => useDashboardSections() );

		act( () => setSectionOrder( DASHBOARD_PREFERENCES_SCOPE, [ 'insights' ] ) );

		expect( result.current.sections.map( section => section.slug ) ).toEqual( [
			'insights',
			'traffic',
		] );
	} );
} );
