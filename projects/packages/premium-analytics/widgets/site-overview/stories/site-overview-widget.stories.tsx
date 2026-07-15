/**
 * The stories drive the data-connected Site overview widget through the shared
 * report-mock harness, which serves the Stats `summary` endpoint
 * (`/proxy/v1.1/stats/summary`) via `routeStatsReport()`.
 *
 * This module has genuine period-over-period comparison data, so
 * `WithComparison` renders a delta on every tile while `Default` shows bare
 * period totals.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
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
import SiteOverviewRender from '../render';
import widgetDefinition, {
	DEFAULT_SITE_OVERVIEW_METRICS,
	type SiteOverviewMetricId,
} from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SITE_OVERVIEW_RENDER_MODULE = 'storybook/site-overview';

// Carry the widget's metadata, including the metric-visibility attribute schema,
// so the dashboard story's settings drawer renders the real checkboxes. The
// attribute schema is typed loosely on the widget definition, so it is cast to
// the WidgetType shape.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
};

interface SiteOverviewStoryControls {
	/**
	 * Whether to include comparison report params.
	 */
	withComparison: boolean;
	/**
	 * Metric tiles to show in the widget body.
	 */
	metrics: SiteOverviewMetricId[];
}

/**
 * Renders the data-connected widget with report params derived from the
 * date-range picker preset and the selected metrics.
 *
 * @param {SiteOverviewStoryControls} props - The story controls.
 * @return The rendered widget.
 */
function renderSiteOverview( { withComparison, metrics }: SiteOverviewStoryControls ) {
	return (
		<SiteOverviewRender
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				metrics,
			} }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderSiteOverviewOnPreset( preset: PresetType ) {
	return (
		<SiteOverviewRender
			attributes={ { reportParams: getDefaultQueryParams( false, preset ), ...ALL_METRICS_ARGS } }
		/>
	);
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: DEFAULT_SITE_OVERVIEW_METRICS,
		description: 'Metric tiles to show in the widget body.',
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_SITE_OVERVIEW_METRICS,
} as const;

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SiteOverview',
	component: SiteOverviewRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					"The \"Site overview\" widget. Shows the selected period's headline traffic and engagement — views, visitors, likes, and comments — as metric tiles, sourced from the Jetpack Stats `summary` endpoint. Which tiles appear is controlled by the `metrics` attribute (`relevance: 'high'`), exposed inline in the widget header and in the settings drawer. This module has genuine period-over-period comparison data, so the `WithComparison` story shows a change indicator on each tile.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SiteOverviewRender > & SiteOverviewStoryControls >;

export default meta;

type Story = StoryObj< SiteOverviewStoryControls >;

/**
 * Default state — the period totals for the current preset, no comparison.
 */
export const Default: Story = {
	render: renderSiteOverview,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison params flow through `reportParams`, and the summary module returns
 * comparison-period data, so each tile shows its period-over-period change.
 */
export const WithComparison: Story = {
	render: renderSiteOverview,
	args: { withComparison: true, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderSiteOverviewOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/summary', 'loading' );
		return () => setReportMockState( 'stats/summary', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderSiteOverviewOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/summary', 'error' );
		return () => setReportMockState( 'stats/summary', null );
	},
};

/**
 * Resolved with every metric at zero: the summary endpoint returns a flat totals
 * object even for idle periods, so the widget derives its empty state ("No stats
 * recorded for this period." under the neutral globe glyph) from all-zero
 * visible metrics.
 */
export const Empty: Story = {
	render: () => renderSiteOverviewOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/summary', 'empty' );
		return () => setReportMockState( 'stats/summary', null );
	},
};

interface SiteOverviewDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SiteOverviewStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {SiteOverviewDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function SiteOverviewDashboardStory( {
	withComparison,
	metrics,
	...dashboardArgs
}: SiteOverviewDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SITE_OVERVIEW_RENDER_MODULE }
			renderComponent={ SiteOverviewRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				metrics,
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< SiteOverviewDashboardStoryProps > = {
	render: args => <SiteOverviewDashboardStory { ...args } />,
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
