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
					'The "Traffic views activity" widget shows daily site views as a calendar heatmap. Days without views are blank, and older weeks are hidden when space is limited.',
			},
		},
	},
} satisfies Meta< typeof TrafficViewsActivityRender >;

export default meta;

type Story = StoryObj< Partial< ComponentProps< typeof TrafficViewsActivityRender > > >;

/**
 * A year of daily views.
 */
export const Default: Story = {
	render: () => renderTrafficViewsActivity(),
	decorators: [ withWidgetCanvas ],
};

/**
 * The initial loading state.
 */
export const Loading: Story = {
	render: () => renderTrafficViewsActivity( 'last-90-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'loading' ),
};

/**
 * A permission error without a retry action.
 */
export const Error: Story = {
	render: () => renderTrafficViewsActivity( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'error' ),
};

/**
 * A connection error with a retry action.
 */
export const ErrorRetryable: Story = {
	render: () => renderTrafficViewsActivity( 'last-30-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'error-retryable' ),
};

/**
 * A period with no views.
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
 * The widget at its production size: full width and two rows.
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
