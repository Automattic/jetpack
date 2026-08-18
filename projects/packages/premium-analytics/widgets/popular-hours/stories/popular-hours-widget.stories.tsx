/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	registerReportMocks,
	setReportMockResponse,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PopularHoursRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const POPULAR_HOURS_RENDER_MODULE = 'storybook/popular-hours';

const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

function renderPopularHours() {
	return <PopularHoursRender attributes={ { reportParams: getDefaultQueryParams( false ) } } />;
}

function renderPopularHoursOnPreset( preset: PresetType ) {
	return (
		<PopularHoursRender attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PopularHours',
	component: PopularHoursRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Popular hours" card: the busiest hour of the day for the selected range, as a site-format hour label and its mean daily views, over an area chart of the whole day\'s distribution. Data comes from `stats/views-by/hour-of-day`, which folds the range into 24 buckets in the site\'s own timezone; `stats/insights` also reports an hours map, but keyed in UTC while its `highest_hour` is offset-applied, so its chart and headline disagree. The endpoint caps the range at 366 days, so `all time` and long custom ranges are clamped to the most recent 12 months. There is no WithComparison story — the widget strips comparison from its request and renders no delta, so it would be identical to Default.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PopularHoursRender > >;

export default meta;

type Story = StoryObj< Record< never, never > >;

/**
 * The peak hour over the day's distribution.
 */
export const Default: Story = {
	render: renderPopularHours,
	decorators: [ withWidgetCanvas ],
};

/**
 * The initial loading state.
 */
export const Loading: Story = {
	render: () => renderPopularHoursOnPreset( 'last-90-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/views-by/hour-of-day', 'loading' );
		return () => setReportMockState( 'stats/views-by/hour-of-day', null );
	},
};

/**
 * A non-retryable permission error.
 */
export const Error: Story = {
	render: () => renderPopularHoursOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/views-by/hour-of-day', 'error' );
		return () => setReportMockState( 'stats/views-by/hour-of-day', null );
	},
};

/**
 * A retryable connection error.
 */
export const ErrorRetryable: Story = {
	render: () => renderPopularHoursOnPreset( 'last-12-months' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/views-by/hour-of-day', 'error-retryable' );
		return () => setReportMockState( 'stats/views-by/hour-of-day', null );
	},
};

/**
 * A successful response folded into a dimension other than hour-of-day.
 */
export const UnsupportedResponse: Story = {
	render: () => renderPopularHoursOnPreset( 'last-30-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockResponse( 'stats/views-by/hour-of-day', {
			date: '2026-01-01',
			start_date: '2025-12-03',
			days: 30,
			dimension: 'day-of-week',
			fields: [ 'period', 'views' ],
			data: [ [ 'Mon', 100 ] ],
		} );
		return () => setReportMockResponse( 'stats/views-by/hour-of-day', null );
	},
};

/**
 * A report with no views.
 */
export const Empty: Story = {
	// Avoid presenting the same date range as ErrorRetryable in most years.
	render: () => renderPopularHoursOnPreset( 'last-year' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/views-by/hour-of-day', 'empty' );
		return () => setReportMockState( 'stats/views-by/hour-of-day', null );
	},
};

function PopularHoursDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ POPULAR_HOURS_RENDER_MODULE }
			renderComponent={ PopularHoursRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <PopularHoursDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
