/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	queryClient,
	resolveIntervalForRange,
	type PresetType,
} from '@jetpack-premium-analytics/data';
import {
	PRESET_ALL_TIME,
	getPresetYear,
	toYearPresetId,
	type YearPresetId,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withStoryRouter } from '../../stories/with-story-router';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AnnualHighlightsRender from '../render';
import widgetDefinition, { DEFAULT_HIGHLIGHT_METRICS, type AnnualHighlightMetric } from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const ANNUAL_HIGHLIGHTS_RENDER_MODULE = 'storybook/annual-highlights';

// Carry the widget's metadata, including the metric-visibility attribute schema
// so the dashboard story's settings drawer renders the real checkboxes.
// `presentation` comes from widget.json ( 'framed' ), so the host frames the
// widget and renders its identity (title + icon).
const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

interface AnnualHighlightsStoryControls {
	/**
	 * Metric tiles to show in the widget body.
	 */
	metrics: AnnualHighlightMetric[];

	/**
	 * What the section's date filter has selected. The Insights section offers
	 * all time and single years; `latest` stands for any other section, where
	 * the widget falls back to the most recent year.
	 */
	dateSelection: DateSelection;
}

type DateSelection = 'latest' | typeof PRESET_ALL_TIME | YearPresetId;

// The mocked insights payload carries 2025 and 2026, so both pills have data
// behind them and switching between them visibly changes every tile.
const MOCK_INSIGHTS_YEARS = [ 2026, 2025 ] as const;

/**
 * Report params carrying a section's date selection, the way the URL does in
 * product: the year-surface preset next to the range it resolves to.
 *
 * @param selection      - The story's date selection.
 * @param withComparison - Whether to include comparison params from the host.
 * @return Report params for the widget.
 */
function reportParamsFor( selection: DateSelection, withComparison = false ) {
	const params = getDefaultQueryParams( withComparison );
	if ( selection === 'latest' ) {
		return params;
	}

	const startYear =
		selection === PRESET_ALL_TIME
			? Math.min( ...MOCK_INSIGHTS_YEARS )
			: getPresetYear( selection ) ?? Math.max( ...MOCK_INSIGHTS_YEARS );
	const endYear = selection === PRESET_ALL_TIME ? Math.max( ...MOCK_INSIGHTS_YEARS ) : startYear;
	const from = `${ startYear }-01-01T00:00:00.000Z`;
	const to = `${ endYear }-12-31T23:59:59.999Z`;

	return {
		...params,
		preset: selection,
		from,
		to,
		interval: resolveIntervalForRange( selection, from, to, params.interval ),
	};
}

/**
 * Renders the data-connected widget with the selected metrics.
 *
 * @param {AnnualHighlightsStoryControls} props - Story controls.
 * @return The rendered widget.
 */
function renderAnnualHighlights( { metrics, dateSelection }: AnnualHighlightsStoryControls ) {
	return (
		<AnnualHighlightsRender
			attributes={ {
				reportParams: reportParamsFor( dateSelection ),
				metrics,
			} }
		/>
	);
}

const METRIC_OPTIONS = DEFAULT_HIGHLIGHT_METRICS.map( metric => ( {
	value: metric,
	label: metric.charAt( 0 ).toUpperCase() + metric.slice( 1 ),
} ) );

// Distinct preset → own query-cache entry; see forceStatsMockState. Every metric tile enabled.
function renderAnnualHighlightsOnPreset( preset: PresetType ) {
	return (
		<AnnualHighlightsRender
			attributes={ {
				reportParams: getDefaultQueryParams( false, preset ),
				metrics: DEFAULT_HIGHLIGHT_METRICS,
			} }
		/>
	);
}

/**
 * Forces the insights request into a loading/error/empty state for a story.
 *
 * The insights endpoint is not period-scoped, so its query key carries no date
 * params and a distinct date preset alone would not give the story a fresh
 * cache entry. Evict the query from the shared client on enter and on cleanup
 * so each forced-state story hits the mock fresh (and no forced result leaks
 * into the sibling stories).
 *
 * @param state - The forced state.
 * @return The story cleanup callback.
 */
function forceInsightsState( state: 'loading' | 'error' | 'empty' ) {
	setReportMockState( 'stats/insights', state );
	queryClient.removeQueries( { queryKey: [ 'stats', 'insights' ] } );
	return () => {
		setReportMockState( 'stats/insights', null );
		queryClient.removeQueries( { queryKey: [ 'stats', 'insights' ] } );
	};
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: METRIC_OPTIONS.map( option => option.value ),
	},
	dateSelection: {
		control: 'select',
		options: [ 'latest', PRESET_ALL_TIME, ...MOCK_INSIGHTS_YEARS.map( toYearPresetId ) ],
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_HIGHLIGHT_METRICS,
	dateSelection: 'latest',
} as const;

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AnnualHighlights',
	component: AnnualHighlightsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					"The \"Annual highlights\" widget. Shows the most recent year's totals — posts, words, likes, and comments — as a grid of metric tiles. Which tiles appear is controlled by the `metrics` attribute (`relevance: 'high'`), exposed inline in the widget header and in the settings drawer. Data comes from the designated `useStatsInsights` hook; in Storybook it is served by `registerReportMocks()` (the `stats/insights` handler in `routeStatsReport`). The insights module has no comparison period, so the tiles show bare counts.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof AnnualHighlightsRender > & AnnualHighlightsStoryControls >;

export default meta;

type Story = StoryObj< AnnualHighlightsStoryControls >;

/**
 * The widget on its own, populated from the mocked insights payload.
 */
export const Default: Story = {
	render: renderAnnualHighlights,
	args: { ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderAnnualHighlightsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => forceInsightsState( 'loading' ),
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderAnnualHighlightsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => forceInsightsState( 'error' ),
};

/**
 * Resolved with no years: the widget shows its empty state (the neutral calendar
 * glyph and "No highlights for this period.").
 */
export const Empty: Story = {
	render: () => renderAnnualHighlightsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => forceInsightsState( 'empty' ),
};

interface AnnualHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AnnualHighlightsStoryControls {}

/**
 * Renders the real registered widget through the shared dashboard harness.
 *
 * @param {AnnualHighlightsDashboardStoryProps} props - Dashboard and widget controls.
 * @return The rendered dashboard with the widget.
 */
function AnnualHighlightsDashboardStory( {
	metrics,
	dateSelection,
	...dashboardArgs
}: AnnualHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ ANNUAL_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={ AnnualHighlightsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: reportParamsFor( dateSelection, true ),
				metrics,
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< AnnualHighlightsDashboardStoryProps > = {
	render: args => <AnnualHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 1,
		widgetHeight: 1,
		...ALL_METRICS_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...METRIC_ARG_TYPES,
	},
	decorators: [ withStoryRouter ],
};
