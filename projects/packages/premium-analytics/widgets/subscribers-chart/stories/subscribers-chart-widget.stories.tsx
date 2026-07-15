/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SubscribersChartRender from '../render';
import widgetDefinition, {
	DEFAULT_SUBSCRIBERS_CHART_METRICS,
	type SubscribersChartMetricId,
} from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SUBSCRIBERS_CHART_RENDER_MODULE = 'storybook/subscribers-chart';

// Carry the widget's metadata, including the metric-visibility attribute schema
// so the dashboard story's settings drawer renders the real controls. The
// attribute schema is typed loosely on the widget definition, so it is cast to
// the WidgetType shape.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
};

interface SubscribersChartStoryControls {
	withComparison: boolean;
	metrics: SubscribersChartMetricId[];
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: DEFAULT_SUBSCRIBERS_CHART_METRICS,
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_SUBSCRIBERS_CHART_METRICS,
} as const;

function renderSubscribersChart( { withComparison, metrics }: SubscribersChartStoryControls ) {
	return (
		<SubscribersChartRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ), metrics } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderSubscribersChartOnPreset( preset: PresetType ) {
	return (
		<SubscribersChartRender
			attributes={ { reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SubscribersChart',
	component: SubscribersChartRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					'Subscriber growth over time. The date range and previous-period comparison follow the dashboard picker; the "Group by" control is the `granularity` attribute and the tab selection is the `metrics` attribute (both `relevance: \'high\'`), exposed by the widget host. When comparison is on, the previous period is overlaid as a same-colour dashed line and the headline shows the period-over-period delta. The Paid subscribers tab renders only when the site has paid subscribers, even while selected. Data comes from `useStatsSubscribersReport`; in Storybook it is served by `registerReportMocks`.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SubscribersChartRender > & SubscribersChartStoryControls >;

export default meta;

type Story = StoryObj< SubscribersChartStoryControls >;

/**
 * The widget on its own, current period only.
 */
export const Default: Story = {
	render: renderSubscribersChart,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with the dashboard comparison range applied, so the previous
 * period is overlaid as a dashed line and the headline shows the delta.
 */
export const WithComparison: Story = {
	render: renderSubscribersChart,
	args: { withComparison: true, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state (the
 * metric tabs over the chart's loading overlay). The mock is forced to never
 * resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderSubscribersChartOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/subscribers', 'loading' );
		return () => setReportMockState( 'stats/subscribers', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderSubscribersChartOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/subscribers', 'error' );
		return () => setReportMockState( 'stats/subscribers', null );
	},
};

/**
 * Resolved with no points: the widget shows its empty state (the neutral
 * customer glyph and "No subscriber data in this period.").
 */
export const Empty: Story = {
	render: () => renderSubscribersChartOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/subscribers', 'empty' );
		return () => setReportMockState( 'stats/subscribers', null );
	},
};

interface SubscribersChartDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SubscribersChartStoryControls {}

function SubscribersChartDashboardStory( {
	withComparison,
	metrics,
	...dashboardArgs
}: SubscribersChartDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SUBSCRIBERS_CHART_RENDER_MODULE }
			renderComponent={ SubscribersChartRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ), metrics } }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: StoryObj< SubscribersChartDashboardStoryProps > = {
	render: args => <SubscribersChartDashboardStory { ...args } />,
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
