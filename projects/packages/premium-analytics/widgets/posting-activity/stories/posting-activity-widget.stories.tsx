/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
import { getUnixTime, startOfDay, subDays } from 'date-fns';
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
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { siteLocaleArgTypes, withSiteLocale } from '../../stories/with-site-locale';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PostingActivityRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
import type { SiteLocaleControls } from '../../stories/with-site-locale';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const STATS_STREAK_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/streak';
const STATS_STREAK_PATH_FRAGMENT = 'stats/streak';
const STREAK_DAYS = 365;

/**
 * Forces the streak request into the given state for a story's lifetime.
 *
 * The story-local streak middleware below would otherwise shadow
 * `setReportMockState`, so use the shared story-side override helper that
 * re-registers ahead of story-local middleware when a forced state is set.
 */
function forceStreakState( state: 'loading' | 'error' | 'empty' ) {
	forceStatsMockState( STATS_STREAK_PATH_FRAGMENT, state );
	return () => {
		forceStatsMockState( STATS_STREAK_PATH_FRAGMENT, null );
	};
}

/**
 * A year of deterministic posts-per-day counts keyed by unix-second timestamps,
 * matching the raw `stats/streak` payload the sanitizer reads (`{ data: { <ts>:
 * count } }`). A seeded pseudo-random walk leaves clear gaps and busy stretches
 * so the heatmap reads as real posting activity rather than uniform noise.
 */
function buildStreakResponse() {
	const today = startOfDay( new Date() );
	const data: Record< string, number > = {};

	// Park–Miller LCG: deterministic, stays within safe-integer range, no bitwise ops.
	let seed = 1337;
	const nextRandom = () => {
		seed = ( seed * 16807 ) % 2147483647;
		return seed / 2147483647;
	};

	for ( let dayOffset = 0; dayOffset < STREAK_DAYS; dayOffset++ ) {
		const date = subDays( today, dayOffset );
		const roll = nextRandom();

		// ~55% of days have no posts; the rest cluster around 1–5 posts.
		if ( roll < 0.55 ) {
			continue;
		}

		const count = 1 + Math.floor( nextRandom() * 5 );
		data[ String( getUnixTime( date ) ) ] = count;
	}

	return { data };
}

const streakMocksMiddleware: APIFetchMiddleware = async ( options: APIFetchOptions, next ) => {
	const requestPath = options.path ?? options.url ?? '';

	if ( ! requestPath.startsWith( STATS_STREAK_PATH ) ) {
		return next( options );
	}

	const response = buildStreakResponse();

	if ( options.parse === false ) {
		return new Response( JSON.stringify( response ), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		} );
	}

	return response;
};

// Registered after registerReportMocks() so it is unshifted ahead of the shared
// report middleware and intercepts the streak request first (there is no central
// streak mock). Other paths fall through to next().
apiFetch.use( streakMocksMiddleware );

const POSTING_ACTIVITY_RENDER_MODULE = 'storybook/posting-activity';

// The card draws its own pinned last-12-months window, so every story shares
// one query key: `forceStatsMockState` evicts the cache on both edges, which is
// what keeps the forced-state stories isolated from each other.
function renderPostingActivity() {
	return <PostingActivityRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostingActivity',
	component: PostingActivityRender,
	tags: [ 'autodocs' ],
	decorators: [ withSiteLocale ],
	argTypes: { ...siteLocaleArgTypes },
	parameters: {
		docs: {
			description: {
				component:
					'The "Posting activity" widget: one mini calendar per month of the last 12, shaded by the posts published each day, with the month names beneath. The window is the widget\'s own; the dashboard date range does not move it. The close-up canvas is a one-column cell, so the grid scrolls sideways there; `WidgetDashboardWithWidget` below shows the full-width placement, where the months spread out.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PostingActivityRender > & SiteLocaleControls >;

export default meta;

type Story = StoryObj<
	Partial< ComponentProps< typeof PostingActivityRender > > & SiteLocaleControls
>;

/**
 * Default populated state — the last 12 months of posting activity.
 */
export const Default: Story = {
	render: renderPostingActivity,
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderPostingActivity,
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceStreakState( 'loading' ),
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: renderPostingActivity,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceStreakState( 'error' ),
};

/**
 * Resolved with no posts in the last 12 months: the widget shows its empty state.
 */
export const Empty: Story = {
	render: renderPostingActivity,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceStreakState( 'empty' ),
};

function PostingActivityDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ POSTING_ACTIVITY_RENDER_MODULE }
			renderComponent={ PostingActivityRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <PostingActivityDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		// The Insights default: full width, one row.
		widgetWidth: 3,
		widgetHeight: 1,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
