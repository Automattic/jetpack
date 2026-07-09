/**
 * The three stories render the data-connected widget fed by the shared
 * report-mock harness. `registerReportMocks` routes the `stats/` site summary
 * (`/proxy/v1.1/stats`) — including the `views_best_day*` fields this widget
 * reads — through `routeStatsReport()`, so no story-scoped middleware is
 * needed. The all-time "most popular day" highlight has no comparison period
 * and ignores the dashboard date range, so `WithComparison` renders identically
 * to `Default`.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import MostPopularDayRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MOST_POPULAR_DAY_RENDER_MODULE = 'storybook/most-popular-day';

interface MostPopularDayStoryControls {
	withComparison: boolean;
}

/**
 * Renders the data-connected widget for the close-up stories.
 *
 * @param {MostPopularDayStoryControls} props - The story controls.
 * @return The rendered widget.
 */
function renderMostPopularDay( { withComparison }: MostPopularDayStoryControls ) {
	return (
		<MostPopularDayRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the highlight fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/MostPopularDay',
	component: MostPopularDayRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Most popular day" widget ports the Jetpack Stats all-time highlight: the single day your site drew the most views, with that day\'s view count and its share of all views. The value comes from a site-wide summary that has no comparison period and does not depend on the dashboard date range, so `WithComparison` renders identically to `Default`.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof MostPopularDayRender > & MostPopularDayStoryControls >;

export default meta;

type Story = StoryObj< MostPopularDayStoryControls >;

/**
 * Default state — the best day for views and its share of all views.
 */
export const Default: Story = {
	render: renderMostPopularDay,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison params from the date-range picker are passed through, but the
 * highlight has no comparison data, so the widget renders the same single value.
 */
export const WithComparison: Story = {
	render: renderMostPopularDay,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface MostPopularDayDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		MostPopularDayStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {MostPopularDayDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function MostPopularDayDashboardStory( {
	withComparison,
	...dashboardArgs
}: MostPopularDayDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ MOST_POPULAR_DAY_RENDER_MODULE }
			renderComponent={ MostPopularDayRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< MostPopularDayDashboardStoryProps > = {
	render: args => <MostPopularDayDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
