/**
 * The stories drive the data-connected All-time stats widget through the shared
 * report-mock harness, which serves the Stats site-summary endpoint
 * (`/proxy/v1.1/stats`) via `routeStatsReport()`.
 *
 * This module has no comparison period, so `Default` and `WithComparison`
 * render identically; the toggle only exercises the date-range picker's
 * comparison params flowing through `reportParams` without breaking the widget.
 */
/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	queryClient,
	type PresetType,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import AllTimeStatsRender from '../render';
import widgetDefinition, {
	DEFAULT_ALL_TIME_STATS_METRICS,
	type AllTimeStatsMetricId,
} from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const ALL_TIME_STATS_RENDER_MODULE = 'storybook/all-time-stats';

// Carry the widget's metadata, including the metric-visibility attribute schema
// so the dashboard story's settings drawer renders the real checkboxes. The
// attribute schema is typed loosely on the widget definition, so it is cast to
// the WidgetType shape.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
};

interface AllTimeStatsStoryControls {
	/**
	 * Whether to include comparison report params.
	 */
	withComparison: boolean;
	/**
	 * Lifetime totals to show in the widget body.
	 */
	metrics: AllTimeStatsMetricId[];
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: DEFAULT_ALL_TIME_STATS_METRICS,
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_ALL_TIME_STATS_METRICS,
} as const;

/**
 * Renders the data-connected widget with report params derived from the
 * date-range picker preset and the selected metrics.
 *
 * @param {AllTimeStatsStoryControls} props - The story controls.
 * @return The rendered widget.
 */
function renderAllTimeStats( { withComparison, metrics }: AllTimeStatsStoryControls ) {
	return (
		<AllTimeStatsRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ), metrics } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderAllTimeStatsOnPreset( preset: PresetType ) {
	return (
		<AllTimeStatsRender attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

/**
 * Forces the site-summary request into a loading/error/empty state for a story.
 *
 * The summary is all-time, so its query key carries no date params and a
 * distinct date preset alone would not give the story a fresh cache entry.
 * Evict the query from the shared client on enter and on cleanup so each
 * forced-state story hits the mock fresh (and no forced result leaks into the
 * sibling stories).
 *
 * @param state - The forced state.
 * @return The story cleanup callback.
 */
function forceSiteSummaryState( state: 'loading' | 'error' | 'empty' ) {
	// The bare `/proxy/v1.1/stats` site-summary endpoint — the only stats
	// request this widget makes.
	setReportMockState( 'proxy/v1.1/stats', state );
	queryClient.removeQueries( { queryKey: [ 'stats', 'site' ] } );
	return () => {
		setReportMockState( 'proxy/v1.1/stats', null );
		queryClient.removeQueries( { queryKey: [ 'stats', 'site' ] } );
	};
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AllTimeStats',
	component: AllTimeStatsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "All-time stats" widget. Shows lifetime totals for the site — views, visitors, posts, and comments — as a labelled list of icon rows, sourced from the Jetpack Stats site-summary endpoint. Which rows appear is controlled by the `metrics` attribute (`relevance: \'high\'`), exposed inline in the widget header and in the settings drawer. This module has no comparison period, so the values render as bare numbers and the `WithComparison` story looks identical to `Default`.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof AllTimeStatsRender > & AllTimeStatsStoryControls >;

export default meta;

type Story = StoryObj< AllTimeStatsStoryControls >;

/**
 * Default state — lifetime totals for the current preset.
 */
export const Default: Story = {
	render: renderAllTimeStats,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison params flow through `reportParams`, but the site summary has no
 * comparison data, so the widget renders identically to `Default` — no fake
 * deltas.
 */
export const WithComparison: Story = {
	render: renderAllTimeStats,
	args: { withComparison: true, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderAllTimeStatsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'loading' ),
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderAllTimeStatsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'error' ),
};

/**
 * Resolved with no summary fields: the widget shows its empty state (the neutral
 * trending glyph and "No stats recorded yet.").
 */
export const Empty: Story = {
	render: () => renderAllTimeStatsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'empty' ),
};

interface AllTimeStatsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AllTimeStatsStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {AllTimeStatsDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function AllTimeStatsDashboardStory( {
	withComparison,
	metrics,
	...dashboardArgs
}: AllTimeStatsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ ALL_TIME_STATS_RENDER_MODULE }
			renderComponent={ AllTimeStatsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ), metrics } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< AllTimeStatsDashboardStoryProps > = {
	render: args => <AllTimeStatsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		...ALL_METRICS_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
};
