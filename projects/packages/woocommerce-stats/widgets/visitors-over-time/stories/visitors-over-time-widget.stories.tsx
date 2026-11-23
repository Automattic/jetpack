import {
	createStoryWidgetType,
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	forceWooReportState,
	registerWooReportMocks,
	storyReportParams,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	withWidgetCanvas,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/shared';
import VisitorsOverTimeRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const VISITORS_OVER_TIME_RENDER_MODULE = 'storybook/visitors-over-time';
const VISITORS_REPORT_PATH = 'analytics/reports/sessions/by-date';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface VisitorsOverTimeStoryControls {
	withComparison: boolean;
	chartType: 'line' | 'bar';
}

interface VisitorsOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, VisitorsOverTimeStoryControls {}

const storyControlArgTypes = {
	withComparison: {
		control: 'boolean',
		description: 'Include previous-period comparison report params.',
	},
	chartType: {
		control: 'inline-radio',
		options: [ 'line', 'bar' ],
		description: 'How the series is drawn.',
	},
} as const;

/**
 * Renders the widget close-up with the story controls as its attributes.
 *
 * @param controls                - The story controls.
 * @param controls.withComparison - Whether the report params carry a comparison window.
 * @param controls.chartType      - How the series is drawn.
 * @return The widget.
 */
function renderVisitorsOverTimeWidget( {
	withComparison,
	chartType,
}: VisitorsOverTimeStoryControls ) {
	return (
		<VisitorsOverTimeRender
			attributes={ { reportParams: storyReportParams( { withComparison } ), chartType } }
		/>
	);
}

/**
 * Mounts the real widget dashboard around the widget, with the story controls as its attributes.
 *
 * @param props                - The dashboard controls plus the story controls.
 * @param props.withComparison - Whether the report params carry a comparison window.
 * @param props.chartType      - How the series is drawn.
 * @return The dashboard.
 */
function VisitorsOverTimeDashboardStory( {
	withComparison,
	chartType,
	...dashboardArgs
}: VisitorsOverTimeDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ VISITORS_OVER_TIME_RENDER_MODULE }
			renderComponent={ VisitorsOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: storyReportParams( { withComparison } ), chartType } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/VisitorsOverTime',
	component: VisitorsOverTimeRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Store visitors over time" widget. Track how many people visit your store over time, with an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof VisitorsOverTimeRender > & VisitorsOverTimeStoryControls >;

export default meta;

type Story = StoryObj< VisitorsOverTimeStoryControls >;
type DashboardStory = StoryObj< VisitorsOverTimeDashboardStoryProps >;

export const Default: Story = {
	render: renderVisitorsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderVisitorsOverTimeWidget,
	args: { withComparison: true, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: renderVisitorsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( VISITORS_REPORT_PATH, 'loading' ),
};

export const Empty: Story = {
	render: renderVisitorsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( VISITORS_REPORT_PATH, 'empty' ),
};

export const ErrorState: Story = {
	render: renderVisitorsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( VISITORS_REPORT_PATH, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderVisitorsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( VISITORS_REPORT_PATH, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <VisitorsOverTimeDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		chartType: 'line',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...storyControlArgTypes,
	},
};
