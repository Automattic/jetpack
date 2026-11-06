/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { renderHook } from '@testing-library/react';
import { RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { createNoticesRegistry } from '../../../../../tests/js/notice-test-utils';
import { createWidgetActionsHost } from '../../../../../tests/js/widget-host-test-utils';
import { WidgetRootContext } from '../../components/widget-root';
import { useReportActions } from '../use-report-actions';
import type { ReportCsvExporter } from '../../report-exports/types';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../../../../tests/js/route-test-utils' );

	return mockWordPressRoute;
} );

const mockGetScriptData = jest.mocked( getScriptData );

const { registry } = createNoticesRegistry();

const NAVIGATION_PARAMS = {
	from: '2026-03-01',
	to: '2026-03-10',
	interval: 'day',
	comp: '1',
	compare_from: '2026-02-01',
	compare_to: '2026-02-10',
} as unknown as ReportParams;

const SETTLED = { isLoading: false, isFetching: false, isError: false };

const exporter = {
	filenamePrefix: 'referrers',
	hasDateRange: true,
	fetchItems: jest.fn(),
	toCsvRows: jest.fn(),
	getColumns: jest.fn(),
} as unknown as ReportCsvExporter< unknown, unknown >;

function setUp() {
	mockGetScriptData.mockReturnValue( undefined );
	const { WidgetActionsHost, declaredActions } = createWidgetActionsHost();

	function wrapper( { children }: { children: ReactNode } ) {
		return (
			<RegistryProvider value={ registry }>
				<WidgetRootContext.Provider
					value={ { reportParams: NAVIGATION_PARAMS, navigationParams: NAVIGATION_PARAMS } }
				>
					<WidgetActionsHost>{ children }</WidgetActionsHost>
				</WidgetRootContext.Provider>
			</RegistryProvider>
		);
	}

	return { wrapper, declaredActions };
}

describe( 'useReportActions', () => {
	it( 'declares View all as the prominent action, carrying the report window and the tab', () => {
		const { wrapper, declaredActions } = setUp();

		const { result } = renderHook(
			() => useReportActions( { report: 'referrers', section: 'sources' } ),
			{ wrapper }
		);

		expect( result.current ).toBe( true );
		expect( declaredActions() ).toEqual( [
			{
				id: 'view-all',
				label: 'View all',
				relevance: 'high',
				href:
					'admin.php?page=jetpack-premium-analytics-wp-admin&p=' +
					encodeURIComponent(
						'/reports/referrers?from=2026-03-01&to=2026-03-10&interval=day' +
							'&compare_from=2026-02-01&compare_to=2026-02-10&comp=%221%22&section=sources'
					),
			},
		] );
	} );

	it( 'adds the CSV download as the compact action once the rows settle', () => {
		const { wrapper, declaredActions } = setUp();

		const { rerender } = renderHook(
			( status: typeof SETTLED ) =>
				useReportActions( { report: 'referrers', csv: { exporter, status, rowCount: 3 } } ),
			{ wrapper, initialProps: { ...SETTLED, isLoading: true } }
		);

		expect( declaredActions().map( action => action.id ) ).toEqual( [ 'view-all' ] );

		rerender( SETTLED );

		expect( declaredActions() ).toEqual( [
			expect.objectContaining( { id: 'view-all' } ),
			expect.objectContaining( {
				id: 'download-csv',
				label: 'Download CSV',
				relevance: 'medium',
				callback: expect.any( Function ),
			} ),
		] );
	} );

	it( "places the widget's own actions before the download", () => {
		const { wrapper, declaredActions } = setUp();
		const ownAction = {
			id: 'build-url',
			label: 'Build URL',
			relevance: 'medium' as const,
			callback: jest.fn(),
		};

		renderHook(
			() =>
				useReportActions( {
					report: 'referrers',
					csv: { exporter, status: SETTLED, rowCount: 3 },
					actions: [ ownAction ],
				} ),
			{ wrapper }
		);

		expect( declaredActions().map( action => action.id ) ).toEqual( [
			'view-all',
			'build-url',
			'download-csv',
		] );
	} );

	it( 'declares nothing to a host that places no actions', () => {
		const { result } = renderHook( () => useReportActions( { report: 'referrers' } ), {
			wrapper: ( { children }: { children: ReactNode } ) => (
				<RegistryProvider value={ registry }>
					<WidgetRootContext.Provider value={ { reportParams: NAVIGATION_PARAMS } }>
						{ children }
					</WidgetRootContext.Provider>
				</RegistryProvider>
			),
		} );

		expect( result.current ).toBe( false );
	} );
} );
