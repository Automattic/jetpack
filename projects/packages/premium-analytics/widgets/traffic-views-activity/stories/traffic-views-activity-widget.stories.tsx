/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import TrafficViewsActivityRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const STATS_VISITS_PATH_FRAGMENT = 'stats/visits';

const TRAFFIC_VIEWS_ACTIVITY_RENDER_MODULE = 'storybook/traffic-views-activity';

// Match the shortest complete-year range offered by the Insights period control.
const YEAR_PRESET: PresetType = 'last-365-days';

function renderTrafficViewsActivity( preset: PresetType = YEAR_PRESET ) {
	return (
		<TrafficViewsActivityRender
			attributes={ { reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

function forceVisitsState( state: 'loading' | 'error' | 'error-retryable' | 'empty' ) {
	setReportMockState( STATS_VISITS_PATH_FRAGMENT, state );
	return () => {
		setReportMockState( STATS_VISITS_PATH_FRAGMENT, null );
	};
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TrafficViewsActivity',
	component: TrafficViewsActivityRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Traffic views activity" widget. Renders the site\'s daily views for the selected period as a calendar heatmap — week columns, weekday rows, and the view count in each cell. The site-wide counterpart to "Traffic activity", which is scoped to one post, and the metric counterpart to "Posting activity", which counts posts rather than views. Unlike the latter it never switches to compact squares: the design pairs the two on the Insights tab so one reads as counts and the other as density, so this one always renders labelled cells and drops the oldest week columns that will not fit the card. Days with no traffic stay blank rather than showing a 0.',
			},
		},
	},
} satisfies Meta< typeof TrafficViewsActivityRender >;

export default meta;

type Story = StoryObj< Partial< ComponentProps< typeof TrafficViewsActivityRender > > >;

/**
 * Default populated state — a year of daily views.
 */
export const Default: Story = {
	render: () => renderTrafficViewsActivity(),
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state.
 */
export const Loading: Story = {
	render: () => renderTrafficViewsActivity( 'last-90-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'loading' ),
};

/**
 * A permission-gated failure: neutral copy and no Retry, since retrying cannot
 * grant the capability.
 */
export const Error: Story = {
	render: () => renderTrafficViewsActivity( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'error' ),
};

/**
 * The proxy's `no_connection` failure, which can heal after reconnecting — so
 * this one does offer Retry.
 */
export const ErrorRetryable: Story = {
	render: () => renderTrafficViewsActivity( 'last-30-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'error-retryable' ),
};

/**
 * Resolved with no views anywhere in the period: the widget shows its empty
 * state rather than a grid of blank cells.
 */
export const Empty: Story = {
	render: () => renderTrafficViewsActivity( 'today' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'empty' ),
};

function TrafficViewsActivityDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ TRAFFIC_VIEWS_ACTIVITY_RENDER_MODULE }
			renderComponent={
				TrafficViewsActivityRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: getDefaultQueryParams( true, YEAR_PRESET ) } }
		/>
	);
}

/**
 * The widget in the real dashboard grid, sized as it ships on the Insights tab:
 * `width: 4, height: 2`, because the design's 61x40 cells do not fit a one-row
 * tile. `rowHeight` is pinned to the dashboard's own 200px rather than the
 * helper's 300px default — at 300 the tile is 616px instead of 416px and the
 * cells reach their cap with room to spare, hiding exactly the fit this story
 * exists to show.
 *
 * Cells still render ~57x37 here rather than the design's 61x40: the dashboard
 * route tightens `--wp-ui-card-padding` to 16px and this helper leaves the Card
 * default of 24px, costing the tile 24px of body height. Judge the exact cell
 * geometry on a real dashboard, not in Storybook.
 */
export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <TrafficViewsActivityDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 4,
		widgetHeight: 2,
		rowHeight: 200,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
