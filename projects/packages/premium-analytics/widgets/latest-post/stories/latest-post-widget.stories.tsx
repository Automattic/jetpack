/**
 * The Latest post widget reports lifetime totals, so it has no comparison
 * period: the `WithComparison` story passes comparison `reportParams` but
 * renders identically to `Default`.
 *
 * The widget fetches the public WPCOM posts endpoint directly (plain `fetch`,
 * no proxy), so the stories seed `window.JetpackScriptData` with a blog ID (to
 * enable the query) and stub `window.fetch` for that URL. Views still come from
 * the proxied `stats/post` endpoint, covered by an `apiFetch` middleware that
 * runs before the shared report mocks so it resolves to real counts instead of
 * their empty-stats fallback.
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
import LatestPostRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const MOCK_BLOG_ID = 20115252;
const STATS_POST_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/post/';

const mockLatestPostResponse = {
	found: 12,
	posts: [
		{
			ID: 779,
			title: 'Ten things I learned building my first WordPress theme',
			URL: 'https://example.com/2026/06/22/ten-things-i-learned/',
			date: '2026-06-22T10:00:00+00:00',
			like_count: 24,
			discussion: { comment_count: 8 },
		},
	],
};

const mockPostViewsResponse = { views: 3820 };

let latestPostMocksRegistered = false;

/**
 * Reads the URL out of a `fetch` argument, which may be a string, a `URL`, or a
 * `Request`.
 *
 * @param input - The first argument passed to `fetch`.
 * @return The request URL as a string.
 */
function fetchInputToUrl( input: RequestInfo | URL ): string {
	if ( typeof input === 'string' ) {
		return input;
	}
	if ( input instanceof URL ) {
		return input.href;
	}
	return input.url;
}

/**
 * Wires up the story mocks: seeds the connection data the latest-post query
 * reads for the blog ID, stubs `window.fetch` for the public posts endpoint,
 * and registers an `apiFetch` middleware for the proxied `stats/post` views
 * request. Idempotent.
 */
function registerLatestPostMocks(): void {
	if ( latestPostMocksRegistered ) {
		return;
	}
	latestPostMocksRegistered = true;

	// Storybook has no WordPress boot, so seed the connection data getSiteData()
	// reads; without a blog ID the latest-post query stays disabled.
	( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData = {
		site: { wpcom: { blog_id: MOCK_BLOG_ID } },
		user: { current_user: {} },
	};

	const originalFetch = window.fetch.bind( window );
	window.fetch = ( input: RequestInfo | URL, init?: RequestInit ) => {
		if ( fetchInputToUrl( input ).includes( `/sites/${ MOCK_BLOG_ID }/posts/` ) ) {
			return Promise.resolve(
				new Response( JSON.stringify( mockLatestPostResponse ), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				} )
			);
		}

		return originalFetch( input, init );
	};

	const middleware: APIFetchMiddleware = ( options: APIFetchOptions, next ) => {
		const path = options.path ?? options.url ?? '';

		if ( path.startsWith( STATS_POST_PATH ) ) {
			return Promise.resolve( mockPostViewsResponse );
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

// Close-up canvas so the card fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

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
} satisfies Meta< LatestPostStoryControls >;

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
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
