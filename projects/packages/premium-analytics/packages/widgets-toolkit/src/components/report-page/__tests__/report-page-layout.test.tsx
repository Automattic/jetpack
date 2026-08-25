/**
 * External dependencies
 */
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { render, screen } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
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

// Captured before any test installs settings, so repeats do not compound.
const DEFAULT_SETTINGS = getSettings();

const APPLIED_RANGE = {
	from: new Date( Date.UTC( 2024, 0, 8 ) ),
	to: new Date( Date.UTC( 2024, 0, 14, 23, 59, 59, 999 ) ),
};

// Another year, so a subtitle reading the draft instead of the applied range
// is unmistakable.
const STAGED_RANGE = {
	from: new Date( Date.UTC( 2019, 0, 7 ) ),
	to: new Date( Date.UTC( 2019, 0, 13, 23, 59, 59, 999 ) ),
};

/**
 * A controller mid-edit: a staged range and comparison over an applied window.
 *
 * @return The date filters.
 */
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
		setSettings( {
			...DEFAULT_SETTINGS,
			formats: { ...DEFAULT_SETTINGS.formats, date: 'F j, Y' },
			timezone: { offset: 0, offsetFormatted: '0', string: 'UTC', abbr: 'UTC' },
		} );
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

	// Holds still while an edit is open; moves only on Apply.
	it( 'describes the applied window rather than the staged draft', () => {
		render(
			<ReportPageLayout title="Posts & Pages" dateFilters={ buildDateFilters() }>
				table
			</ReportPageLayout>
		);

		expect( screen.getByText( /2024/ ) ).not.toHaveTextContent( '2019' );
	} );

	// The header offers a control for neither, so it describes neither.
	it( 'names neither the chart interval nor the comparison the controller carries', () => {
		render(
			<ReportPageLayout title="Posts & Pages" dateFilters={ buildDateFilters() }>
				table
			</ReportPageLayout>
		);

		const subtitle = screen.getByText( /2024/ );

		expect( subtitle ).not.toHaveTextContent( /hourly|daily|weekly|monthly|quarterly|yearly/ );
		expect( subtitle ).not.toHaveTextContent( /vs\.|Previous period|Previous month/ );
	} );

	// Whether the panel draws the comparison control is the report route's
	// declared scope, not this layout's business — it only has to leave the
	// comparison state alone on its way through.
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

	it( 'leaves the header the title alone on a report with no date window', () => {
		const { container } = render( <ReportPageLayout title="Emails">table</ReportPageLayout> );

		expect( screen.queryByTestId( 'date-filters-panel' ) ).not.toBeInTheDocument();
		expect( container ).not.toHaveTextContent( /\(\d/ );
	} );
} );
