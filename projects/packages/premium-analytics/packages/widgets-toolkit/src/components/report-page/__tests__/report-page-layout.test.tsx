/**
 * External dependencies
 */
import { toLocalTZ } from '@jetpack-premium-analytics/datetime';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportEmptyState } from '../report-empty-state';
import { ReportPageLayout } from '../report-page-layout';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

// Identifiable, and recording what the layout hands it.
jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/ui' ),
	DateFiltersPanel: jest.fn( () => <div data-testid="date-filters-panel" /> ),
} ) );

const dateFiltersPanelMock = jest.mocked( DateFiltersPanel );

const APPLIED_RANGE = {
	from: toLocalTZ( Date.UTC( 2024, 0, 8 ), 'UTC' ),
	to: toLocalTZ( Date.UTC( 2024, 0, 14, 23, 59, 59, 999 ), 'UTC' ),
};

// A draft over the applied window, so the controller reaches the panel mid-edit.
const STAGED_RANGE = {
	from: toLocalTZ( Date.UTC( 2019, 0, 7 ), 'UTC' ),
	to: toLocalTZ( Date.UTC( 2019, 0, 13, 23, 59, 59, 999 ), 'UTC' ),
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
		const panelProps = dateFiltersPanelMock.mock.calls[ 0 ][ 0 ];
		expect( panelProps ).toEqual( expect.objectContaining( dateFilters ) );
		// The interval control stays hidden; the staged interval still rides along for the dashboard.
		expect( panelProps.withIntervalControl ).toBeUndefined();
	} );

	it.each( [
		[
			'tells the empty state its report has a time period',
			buildDateFilters(),
			'We couldn’t find results for this time period.',
		],
		[
			'tells the empty state its report has no time period',
			undefined,
			'We couldn’t find any results.',
		],
	] )( '%s', ( _title, dateFilters, copy ) => {
		render(
			<ReportPageLayout title="Posts & Pages" dateFilters={ dateFilters }>
				<ReportEmptyState />
			</ReportPageLayout>
		);

		expect( screen.getByText( copy ) ).toBeInTheDocument();
	} );

	it( 'mounts no date picker on a report with no date window', () => {
		render( <ReportPageLayout title="Emails">table</ReportPageLayout> );

		expect( screen.queryByTestId( 'date-filters-panel' ) ).not.toBeInTheDocument();
	} );
} );
