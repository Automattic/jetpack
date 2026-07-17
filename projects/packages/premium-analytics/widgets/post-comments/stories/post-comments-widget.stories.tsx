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
import PostCommentsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MOCK_POST_ID = 779;
const POST_COMMENTS_RENDER_MODULE = 'storybook/post-comments';

interface PostCommentsStoryControls {
	hasPostScope: boolean;
}

function getPostCommentsAttributes( {
	hasPostScope,
}: PostCommentsStoryControls ): ComponentProps< typeof PostCommentsRender >[ 'attributes' ] {
	return {
		reportParams: {
			...getDefaultQueryParams( false ),
			...( hasPostScope ? { post_id: MOCK_POST_ID } : {} ),
		},
	};
}

function renderPostComments( controls: PostCommentsStoryControls ) {
	return <PostCommentsRender attributes={ getPostCommentsAttributes( controls ) } />;
}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '360px', height: '480px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostComments',
	component: PostCommentsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		hasPostScope: {
			control: 'boolean',
			description: "Include the post detail page's `post_id` report parameter.",
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Latest comments" widget: recent commenters on the scoped post, with an avatar, relative time, comment link, and "N more" footer.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PostCommentsRender > & PostCommentsStoryControls >;

export default meta;

type Story = StoryObj< PostCommentsStoryControls >;

export const Default: Story = {
	render: renderPostComments,
	args: { hasPostScope: true },
	decorators: [ withWidgetCanvas ],
};

export const NoPostScope: Story = {
	render: renderPostComments,
	args: { hasPostScope: false },
	decorators: [ withWidgetCanvas ],
};

interface PostCommentsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostCommentsStoryControls {}

function PostCommentsDashboardStory( {
	hasPostScope,
	...dashboardArgs
}: PostCommentsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ POST_COMMENTS_RENDER_MODULE }
			renderComponent={ PostCommentsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getPostCommentsAttributes( { hasPostScope } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< PostCommentsDashboardStoryProps > = {
	render: args => <PostCommentsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 1,
		widgetHeight: 2,
		hasPostScope: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		hasPostScope: {
			control: 'boolean',
			description: "Include the post detail page's `post_id` report parameter.",
		},
	},
};
