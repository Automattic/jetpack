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
	siteTimeZoneArgTypes,
	withSiteTimeZone,
	type SiteTimeZoneControls,
} from '../../stories/with-site-time-zone';
import {
	paidSubscribersArgTypes,
	withPaidSubscribers,
	type PaidSubscribersControls,
} from '../../stories/with-paid-subscribers';
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

interface SubscribersChartStoryControls extends SiteTimeZoneControls, PaidSubscribersControls {
	chartType: SubscribersChartType;
}

const CHART_TYPE_ARG_TYPES = {
	chartType: {
		control: 'inline-radio',
		options: [ 'line', 'bar' ] satisfies SubscribersChartType[],
	},
} as const;

const DEFAULT_CHART_ARGS = { chartType: 'line' } as const;

function renderSubscribersChart( { chartType }: SubscribersChartStoryControls ) {
	return (
		<SubscribersChartRender
			attributes={ { reportParams: getDefaultQueryParams( false ), chartType } }
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
	decorators: [ withSiteTimeZone ],
	beforeEach: withPaidSubscribers,
	argTypes: {
		...siteTimeZoneArgTypes,
		...paidSubscribersArgTypes,
		...CHART_TYPE_ARG_TYPES,
	},
	args: {
		hasPaidSubscribers: false,
	},
	parameters: {
		docs: {
			description: {
				component:
					"Subscriber growth over time. The widget hosts its own date range control in its header, saved onto the widget instance; the bucket size follows the selected window, and subscriber counts are cumulative so there is no previous-period comparison. The \"Chart type\" control is the `chartType` attribute (`relevance: 'high'`), exposed by the widget host; which metric is plotted is the chart's own tab selection. The Paid subscribers tab renders only when the site has paid subscribers. Data comes from `useStatsSubscribersReport`; in Storybook it is served by `registerReportMocks`.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SubscribersChartRender > & SubscribersChartStoryControls >;

export default meta;

type Story = StoryObj< SubscribersChartStoryControls >;

/**
 * The widget on its own, on the range its header control defaults to. Turn on
 * "Has paid subscribers" to add the Paid subscribers metric beside Subscribers.
 */
export const Default: Story = {
	render: renderSubscribersChart,
	args: { ...DEFAULT_CHART_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * The same widget drawn as bars — the `chartType` attribute set to `bar`.
 */
export const BarChart: Story = {
	render: renderSubscribersChart,
	args: { chartType: 'bar' },
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
	extends WidgetDashboardWithWidgetControls, SubscribersChartStoryControls {}

function SubscribersChartDashboardStory( {
	chartType,
	...dashboardArgs
}: SubscribersChartDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SUBSCRIBERS_CHART_RENDER_MODULE }
			renderComponent={ SubscribersChartRender as ComponentType< WidgetRenderProps< unknown > > }
			// The real header control edits this attribute; the harness renders the
			// widget's declared header, so the story starts it where the app does.
			attributes={ {
				reportParams: getDefaultQueryParams( false ),
				chartType,
			} }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness,
 * including the date control the widget declares in its own header.
 *
 * Full width, as the Subscribers default layout places it: narrower than that and
 * the host collapses the header controls behind the settings icon.
 */
export const WidgetDashboardWithWidget: StoryObj< SubscribersChartDashboardStoryProps > = {
	render: args => <SubscribersChartDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 3,
		...DEFAULT_CHART_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...paidSubscribersArgTypes,
		...CHART_TYPE_ARG_TYPES,
	},
};
