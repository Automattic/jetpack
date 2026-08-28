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
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SubscribersChartRender from '../render';
import widgetDefinition, { type SubscribersChartType } from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SUBSCRIBERS_CHART_RENDER_MODULE = 'storybook/subscribers-chart';

// Carry the widget's metadata, including the attribute schema so the dashboard
// story's settings drawer renders the real controls.
const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

interface SubscribersChartStoryControls {
	withComparison: boolean;
	chartType: SubscribersChartType;
}

const CHART_TYPE_ARG_TYPES = {
	chartType: {
		control: 'inline-radio',
		options: [ 'line', 'bar' ] satisfies SubscribersChartType[],
	},
} as const;

const DEFAULT_CHART_ARGS = { chartType: 'line' } as const;

function renderSubscribersChart( { withComparison, chartType }: SubscribersChartStoryControls ) {
	return (
		<SubscribersChartRender
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				chartType,
			} }
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
		...CHART_TYPE_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					"Subscriber growth over time. The date range, previous-period comparison, and bucket size follow the dashboard controls; the \"Chart type\" control is the `chartType` attribute (`relevance: 'high'`), exposed by the widget host; which metric is plotted is the chart's own tab selection. When comparison is on, the previous period is overlaid as a same-colour dashed line and the headline shows the period-over-period delta. The Paid subscribers tab renders only when the site has paid subscribers. Data comes from `useStatsSubscribersReport`; in Storybook it is served by `registerReportMocks`.",
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
	args: { withComparison: false, ...DEFAULT_CHART_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with the dashboard comparison range applied, so the previous
 * period is overlaid as a dashed line and the headline shows the delta.
 */
export const WithComparison: Story = {
	render: renderSubscribersChart,
	args: { withComparison: true, ...DEFAULT_CHART_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * The same widget drawn as bars — the `chartType` attribute set to `bar`.
 */
export const BarChart: Story = {
	render: renderSubscribersChart,
	args: { withComparison: false, chartType: 'bar' },
	decorators: [ withWidgetCanvas ],
};

/**
 * Bars with comparison on: the previous period renders as the translucent
 * shadow bar behind each current-period bar, and its value joins the tooltip.
 */
export const BarChartWithComparison: Story = {
	render: renderSubscribersChart,
	args: { withComparison: true, chartType: 'bar' },
	decorators: [ withWidgetCanvas ],
};

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
	chartType,
	...dashboardArgs
}: SubscribersChartDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SUBSCRIBERS_CHART_RENDER_MODULE }
			renderComponent={ SubscribersChartRender as ComponentType< WidgetRenderProps< unknown > > }
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
export const WidgetDashboardWithWidget: StoryObj< SubscribersChartDashboardStoryProps > = {
	render: args => <SubscribersChartDashboardStory { ...args } />,
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
