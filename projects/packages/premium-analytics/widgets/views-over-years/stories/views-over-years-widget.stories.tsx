/**
 * Data comes from the proxied `stats/visits` endpoint at `unit=month`, covered by
 * the shared report mocks, whose series trends to zero a couple of years back.
 */
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
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withStoryRouter } from '../../stories/with-story-router';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import ViewsOverYearsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const VIEWS_OVER_YEARS_RENDER_MODULE = 'storybook/views-over-years';

const VISITS_REQUEST_PATH = 'stats/visits';

interface ViewsOverYearsStoryControls {
	metric: 'total' | 'average';
}

function getViewsOverYearsAttributes(
	{ metric }: ViewsOverYearsStoryControls,
	withComparison = false
): ComponentProps< typeof ViewsOverYearsRender >[ 'attributes' ] {
	return {
		metric,
		reportParams: getDefaultQueryParams( withComparison ),
	};
}

function renderViewsOverYears( controls: ViewsOverYearsStoryControls ) {
	return <ViewsOverYearsRender attributes={ getViewsOverYearsAttributes( controls ) } />;
}

const metricArgType = {
	control: 'radio',
	options: [ 'total', 'average' ],
	description: "The `metric` attribute: the month's views, or its views per day.",
} as const;

const meta = {
	title: 'Packages/Premium Analytics/Widgets/ViewsOverYears',
	component: ViewsOverYearsRender,
	tags: [ 'autodocs' ],
	// A picked month navigates to the Traffic tab, so the widget needs a router
	// even in the close-up stories that mount it without a dashboard.
	decorators: [ withStoryRouter ],
	argTypes: {
		metric: metricArgType,
	},
	parameters: {
		docs: {
			description: {
				component:
					"The \"Views over years\" widget: every month of the site's views, one row per year closed by a Totals column outside the colour scale, as total views or views per day. The `metric` attribute has `relevance: 'high'`, so the framed host renders its select in the header; the close-up stories set it as an arg. It always covers the site's whole history, whatever year the Insights tab shows, and picking a month opens the Traffic tab over that month.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof ViewsOverYearsRender > & ViewsOverYearsStoryControls >;

export default meta;

type Story = StoryObj< ViewsOverYearsStoryControls >;

/**
 * Default — the site's monthly views across its history.
 */
export const Default: Story = {
	render: renderViewsOverYears,
	args: { metric: 'total' },
	decorators: [ withWidgetCanvas ],
};

/**
 * DailyAverage — the same table under the Daily average metric: each cell is
 * the month's views per day, and the scale and tooltips say so.
 */
export const DailyAverage: Story = {
	render: renderViewsOverYears,
	args: { metric: 'average' },
	decorators: [ withWidgetCanvas ],
};

/**
 * Loading — the first fetch is still in flight, so the widget shows its
 * heatmap skeleton. The mock is forced to never resolve for this story.
 */
export const Loading: Story = {
	render: renderViewsOverYears,
	args: { metric: 'total' },
	// The forced states are off the shared autodocs page: setReportMockState is
	// path-keyed, so they would bleed into the sibling stories.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( VISITS_REQUEST_PATH, 'loading' );
		return () => setReportMockState( VISITS_REQUEST_PATH, null );
	},
};

/**
 * Error — the fetch failed with a permission 403: neutral copy, no retry.
 */
export const Error: Story = {
	render: renderViewsOverYears,
	args: { metric: 'total' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( VISITS_REQUEST_PATH, 'error' );
		return () => setReportMockState( VISITS_REQUEST_PATH, null );
	},
};

/**
 * ErrorRetryable — the proxy's `no_connection` 403, which can heal after
 * reconnecting, so the widget offers a Retry action.
 */
export const ErrorRetryable: Story = {
	render: renderViewsOverYears,
	args: { metric: 'total' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( VISITS_REQUEST_PATH, 'error-retryable' );
		return () => setReportMockState( VISITS_REQUEST_PATH, null );
	},
};

/**
 * Empty — a site the endpoint has no views for.
 */
export const Empty: Story = {
	render: renderViewsOverYears,
	args: { metric: 'total' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( VISITS_REQUEST_PATH, 'empty' );
		return () => setReportMockState( VISITS_REQUEST_PATH, null );
	},
};

interface ViewsOverYearsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		ViewsOverYearsStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, sizing, host environment).
 */
function ViewsOverYearsDashboardStory( {
	metric,
	...dashboardArgs
}: ViewsOverYearsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ VIEWS_OVER_YEARS_RENDER_MODULE }
			renderComponent={ ViewsOverYearsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getViewsOverYearsAttributes( { metric }, true ) }
		/>
	);
}

/**
 * Mirrors the production placement (full width × 2 rows).
 */
export const WidgetDashboardWithWidget: StoryObj< ViewsOverYearsDashboardStoryProps > = {
	render: args => <ViewsOverYearsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 3,
		widgetHeight: 2,
		metric: 'total',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		metric: metricArgType,
	},
};
