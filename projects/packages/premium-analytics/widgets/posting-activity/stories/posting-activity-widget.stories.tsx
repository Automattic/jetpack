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
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import PostingActivityRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const STATS_STREAK_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/streak';
const STREAK_DAYS = 365;

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

// Close-up canvas so the heatmap fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

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
