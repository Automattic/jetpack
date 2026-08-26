/**
 * Internal dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import TrafficChartRender from '../render';
import widgetDefinition, { type TrafficChartType } from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TRAFFIC_CHART_RENDER_MODULE = 'storybook/traffic-chart';

// Carry the widget's metadata, including the attribute schema so the dashboard
// story's settings drawer renders the real controls.
const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

interface TrafficChartStoryControls {
	withComparison: boolean;
	chartType: TrafficChartType;
}

const CHART_TYPE_ARG_TYPES = {
	chartType: {
		control: 'inline-radio',
		options: [ 'line', 'bar' ] satisfies TrafficChartType[],
	},
} as const;

const DEFAULT_CHART_ARGS = { chartType: 'line' } as const;

function renderTrafficChart( { withComparison, chartType }: TrafficChartStoryControls ) {
	return (
		<TrafficChartRender
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				chartType,
			} }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderTrafficChartOnPreset( preset: PresetType ) {
	return (
		<TrafficChartRender attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TrafficChart',
	component: TrafficChartRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		...CHART_TYPE_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					"Traffic over the selected period as selectable metric tabs — Views, Visitors, Likes, and Comments — over a comparative chart. The date range, comparison, and bucket size come from the dashboard controls: the bucket is whatever the page's interval control resolves to, clamped to one the chart can draw. \"Chart type\" is the `chartType` attribute (`relevance: 'high'`, so the host renders it in the widget header). Which metric is plotted is the chart's own tab selection. When comparison is on, each tab shows its period-over-period delta and the previous period is overlaid — as a same-colour dashed line for `line`, or as the translucent shadow bar behind each bar for `bar`. Views/visitors and likes/comments are fetched as two parallel requests (mirroring Calypso) to keep latency down; the likes and comments request is skipped at the hourly grain, which cannot fill either. Data comes from the `useStatsVisits` hook; in Storybook it is served by `registerReportMocks`.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TrafficChartRender > & TrafficChartStoryControls >;

export default meta;

type Story = StoryObj< TrafficChartStoryControls >;

/**
 * The widget on its own, current period only.
 */
export const Default: Story = {
	render: renderTrafficChart,
	args: { withComparison: false, ...DEFAULT_CHART_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with the period-over-period delta and previous-period overlay.
 */
export const WithComparison: Story = {
	render: renderTrafficChart,
	args: { withComparison: true, ...DEFAULT_CHART_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * The same widget drawn as bars — the `chartType` attribute set to `bar`.
 */
export const BarChart: Story = {
	render: renderTrafficChart,
	args: { withComparison: false, ...DEFAULT_CHART_ARGS, chartType: 'bar' },
	decorators: [ withWidgetCanvas ],
};

/**
 * Bars with comparison on: the previous period renders as the translucent
 * shadow bar behind each current-period bar.
 */
export const BarChartWithComparison: Story = {
	render: renderTrafficChart,
	args: { withComparison: true, ...DEFAULT_CHART_ARGS, chartType: 'bar' },
	decorators: [ withWidgetCanvas ],
};

/**
 * An hourly range (`Last 24 hours`), where the page's interval control resolves
 * to `hour`. `stats/visits` fills Views alone at that grain, so the other three
 * tabs show a placeholder and, when selected, the reason — rather than a `0`
 * they cannot back up. The likes and comments request is skipped entirely.
 *
 * Mounted through the dashboard harness rather than the close-up canvas: hour
 * ticks are the point of the story, and the canvas is too narrow to draw an
 * axis at all.
 */
export const Hourly: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => (
		<WidgetDashboardWithWidgetStory
			{ ...args }
			widgetType={ storyWidgetType }
			renderModule={ TRAFFIC_CHART_RENDER_MODULE }
			renderComponent={ TrafficChartRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( false, 'last-24-hours' ) } }
		/>
	),
	args: { ...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS },
	argTypes: { ...widgetDashboardWithWidgetArgTypes },
};

export const Loading: Story = {
	render: () => renderTrafficChartOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'loading' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the queries — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderTrafficChartOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'error' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * Resolved with no points: the widget shows its empty state (the neutral
 * reports glyph and "No traffic data in this period.").
 */
export const Empty: Story = {
	render: () => renderTrafficChartOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'empty' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

interface TrafficChartDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TrafficChartStoryControls {}

function TrafficChartDashboardStory( {
	withComparison,
	chartType,
	...dashboardArgs
}: TrafficChartDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TRAFFIC_CHART_RENDER_MODULE }
			renderComponent={ TrafficChartRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				chartType,
			} }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: StoryObj< TrafficChartDashboardStoryProps > = {
	render: args => <TrafficChartDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		...DEFAULT_CHART_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
		...CHART_TYPE_ARG_TYPES,
	},
};
