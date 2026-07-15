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
import { withStoryRouter } from '../../stories/with-story-router';
import TopPostsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const TOP_POSTS_RENDER_MODULE = 'storybook/top-posts';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	// Attribute metadata drives the host-rendered chrome: the high-relevance
	// `contentView` control in the framed header and the settings fields.
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
	presentation: 'framed' as const,
};

interface TopPostsStoryControls {
	withComparison: boolean;
	contentView: 'posts' | 'archives';
}

interface TopPostsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TopPostsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '340px' } }>
		<Story />
	</div>
);

function renderTopPostsWidget( { withComparison, contentView }: TopPostsStoryControls ) {
	return (
		<TopPostsRender
			attributes={ {
				num: 10,
				contentView,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

function TopPostsDashboardStory( {
	withComparison,
	contentView,
	...dashboardArgs
}: TopPostsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TOP_POSTS_RENDER_MODULE }
			renderComponent={ TopPostsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				num: 10,
				contentView,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
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
		contentView: {
			control: 'inline-radio',
			options: [ 'posts', 'archives' ],
			description:
				'Which report the widget shows: posts & pages, or aggregate archive-page views. Rendered as an inline control in the widget frame header by the host.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Most viewed" widget. Shows the most-viewed posts and pages as a ranked leaderboard, using the global dashboard date range; each row links to the published content, and the homepage-as-latest-posts views from the archives report are folded into the list. The `contentView` attribute switches to aggregate archive-page views (taxonomy, post-type, search, and date archives).',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TopPostsRender > & TopPostsStoryControls >;

export default meta;

type Story = StoryObj< TopPostsStoryControls >;
type DashboardStory = StoryObj< TopPostsDashboardStoryProps >;

export const Default: Story = {
	render: renderTopPostsWidget,
	args: { withComparison: false, contentView: 'posts' },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const WithComparison: Story = {
	render: renderTopPostsWidget,
	args: { withComparison: true, contentView: 'posts' },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const Archives: Story = {
	render: renderTopPostsWidget,
	args: { withComparison: true, contentView: 'archives' },
	decorators: [ withWidgetCanvas, withStoryRouter ],
	parameters: {
		docs: {
			description: {
				story:
					'The Archives view: one aggregate row per archive type (taxonomy, post-type, and search archives), with comparison deltas when the previous period overlaps. Grouped rows drill down into their individual archive pages (taxonomies drill twice: taxonomy → terms) with a back link, following the Locations/Clicks drill-down convention. The homepage entry is surfaced in the Posts & pages view instead, matching the Stats card.',
			},
		},
	},
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TopPostsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		contentView: 'posts',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
};
