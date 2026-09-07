/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PostCommentsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MOCK_POST_ID = 779;
const POST_COMMENTS_RENDER_MODULE = 'storybook/post-comments';

const COMMENTS_REQUEST_PATH = `posts/${ MOCK_POST_ID }/replies`;

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

/**
 * Loading — the first fetch is still in flight, so the widget shows its
 * skeleton roster. The mock is forced to never resolve for this story.
 */
export const Loading: Story = {
	render: renderPostComments,
	args: { hasPostScope: true },
	// Off the shared autodocs page — path-keyed override; see setReportMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( COMMENTS_REQUEST_PATH, 'loading' );
		return () => setReportMockState( COMMENTS_REQUEST_PATH, null );
	},
};

/**
 * Error — the fetch failed with a 403: the widget shows its error copy and a
 * Retry action, which re-runs the query (still mocked as failing here).
 */
export const Error: Story = {
	render: renderPostComments,
	args: { hasPostScope: true },
	// Off the shared autodocs page — path-keyed override; see setReportMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( COMMENTS_REQUEST_PATH, 'error' );
		return () => setReportMockState( COMMENTS_REQUEST_PATH, null );
	},
};

/**
 * Empty — a scoped post that resolved with no comments: "There are no comments
 * yet." This is the scoped empty state, distinct from the scopeless copy in
 * NoPostScope.
 */
export const Empty: Story = {
	render: renderPostComments,
	args: { hasPostScope: true },
	// Off the shared autodocs page — path-keyed override; see setReportMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( COMMENTS_REQUEST_PATH, 'empty' );
		return () => setReportMockState( COMMENTS_REQUEST_PATH, null );
	},
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
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
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
