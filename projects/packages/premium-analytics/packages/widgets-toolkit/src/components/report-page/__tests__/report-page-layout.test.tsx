/**
 * External dependencies
 */
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportPageLayout } from '../report-page-layout';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

// Identifiable, and recording what the layout hands it.
jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/ui' ),
	DateFiltersPanel: jest.fn( () => <div data-testid="date-filters-panel" /> ),
} ) );

const dateFiltersPanelMock = jest.mocked( DateFiltersPanel );

const APPLIED_RANGE = {
	from: new Date( Date.UTC( 2024, 0, 8 ) ),
	to: new Date( Date.UTC( 2024, 0, 14, 23, 59, 59, 999 ) ),
};

// A draft over the applied window, so the controller reaches the panel mid-edit.
const STAGED_RANGE = {
	from: new Date( Date.UTC( 2019, 0, 7 ) ),
	to: new Date( Date.UTC( 2019, 0, 13, 23, 59, 59, 999 ) ),
};

/** A controller mid-edit: a staged range and comparison over an applied window. */
function buildDateFilters(): ReportDateFilters {
	return {
		presetId: 'custom',
		range: STAGED_RANGE,
		appliedPresetId: 'custom',
		appliedRange: APPLIED_RANGE,
		comparisonPresetId: 'previous-month',
		appliedComparisonPresetId: 'previous-period',
		interval: 'week',
		appliedInterval: 'day',
		intervalOptions: [ 'day', 'week' ],
		onChange: jest.fn(),
		onComparisonChange: jest.fn(),
		onIntervalChange: jest.fn(),
		onStep: jest.fn(),
		onApply: jest.fn(),
		onCancel: jest.fn(),
		canApply: true,
		timeZone: 'UTC',
		replaceRange: jest.fn(),
		drillDown: jest.fn(),
	};
}

describe( 'ReportPageLayout', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders the report title as the section heading', () => {
		render( <ReportPageLayout title="Posts & Pages">table</ReportPageLayout> );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( 'Posts & Pages' );
	} );

	it( 'mounts the date picker with the controller it was given', () => {
		const dateFilters = buildDateFilters();

		render(
			<ReportPageLayout title="Posts & Pages" dateFilters={ dateFilters }>
				table
			</ReportPageLayout>
		);

		expect( screen.getByTestId( 'date-filters-panel' ) ).toBeInTheDocument();
		expect( dateFiltersPanelMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( dateFilters )
		);
	} );

	// Whether the panel draws the comparison control is the report route's scope; the
	// layout only has to leave the comparison state alone on its way through.
	it( 'passes the comparison state through without disturbing it', () => {
		const dateFilters = buildDateFilters();

		render(
			<ReportPageLayout title="Posts & Pages" dateFilters={ dateFilters }>
				table
			</ReportPageLayout>
		);

		const panelProps = dateFiltersPanelMock.mock.calls[ 0 ][ 0 ];

		expect( panelProps.withIntervalControl ).toBeUndefined();

		// Hidden, not cleared: both ride along for the dashboard.
		expect( panelProps.comparisonPresetId ).toBe( 'previous-month' );
		expect( panelProps.interval ).toBe( 'week' );
		expect( dateFilters.onComparisonChange ).not.toHaveBeenCalled();
		expect( dateFilters.onIntervalChange ).not.toHaveBeenCalled();
	} );

	it( 'mounts no date picker on a report with no date window', () => {
		render( <ReportPageLayout title="Emails">table</ReportPageLayout> );

		expect( screen.queryByTestId( 'date-filters-panel' ) ).not.toBeInTheDocument();
	} );
} );
