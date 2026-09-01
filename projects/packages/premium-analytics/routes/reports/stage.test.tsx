/**
 * External dependencies
 */
import { useReportScope } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { stage as ReportStage } from './stage';
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
	GlobalChartsProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	siteChartFormatting: () => ( {} ),
	useChartTheme: () => ( {} ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Spinner: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	useParams: () => ( { report: 'posts' } ),
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
	it( 'declares no comparison for every report page', async () => {
		render( <ReportStage /> );

		await expect( screen.findByText( 'no comparison' ) ).resolves.toBeInTheDocument();
	} );
} );
