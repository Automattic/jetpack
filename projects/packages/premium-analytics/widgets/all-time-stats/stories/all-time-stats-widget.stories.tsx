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
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import AllTimeStatsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const ALL_TIME_STATS_RENDER_MODULE = 'storybook/all-time-stats';

interface AllTimeStatsStoryControls {
	/**
	 * Whether to include comparison report params.
	 */
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with report params derived from the
 * date-range picker preset.
 *
 * @param {AllTimeStatsStoryControls} props - The story controls.
 * @return The rendered widget.
 */
function renderAllTimeStats( { withComparison }: AllTimeStatsStoryControls ) {
	return (
		<AllTimeStatsRender attributes={ { reportParams: getDefaultQueryParams( withComparison ) } } />
	);
}

// Close-up canvas so the stat list fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', maxWidth: '480px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AllTimeStats',
	component: AllTimeStatsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "All-time stats" widget. Shows lifetime totals for the site — views, visitors, posts, and comments — as a labelled list of icon rows, sourced from the Jetpack Stats site-summary endpoint. This module has no comparison period, so the values render as bare numbers and the `WithComparison` story looks identical to `Default`.',
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
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison params flow through `reportParams`, but the site summary has no
 * comparison data, so the widget renders identically to `Default` — no fake
 * deltas.
 */
export const WithComparison: Story = {
	render: renderAllTimeStats,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
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
	...dashboardArgs
}: AllTimeStatsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ {
				name: widgetDefinition.name,
				title: widgetDefinition.title,
				icon: widgetDefinition.icon,
				presentation: 'framed',
			} }
			renderModule={ ALL_TIME_STATS_RENDER_MODULE }
			renderComponent={ AllTimeStatsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< AllTimeStatsDashboardStoryProps > = {
	render: args => <AllTimeStatsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
