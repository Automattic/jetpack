import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import UtmInsightsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerStatsMocks();

const UTM_INSIGHTS_RENDER_MODULE = 'storybook/utm-insights';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
};

// Close-up canvas so the leaderboard fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/UtmInsights',
	component: UtmInsightsRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "UTM Insights" widget. Shows traffic breakdown by UTM parameter as a ranked leaderboard. The active dimension (Source/Medium, Campaign, etc.) is switched via a dropdown in the widget header and persisted per widget instance. No period-over-period comparison is available for UTM data.',
			},
		},
	},
} satisfies Meta< Record< string, never > >;

export default meta;

// Default close-up — Source / Medium breakdown.
export const Default: StoryObj = {
	render: () => <UtmInsightsRender attributes={ { utmParam: 'utm_source,utm_medium', max: 10 } } />,
	decorators: [ withWidgetCanvas ],
};

// Alternative close-up showing the Campaign dimension.
export const ByCampaign: StoryObj = {
	render: () => <UtmInsightsRender attributes={ { utmParam: 'utm_campaign', max: 10 } } />,
	decorators: [ withWidgetCanvas ],
};

// Full dashboard story — mounts the real WidgetDashboard so the widget renders
// exactly as it does in product (size / edit-mode / host-environment controls).
function UtmInsightsDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ UTM_INSIGHTS_RENDER_MODULE }
			renderComponent={ UtmInsightsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				utmParam: 'utm_source,utm_medium',
				max: 10,
				reportParams: getDefaultQueryParams( false ),
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <UtmInsightsDashboardStory { ...args } />,
	args: DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	argTypes: widgetDashboardWithWidgetArgTypes,
};
