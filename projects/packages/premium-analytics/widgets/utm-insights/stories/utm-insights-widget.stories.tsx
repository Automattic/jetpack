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
import type { ComponentProps, ComponentType } from 'react';

registerStatsMocks();

const UTM_INSIGHTS_RENDER_MODULE = 'storybook/utm-insights';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface UtmInsightsStoryControls {
	withComparison: boolean;
}

interface UtmInsightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		UtmInsightsStoryControls {}

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
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "UTM Insights" widget. Shows traffic breakdown by UTM parameter as a ranked leaderboard. The active dimension (Source/Medium, Campaign, etc.) is switched via a dropdown in the widget header and persisted per widget instance.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof UtmInsightsRender > & UtmInsightsStoryControls >;

export default meta;

type Story = StoryObj< UtmInsightsStoryControls >;
type DashboardStory = StoryObj< UtmInsightsDashboardStoryProps >;

// Default close-up — Source / Medium breakdown.
export const Default: Story = {
	render: ( { withComparison } ) => (
		<UtmInsightsRender
			attributes={ {
				utmDimension: 'utm_source,utm_medium',
				max: 10,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	),
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: ( { withComparison } ) => (
		<UtmInsightsRender
			attributes={ {
				utmDimension: 'utm_source,utm_medium',
				max: 10,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	),
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

// Alternative close-up showing the Campaign dimension.
export const ByCampaign: Story = {
	render: ( { withComparison } ) => (
		<UtmInsightsRender
			attributes={ {
				utmDimension: 'utm_campaign',
				max: 10,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	),
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

// Full dashboard story — mounts the real WidgetDashboard so the widget renders
// exactly as it does in product (size / edit-mode / host-environment controls).
function UtmInsightsDashboardStory( {
	withComparison,
	...dashboardArgs
}: UtmInsightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ UTM_INSIGHTS_RENDER_MODULE }
			renderComponent={ UtmInsightsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				utmDimension: 'utm_source,utm_medium',
				max: 10,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <UtmInsightsDashboardStory { ...args } />,
	args: { ...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS, withComparison: false },
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
};
