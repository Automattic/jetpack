/**
 * External dependencies
 */
import { ReportScopeProvider, useReportScope } from '@jetpack-premium-analytics/data';
import { render, renderHook, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { stage as ReportStage } from './stage';
import { useReportParams } from './use-report-params';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	AnalyticsQueryClientProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	GlobalErrorProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	Stack: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	ChartsProvider: ( { children }: { children: ReactNode } ) => (
		<div data-testid="charts-provider">{ children }</div>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Spinner: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	useParams: () => ( { report: 'posts' } ),
	useSearch: () => ( {
		from: '2026-06-01T00:00:00+00:00',
		to: '2026-06-30T23:59:59+00:00',
		interval: 'day',
		preset: 'custom',
		comp: '1',
		compare_from: '2026-05-02T00:00:00+00:00',
		compare_to: '2026-05-31T23:59:59+00:00',
		compare_preset: 'previous-period',
	} ),
} ) );

/**
 * Reads the scope from where a report page renders.
 *
 * @return The declared scope, as text.
 */
function MockScopeProbe() {
	const { offersComparison } = useReportScope();

	return <span>{ offersComparison ? 'offers comparison' : 'no comparison' }</span>;
}

jest.mock( './registry', () => ( {
	getReportDefinition: () => ( {
		load: () => Promise.resolve( { default: MockScopeProbe } ),
	} ),
} ) );

describe( 'Report stage report scope', () => {
	it( 'renders the report inside the charts provider, with no comparison', async () => {
		render( <ReportStage /> );

		const provider = await screen.findByTestId( 'charts-provider' );

		expect( provider ).toContainElement( await screen.findByText( 'no comparison' ) );
	} );
} );

describe( 'useReportParams', () => {
	/*
	 * A report offers no comparison control and its header names no compared
	 * period, so a delta in the table would have no baseline the reader can see.
	 */
	it( 'drops the comparison the URL carries in and keeps the window', () => {
		const { result } = renderHook( () => useReportParams(), {
			wrapper: ( { children } ) => (
				<ReportScopeProvider offersComparison={ false }>{ children }</ReportScopeProvider>
			),
		} );

		expect( result.current ).not.toHaveProperty( 'comp' );
		expect( result.current ).toMatchObject( {
			from: '2026-06-01T00:00:00+00:00',
			to: '2026-06-30T23:59:59+00:00',
			interval: 'day',
		} );
	} );

	// Guards the hook against re-hardcoding the strip: the surface decides, so a
	// surface that offers a comparison must get one.
	it( 'keeps the comparison where the surface offers one', () => {
		const { result } = renderHook( () => useReportParams() );

		expect( result.current ).toMatchObject( {
			comp: '1',
			compare_from: '2026-05-02T00:00:00+00:00',
		} );
	} );
} );
