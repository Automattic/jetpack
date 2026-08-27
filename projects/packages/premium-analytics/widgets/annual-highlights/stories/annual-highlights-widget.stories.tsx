/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
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
}

function renderAnnualHighlights( { metrics }: AnnualHighlightsStoryControls ) {
	return (
		<AnnualHighlightsRender
			attributes={ {
				reportParams: getDefaultQueryParams(),
				metrics,
			} }
		/>
	);
}

const METRIC_OPTIONS = DEFAULT_HIGHLIGHT_METRICS.map( metric => ( {
	value: metric,
	label: metric.charAt( 0 ).toUpperCase() + metric.slice( 1 ),
} ) );

/**
 * Forces the insights request into a loading/error/empty state for a story.
 *
 * The insights endpoint is not period-scoped, so its query key carries no date
 * params and a distinct date preset alone would not give the story a fresh
 * cache entry. Evict the query from the shared client on enter and on cleanup
 * so each forced-state story hits the mock fresh (and no forced result leaks
 * into the sibling stories).
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
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_HIGHLIGHT_METRICS,
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
					"The \"Year in review\" widget. Shows one year's totals — posts, words, likes, and comments — as a grid of metric tiles, with a year dropdown in the widget body that defaults to the current year. The insights endpoint returns every year in one request, so switching years is a client-side row pick with no new fetch; the section's date selection plays no part. Which tiles appear is controlled by the `metrics` attribute (`relevance: 'high'`), exposed inline in the widget header and in the settings drawer. Data comes from the designated `useStatsInsights` hook; in Storybook it is served by `registerReportMocks()` (the `stats/insights` handler in `routeStatsReport`, whose mock carries the current and previous year). The insights module has no comparison period, so the tiles show bare counts.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof AnnualHighlightsRender > & AnnualHighlightsStoryControls >;

export default meta;

type Story = StoryObj< AnnualHighlightsStoryControls >;

/**
 * The widget on its own, populated from the mocked insights payload. The year
 * dropdown is live: the mock carries the current and previous year.
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
	render: () => renderAnnualHighlights( ALL_METRICS_ARGS ),
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
	render: () => renderAnnualHighlights( ALL_METRICS_ARGS ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => forceInsightsState( 'error' ),
};

/**
 * Resolved with no years: the widget shows its empty state (the neutral calendar
 * glyph and "No highlights for this year.").
 */
export const Empty: Story = {
	render: () => renderAnnualHighlights( ALL_METRICS_ARGS ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => forceInsightsState( 'empty' ),
};

interface AnnualHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AnnualHighlightsStoryControls {}

function AnnualHighlightsDashboardStory( {
	metrics,
	...dashboardArgs
}: AnnualHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ ANNUAL_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={ AnnualHighlightsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				// Comparison params by default, per the story template: the widget
				// ignores report params, and this story covers that it keeps doing so
				// when the host supplies them.
				reportParams: getDefaultQueryParams( true ),
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
