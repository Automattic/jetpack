/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import TopPostsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const TOP_POSTS_RENDER_MODULE = 'storybook/top-posts';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface TopPostsStoryControls {
	withComparison: boolean;
}

interface TopPostsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TopPostsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '340px' } }>
		<Story />
	</div>
);

function renderTopPostsWidget( { withComparison }: TopPostsStoryControls ) {
	return (
		<TopPostsRender
			attributes={ { num: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

function TopPostsDashboardStory( {
	withComparison,
	...dashboardArgs
}: TopPostsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TOP_POSTS_RENDER_MODULE }
			renderComponent={ TopPostsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { num: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TopPosts',
	component: TopPostsRender,
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
					'The "Top posts & pages" widget. Shows the most-viewed posts and pages as a ranked leaderboard, using the global dashboard date range. Each row links to the published content.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TopPostsRender > & TopPostsStoryControls >;

export default meta;

type Story = StoryObj< TopPostsStoryControls >;
type DashboardStory = StoryObj< TopPostsDashboardStoryProps >;

export const Default: Story = {
	render: renderTopPostsWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderTopPostsWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TopPostsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
};
