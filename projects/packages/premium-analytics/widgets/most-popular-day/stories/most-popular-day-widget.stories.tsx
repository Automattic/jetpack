/**
 * The three stories render the data-connected widget fed by a mocked
 * `stats/insights` response, so it appears populated without a live backend.
 * `registerReportMocks` supplies the shared host requests (settings, etc.); a
 * story-scoped middleware supplies the insights payload the central mocks do not
 * cover. The Stats Insights "most popular day" highlight has no comparison
 * period and ignores the dashboard date range, so `WithComparison` renders
 * identically to `Default`.
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
import MostPopularDayRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const STATS_INSIGHTS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/insights';

// Raw WPCOM insights payload the data package sanitizes. `highest_day_of_week`
// 3 maps to Thursday; the sanitizer requires this field or it returns no data.
const insightsMock = {
	highest_day_of_week: 3,
	highest_day_percent: 45,
	highest_hour: 18,
	highest_hour_percent: 12,
	hourly_views: {},
	years: [],
};

const insightsMocksMiddleware: APIFetchMiddleware = ( options: APIFetchOptions, next ) => {
	const requestPath = options.path ?? options.url ?? '';

	if ( ! requestPath.startsWith( STATS_INSIGHTS_PATH ) ) {
		return next( options );
	}

	if ( options.parse === false ) {
		return Promise.resolve(
			new Response( JSON.stringify( insightsMock ), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			} )
		);
	}

	return Promise.resolve( insightsMock );
};

let insightsMocksRegistered = false;

function registerInsightsMocks() {
	if ( insightsMocksRegistered ) {
		return;
	}
	insightsMocksRegistered = true;
	apiFetch.use( insightsMocksMiddleware );
}

registerInsightsMocks();

const MOST_POPULAR_DAY_RENDER_MODULE = 'storybook/most-popular-day';

interface MostPopularDayStoryControls {
	withComparison: boolean;
}

/**
 * Renders the data-connected widget for the close-up stories.
 *
 * @param {MostPopularDayStoryControls} props - The story controls.
 * @return The rendered widget.
 */
function renderMostPopularDay( { withComparison }: MostPopularDayStoryControls ) {
	return (
		<MostPopularDayRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the highlight fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/MostPopularDay',
	component: MostPopularDayRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Most popular day" widget ports the Jetpack Stats Insights highlight: the day of the week that draws the highest share of views. The value comes from a site-wide insight that has no comparison period and does not depend on the dashboard date range, so `WithComparison` renders identically to `Default`.',
			},
		},
	},
} satisfies Meta< MostPopularDayStoryControls >;

export default meta;

type Story = StoryObj< MostPopularDayStoryControls >;

/**
 * Default state — the busiest day and its share of views.
 */
export const Default: Story = {
	render: renderMostPopularDay,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison params from the date-range picker are passed through, but the
 * insight has no comparison data, so the widget renders the same single value.
 */
export const WithComparison: Story = {
	render: renderMostPopularDay,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface MostPopularDayDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		MostPopularDayStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {MostPopularDayDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function MostPopularDayDashboardStory( {
	withComparison,
	...dashboardArgs
}: MostPopularDayDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ MOST_POPULAR_DAY_RENDER_MODULE }
			renderComponent={ MostPopularDayRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< MostPopularDayDashboardStoryProps > = {
	render: args => <MostPopularDayDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
