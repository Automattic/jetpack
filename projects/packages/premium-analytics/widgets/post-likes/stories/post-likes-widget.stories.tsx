/**
 * The Latest likes widget is the post detail Traffic view's likes card: the
 * scoped post's likers as an avatar roster with an "N more" footer. The post
 * scope arrives through `reportParams.post_id` (seeded from the detail page
 * URL in product); the `hasPostScope` control toggles it to exercise the
 * scopeless empty state. Rows carry the like's relative time (`date_liked`);
 * the list is a lifetime roster and ignores the dashboard date range.
 *
 * Data comes from the proxied `posts/{id}/likes` endpoint, covered by the
 * shared report mocks' `post-likes` fixture.
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
import PostLikesRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// Any post ID resolves to the shared `post-likes` fixture; this one matches
// the `stats-post` fixture's own post row for coherence.
const MOCK_POST_ID = 779;

const POST_LIKES_RENDER_MODULE = 'storybook/post-likes';

interface PostLikesStoryControls {
	hasPostScope: boolean;
}

/**
 * Builds the widget attributes: report params with the post scope the detail
 * page seeds from its URL when `hasPostScope` is on.
 *
 * @param {PostLikesStoryControls} controls - The story controls.
 * @return The widget attributes.
 */
function getPostLikesAttributes( {
	hasPostScope,
}: PostLikesStoryControls ): ComponentProps< typeof PostLikesRender >[ 'attributes' ] {
	return {
		reportParams: {
			...getDefaultQueryParams( false ),
			...( hasPostScope ? { post_id: MOCK_POST_ID } : {} ),
		},
	};
}

/**
 * Renders the data-connected widget with the composed attributes.
 *
 * @param {PostLikesStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderPostLikes( controls: PostLikesStoryControls ) {
	return <PostLikesRender attributes={ getPostLikesAttributes( controls ) } />;
}

// Close-up canvas sized to the roster outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '360px', height: '480px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostLikes',
	component: PostLikesRender,
	tags: [ 'autodocs' ],
	argTypes: {
		hasPostScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Latest likes" widget: the scoped post\'s likers as an avatar roster with an "N more" footer — the post detail Traffic view\'s likes card. Each row carries the like\'s relative time. Without a post scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PostLikesRender > & PostLikesStoryControls >;

export default meta;

type Story = StoryObj< PostLikesStoryControls >;

/**
 * Default — the scoped post's likers with the "N more" footer.
 */
export const Default: Story = {
	render: renderPostLikes,
	args: { hasPostScope: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoPostScope — the widget without a `post_id` report param, as when added
 * outside a post detail page. Renders the scopeless empty state without
 * firing a request.
 */
export const NoPostScope: Story = {
	render: renderPostLikes,
	args: { hasPostScope: false },
	decorators: [ withWidgetCanvas ],
};

interface PostLikesDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostLikesStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, sizing, host environment).
 *
 * @param {PostLikesDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function PostLikesDashboardStory( {
	hasPostScope,
	...dashboardArgs
}: PostLikesDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ POST_LIKES_RENDER_MODULE }
			renderComponent={ PostLikesRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getPostLikesAttributes( { hasPostScope } ) }
		/>
	);
}

/**
 * Mirrors the production placement (1 column × 2 rows). The fixture's ten
 * rows exceed that tile height, so this story also demonstrates the roster
 * scrolling inside the widget frame's content viewport.
 */
export const WidgetDashboardWithWidget: StoryObj< PostLikesDashboardStoryProps > = {
	render: args => <PostLikesDashboardStory { ...args } />,
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
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
	},
};
