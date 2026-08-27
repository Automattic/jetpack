/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
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
import ViewsOverYearsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const STATS_VISITS_PATH_FRAGMENT = 'stats/visits';

const VIEWS_OVER_YEARS_RENDER_MODULE = 'storybook/views-over-years';

/**
 * The widget builds its own all-time request and never scopes itself to the
 * host's period, but `WidgetRoot` still wants report params on `attributes`.
 *
 * @return The widget, as the dashboard mounts it.
 */
function renderViewsOverYears() {
	return <ViewsOverYearsRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

function forceVisitsState( state: 'loading' | 'error' | 'error-retryable' | 'empty' ) {
	setReportMockState( STATS_VISITS_PATH_FRAGMENT, state );
	return () => {
		setReportMockState( STATS_VISITS_PATH_FRAGMENT, null );
	};
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/ViewsOverYears',
	component: ViewsOverYearsRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Views over years" widget shows every year the site has views for as a month-by-month grid, with a per-year roll-up beside it. The metric control switches the cells and the roll-up between total views and average views per day. It is all-time regardless of the year the Insights header has selected, like the Stats card it replaces.',
			},
		},
	},
} satisfies Meta< typeof ViewsOverYearsRender >;

export default meta;

// `attributes` is required on the render props, so the alias is parameterized
// on a partial of them rather than on `meta` — a story that renders the widget
// itself passes none.
type Story = StoryObj< Partial< ComponentProps< typeof ViewsOverYearsRender > > >;

/**
 * Every year of views, month by month.
 */
export const Default: Story = {
	render: renderViewsOverYears,
	decorators: [ withWidgetCanvas ],
};

/**
 * The initial loading state.
 */
export const Loading: Story = {
	render: renderViewsOverYears,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'loading' ),
};

/**
 * A permission error without a retry action.
 */
export const Error: Story = {
	render: renderViewsOverYears,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'error' ),
};

/**
 * A connection error with a retry action.
 */
export const ErrorRetryable: Story = {
	render: renderViewsOverYears,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'error-retryable' ),
};

/**
 * A site that has never had a view.
 */
export const Empty: Story = {
	render: renderViewsOverYears,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceVisitsState( 'empty' ),
};

function ViewsOverYearsDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ VIEWS_OVER_YEARS_RENDER_MODULE }
			renderComponent={ ViewsOverYearsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

/**
 * The widget at its production size: full width and two rows. A site with more
 * years than the tile is tall scrolls inside it rather than crushing its cells.
 */
export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <ViewsOverYearsDashboardStory { ...args } />,
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
