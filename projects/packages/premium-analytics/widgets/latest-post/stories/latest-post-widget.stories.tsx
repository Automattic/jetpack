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
