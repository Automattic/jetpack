/**
 * The Post highlights widget reports the scoped post's lifetime totals, so it
 * has no comparison period. The post scope arrives through
 * `reportParams.post_id` (seeded from the detail page URL in product); the
 * `hasPostScope` control toggles it to exercise the scopeless empty state a
 * user sees when adding the widget outside a post detail page.
 *
 * Metrics come from the proxied `stats/post/{id}` endpoint, covered here by an
 * `apiFetch` middleware that runs before the shared report mocks.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
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
import PostDetailHighlightsRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const STATS_POST_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/post/';
const MOCK_POST_ID = 779;

const mockPostStatsResponse = {
	views: 3820,
	like_count: 24,
	post: { ID: MOCK_POST_ID, post_title: 'Ten things I learned', comment_count: 8 },
};

let postStatsMocksRegistered = false;

/**
 * Registers an `apiFetch` middleware resolving the proxied `stats/post`
 * request with fixture totals. Idempotent.
 */
function registerPostStatsMocks(): void {
	if ( postStatsMocksRegistered ) {
		return;
	}
	postStatsMocksRegistered = true;

	const middleware: APIFetchMiddleware = ( options: APIFetchOptions, next ) => {
		const path = options.path ?? options.url ?? '';

		if ( path.startsWith( STATS_POST_PATH ) ) {
			return Promise.resolve( mockPostStatsResponse );
		}

		return next( options );
	};

	apiFetch.use( middleware );
}

registerPostStatsMocks();

const POST_DETAIL_HIGHLIGHTS_RENDER_MODULE = 'storybook/post-detail-highlights';

interface PostDetailHighlightsStoryControls {
	hasPostScope: boolean;
}

/**
 * Builds the widget attributes: default report params, plus the post scope
 * the detail page seeds from its URL when `hasPostScope` is on.
 *
 * @param {PostDetailHighlightsStoryControls} controls - The story controls.
 * @return The widget attributes.
 */
function getPostDetailHighlightsAttributes( {
	hasPostScope,
}: PostDetailHighlightsStoryControls ): ComponentProps<
	typeof PostDetailHighlightsRender
>[ 'attributes' ] {
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
 * @param {PostDetailHighlightsStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderPostDetailHighlights( controls: PostDetailHighlightsStoryControls ) {
	return (
		<PostDetailHighlightsRender attributes={ getPostDetailHighlightsAttributes( controls ) } />
	);
}

// Close-up canvas so the card fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostDetailHighlights',
	component: PostDetailHighlightsRender,
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
					'The "Post highlights" widget shows the scoped post\'s all-time views, likes, and comments as metric tiles. The post scope comes from the detail page\'s `reportParams.post_id`; without it (e.g. added to the main dashboard) the widget renders a scopeless empty state. Lifetime totals — no comparison period.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof PostDetailHighlightsRender > & PostDetailHighlightsStoryControls
>;

export default meta;

type Story = StoryObj< PostDetailHighlightsStoryControls >;

/**
 * Default — a scoped post's lifetime views, likes, and comments.
 */
export const Default: Story = {
	render: renderPostDetailHighlights,
	args: { hasPostScope: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoPostScope — the widget without a `post_id` report param, as when added
 * outside a post detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoPostScope: Story = {
	render: renderPostDetailHighlights,
	args: { hasPostScope: false },
	decorators: [ withWidgetCanvas ],
};

interface PostDetailHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostDetailHighlightsStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {PostDetailHighlightsDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function PostDetailHighlightsDashboardStory( {
	hasPostScope,
	...dashboardArgs
}: PostDetailHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ POST_DETAIL_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={
				PostDetailHighlightsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getPostDetailHighlightsAttributes( { hasPostScope } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< PostDetailHighlightsDashboardStoryProps > = {
	render: args => <PostDetailHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
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
