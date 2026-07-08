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
import SiteOverviewRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
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
	 * Whether the Views tile is shown.
	 */
	showViews: boolean;
	/**
	 * Whether the Visitors tile is shown.
	 */
	showVisitors: boolean;
	/**
	 * Whether the Likes tile is shown.
	 */
	showLikes: boolean;
	/**
	 * Whether the Comments tile is shown.
	 */
	showComments: boolean;
}

/**
 * Renders the data-connected widget with report params derived from the
 * date-range picker preset and the per-metric visibility toggles.
 *
 * @param {SiteOverviewStoryControls} props - The story controls.
 * @return The rendered widget.
 */
function renderSiteOverview( {
	withComparison,
	showViews,
	showVisitors,
	showLikes,
	showComments,
}: SiteOverviewStoryControls ) {
	return (
		<SiteOverviewRender
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				showViews,
				showVisitors,
				showLikes,
				showComments,
			} }
		/>
	);
}

const METRIC_ARG_TYPES = {
	showViews: { control: 'boolean' },
	showVisitors: { control: 'boolean' },
	showLikes: { control: 'boolean' },
	showComments: { control: 'boolean' },
} as const;

const ALL_METRICS_ARGS = {
	showViews: true,
	showVisitors: true,
	showLikes: true,
	showComments: true,
} as const;

// Close-up canvas so the metric grid fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', maxWidth: '560px' } }>
		<Story />
	</div>
);

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
					'The "Site overview" widget. Shows the selected period\'s headline traffic and engagement — views, visitors, likes, and comments — as metric tiles, sourced from the Jetpack Stats `summary` endpoint. Each metric tile can be toggled off via the widget\'s checkbox settings (the `show*` controls here). This module has genuine period-over-period comparison data, so the `WithComparison` story shows a change indicator on each tile.',
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
	showViews,
	showVisitors,
	showLikes,
	showComments,
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
				showViews,
				showVisitors,
				showLikes,
				showComments,
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
