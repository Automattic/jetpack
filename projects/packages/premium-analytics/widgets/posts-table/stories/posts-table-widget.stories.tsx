/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withStoryRouter } from '../../stories/with-story-router';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PostsTableRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const POSTS_TABLE_RENDER_MODULE = 'storybook/posts-table';

interface PostsTableStoryControls {
	withComparison: boolean;
}

interface PostsTableDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, PostsTableStoryControls {}

function renderPostsTableWidget( { withComparison }: PostsTableStoryControls ) {
	return (
		<PostsTableRender attributes={ { reportParams: getDefaultQueryParams( withComparison ) } } />
	);
}

function PostsTableDashboardStory( {
	withComparison,
	...dashboardArgs
}: PostsTableDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest ) }
			renderModule={ POSTS_TABLE_RENDER_MODULE }
			renderComponent={ PostsTableRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostsTable',
	component: PostsTableRender,
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
					'The table of the All pages report: every post and page of the period with its views, searchable, sortable and paginated inside the tile. Each title opens the post’s own report.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PostsTableRender > & PostsTableStoryControls >;

export default meta;

type Story = StoryObj< PostsTableStoryControls >;
type DashboardStory = StoryObj< PostsTableDashboardStoryProps >;

export const Default: Story = {
	render: renderPostsTableWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const WithComparison: Story = {
	render: renderPostsTableWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <PostsTableDashboardStory { ...args } />,
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
