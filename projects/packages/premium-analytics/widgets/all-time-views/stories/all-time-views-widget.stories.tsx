import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AllTimeViewsRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// The site stats summary (`/proxy/v1.1/stats`) is not covered by the central
// report mocks, so register a story-scoped middleware for it. It is registered
// after `registerReportMocks()` and `apiFetch` runs the most recently
// registered middleware first, so this intercepts the summary request before the
// central catch-all returns an empty stats payload.
const STATS_SITE_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats';
const MOCK_ALL_TIME_VIEWS = 1_287_943;

let statsSiteMockRegistered = false;

function registerStatsSiteMock() {
	if ( statsSiteMockRegistered ) {
		return;
	}
	statsSiteMockRegistered = true;

	const middleware: APIFetchMiddleware = ( options: APIFetchOptions, next ) => {
		const requestPath = ( options.path ?? options.url ?? '' ).split( '?' )[ 0 ];

		if ( requestPath === STATS_SITE_PATH ) {
			return Promise.resolve( { stats: { views: MOCK_ALL_TIME_VIEWS } } );
		}

		return next( options );
	};

	apiFetch.use( middleware );
}

registerStatsSiteMock();

const ALL_TIME_VIEWS_RENDER_MODULE = 'storybook/all-time-views';

type AllTimeViewsRenderProps = ComponentProps< typeof AllTimeViewsRender >;

// The widget shows a single lifetime figure with no comparison period. The
// control is exposed only to prove the widget renders identically when the
// dashboard supplies comparison report params.
interface AllTimeViewsStoryControls {
	withComparison: boolean;
}

interface AllTimeViewsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AllTimeViewsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getAllTimeViewsAttributes(
	withComparison = false
): AllTimeViewsRenderProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison ),
	};
}

function renderAllTimeViews( { withComparison }: AllTimeViewsStoryControls ) {
	return <AllTimeViewsRender attributes={ getAllTimeViewsAttributes( withComparison ) } />;
}

function AllTimeViewsDashboardStory( {
	withComparison,
	...dashboardStoryArgs
}: AllTimeViewsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ ALL_TIME_VIEWS_RENDER_MODULE }
			renderComponent={ AllTimeViewsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getAllTimeViewsAttributes( withComparison ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AllTimeViews',
	component: AllTimeViewsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description:
				'Include previous-period comparison report params. The all-time total has no comparison period, so the widget renders identically either way.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget that displays the total number of views the site has received over its entire lifetime. The figure comes from the site stats summary and is not scoped to the dashboard date range.',
			},
		},
	},
} satisfies Meta< AllTimeViewsStoryControls >;

export default meta;

type Story = StoryObj< typeof meta >;
type DashboardStory = StoryObj< AllTimeViewsDashboardStoryProps >;

/**
 * Default state — the site's lifetime view total.
 */
export const Default: Story = {
	render: renderAllTimeViews,
	args: {
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison report params supplied — the all-time total has no comparison
 * period, so the widget renders the same bare figure without any delta.
 */
export const WithComparison: Story = {
	render: renderAllTimeViews,
	args: {
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <AllTimeViewsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description:
				'Include previous-period comparison report params. The all-time total has no comparison period, so the widget renders identically either way.',
		},
	},
};
