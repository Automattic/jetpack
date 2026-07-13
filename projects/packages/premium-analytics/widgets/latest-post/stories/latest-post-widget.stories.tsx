/**
 * The Latest post widget reports lifetime totals, so it has no comparison
 * period: the `WithComparison` story passes comparison `reportParams` but
 * renders identically to `Default`.
 *
 * The widget reads its content locally from the core `/wp/v2/posts` endpoint and
 * its metrics (views, likes, comments) from the proxied `stats/post` endpoint,
 * both covered here by an `apiFetch` middleware that runs before the shared
 * report mocks so they resolve to real values instead of the empty-stats
 * fallback.
 */
/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	queryClient,
	type PresetType,
} from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import LatestPostRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const LATEST_POST_PATH = '/wp/v2/posts';
const STATS_POST_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/post/';

const mockLatestPostResponse = [
	{
		id: 779,
		title: { rendered: 'Ten things I learned building my first WordPress theme' },
		link: 'https://example.com/2026/06/22/ten-things-i-learned/',
		date: '2026-06-22T10:00:00',
		featured_media: 42,
		_embedded: {
			'wp:featuredmedia': [
				{
					source_url:
						"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23334155'/%3E%3Cstop offset='1' stop-color='%2394a3b8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23g)'/%3E%3C/svg%3E",
					alt_text: 'Featured image',
				},
			],
		},
	},
];

const mockPostStatsResponse = { views: 3820, like_count: 24, post: { comment_count: 8 } };

let latestPostMocksRegistered = false;

/**
 * Registers an `apiFetch` middleware that resolves the widget's two requests:
 * the local core posts endpoint (content) and the proxied `stats/post` endpoint
 * (views, likes, comments). Idempotent.
 */
function registerLatestPostMocks(): void {
	if ( latestPostMocksRegistered ) {
		return;
	}
	latestPostMocksRegistered = true;

	const middleware: APIFetchMiddleware = ( options: APIFetchOptions, next ) => {
		const path = options.path ?? options.url ?? '';

		if ( path.startsWith( STATS_POST_PATH ) ) {
			return Promise.resolve( mockPostStatsResponse );
		}

		if ( path.startsWith( LATEST_POST_PATH ) ) {
			return Promise.resolve( mockLatestPostResponse );
		}

		return next( options );
	};

	apiFetch.use( middleware );
}

registerLatestPostMocks();

const LATEST_POST_RENDER_MODULE = 'storybook/latest-post';

interface LatestPostStoryControls {
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with report params from the date range
 * picker.
 *
 * @param {LatestPostStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderLatestPost( { withComparison }: LatestPostStoryControls ) {
	return (
		<LatestPostRender attributes={ { reportParams: getDefaultQueryParams( withComparison ) } } />
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderLatestPostOnPreset( preset: PresetType ) {
	return (
		<LatestPostRender attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

/**
 * Forces the widget's requests into a loading/error/empty state for a story.
 *
 * This widget's endpoints are served by this file's own fixture middleware, so
 * the shared `setReportMockState` override never sees them; the story-side
 * `forceStatsMockState` helper re-registers its shared middleware whenever a
 * forced state is set, keeping it ahead of these fixtures. An `empty` override
 * resolves to the generic no-rows shape, which the latest-post sanitizer
 * reduces to "no published post".
 *
 * The latest-post and stats/post query keys also carry no date params, so a
 * distinct date preset alone would not give the story a fresh cache entry.
 * Evict both queries from the shared client on enter and on cleanup so each
 * forced-state story hits the mock fresh (and no forced result leaks into the
 * sibling stories).
 *
 * @param state - The forced state.
 * @return The story cleanup callback.
 */
function forceLatestPostState( state: 'loading' | 'error' | 'empty' ) {
	const setState = ( value: typeof state | null ) => {
		forceStatsMockState( LATEST_POST_PATH, value );
		forceStatsMockState( STATS_POST_PATH, value );
	};
	const evict = () => {
		queryClient.removeQueries( { queryKey: [ 'latest-post' ] } );
		queryClient.removeQueries( { queryKey: [ 'stats', 'post' ] } );
	};

	setState( state );
	evict();
	return () => {
		setState( null );
		evict();
	};
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/LatestPost',
	component: LatestPostRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Latest post" widget shows the site\'s most recently published post with its all-time views, likes, and comments. The metrics are lifetime totals, so there is no comparison period — the `WithComparison` story renders identically to `Default`.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof LatestPostRender > & LatestPostStoryControls >;

export default meta;

type Story = StoryObj< LatestPostStoryControls >;

/**
 * Default — the latest post with its lifetime views, likes, and comments.
 */
export const Default: Story = {
	render: renderLatestPost,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * WithComparison — comparison `reportParams` are supplied by the date range
 * picker, but this module has no comparison data, so the widget renders
 * identically to `Default` (no deltas).
 */
export const WithComparison: Story = {
	render: renderLatestPost,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderLatestPostOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceLatestPostState( 'loading' ),
};

/**
 * The content fetch failed: the widget shows its error state with a Retry
 * action (which re-runs the query — still mocked as failing while this story is
 * active).
 */
export const Error: Story = {
	render: () => renderLatestPostOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceLatestPostState( 'error' ),
};

/**
 * Resolved with no published posts: the widget shows its empty state (the
 * neutral post-list glyph and "Publish a post to see its stats here.").
 */
export const Empty: Story = {
	render: () => renderLatestPostOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceLatestPostState( 'empty' ),
};

interface LatestPostDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		LatestPostStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {LatestPostDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function LatestPostDashboardStory( {
	withComparison,
	...dashboardArgs
}: LatestPostDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ LATEST_POST_RENDER_MODULE }
			renderComponent={ LatestPostRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< LatestPostDashboardStoryProps > = {
	render: args => <LatestPostDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		// Latest post is a landscape widget: content left, featured image right.
		widgetWidth: 2,
		widgetHeight: 2,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
