/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
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
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PostingActivityRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
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
 *
 * @param state - The forced report-mock state.
 * @return The `beforeEach` cleanup callback.
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
 *
 * @return The raw streak response.
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

interface PostingActivityStoryControls {
	withComparison: boolean;
}

function renderPostingActivity( { withComparison }: PostingActivityStoryControls ) {
	return (
		<PostingActivityRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderPostingActivityOnPreset( preset: PresetType ) {
	return (
		<PostingActivityRender
			attributes={ { reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostingActivity',
	component: PostingActivityRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Posting activity" widget. Renders a calendar (contribution-style) heatmap of the number of posts published per day for the dashboard date range. The `stats/streak` endpoint has no comparison period, so the WithComparison story renders identically to Default — no deltas are shown.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PostingActivityRender > & PostingActivityStoryControls >;

export default meta;

type Story = StoryObj< PostingActivityStoryControls >;

/**
 * Default populated state — a year of posting activity for the current period.
 */
export const Default: Story = {
	render: renderPostingActivity,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison state — the date range picker's comparison params are present, but
 * `stats/streak` has no comparison data, so the heatmap renders normally without
 * fabricated deltas.
 */
export const WithComparison: Story = {
	render: renderPostingActivity,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderPostingActivityOnPreset( 'last-90-days' ),
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
	render: () => renderPostingActivityOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceStreakState( 'error' ),
};

/**
 * Resolved with no posts in the range: the widget shows its empty state (the
 * neutral calendar glyph and the "posts will appear here" message).
 */
export const Empty: Story = {
	render: () => renderPostingActivityOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceStreakState( 'empty' ),
};

interface PostingActivityDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostingActivityStoryControls {}

function PostingActivityDashboardStory( {
	withComparison,
	...dashboardArgs
}: PostingActivityDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ POSTING_ACTIVITY_RENDER_MODULE }
			renderComponent={ PostingActivityRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< PostingActivityDashboardStoryProps > = {
	render: args => <PostingActivityDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
