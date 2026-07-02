/**
 * The Shares widget lists each connected social account with its follower count
 * as a leaderboard. Data comes from the designated `useStatsPublicize` hook; the
 * Publicize endpoint has no date range or comparison period, so the widget shows
 * the same current counts regardless of the dashboard's comparison state.
 *
 * The shared `registerReportMocks` helper does not cover the Publicize endpoint,
 * so a story-scoped `apiFetch` middleware serves it here.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SharesRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { APIFetchOptions } from '@wordpress/api-fetch';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

const STATS_PUBLICIZE_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/publicize';
const SHARES_RENDER_MODULE = 'storybook/shares';

const mockPublicizeServices = [
	{ service: 'facebook', followers: 12840 },
	{ service: 'twitter', followers: 9320 },
	{ service: 'linkedin', followers: 5410 },
	{ service: 'tumblr', followers: 2180 },
];

// Serve the Publicize endpoint, which the shared report mocks do not cover.
// Registered before `registerReportMocks()` so the shared middleware passes
// non-matching paths through to this one.
apiFetch.use( async ( options: APIFetchOptions, next ) => {
	const path = options.path ?? options.url ?? '';
	if ( path.startsWith( STATS_PUBLICIZE_PATH ) ) {
		return { services: mockPublicizeServices };
	}
	return next( options );
} );

registerReportMocks();

interface SharesStoryControls {
	withComparison: boolean;
}

function renderShares( { withComparison }: SharesStoryControls ) {
	return (
		<SharesRender
			attributes={ { max: 0, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the leaderboard fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Shares',
	component: SharesRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget listing each connected social account (icon + name) with its follower count, rendered as a leaderboard. Data comes from the designated `useStatsPublicize` hook; in Storybook it is served by a story-scoped Publicize mock.',
			},
		},
	},
} satisfies Meta< SharesStoryControls >;

export default meta;

type Story = StoryObj< SharesStoryControls >;

/**
 * The widget on its own, populated from mocked Publicize data.
 */
export const Default: Story = {
	render: renderShares,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison state — the dashboard's comparison `reportParams` are present, but
 * the Publicize endpoint has no comparison period, so the widget renders the
 * same current follower counts without deltas.
 */
export const WithComparison: Story = {
	render: renderShares,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			description: {
				story:
					'The Publicize module has no comparison data to display, so no period-over-period deltas are shown.',
			},
		},
	},
};

interface SharesDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SharesStoryControls {}

function SharesDashboardStory( { withComparison, ...dashboardArgs }: SharesDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ SHARES_RENDER_MODULE }
			renderComponent={ SharesRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 0, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: StoryObj< SharesDashboardStoryProps > = {
	render: args => <SharesDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
