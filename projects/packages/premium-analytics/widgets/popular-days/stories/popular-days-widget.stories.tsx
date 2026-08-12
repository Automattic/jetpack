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
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PopularDaysRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const POPULAR_DAYS_RENDER_MODULE = 'storybook/popular-days';

const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

/**
 * Renders the data-connected widget.
 *
 * @return The rendered widget.
 */
function renderPopularDays() {
	return <PopularDaysRender attributes={ { reportParams: getDefaultQueryParams( false ) } } />;
}

/**
 * Renders the widget on its own date preset.
 *
 * A distinct preset means a distinct query-cache entry, so a forced state cannot
 * be served from another story's cached response.
 *
 * @param preset - The date-range preset to render on.
 * @return The rendered widget.
 */
function renderPopularDaysOnPreset( preset: PresetType ) {
	return (
		<PopularDaysRender attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PopularDays',
	component: PopularDaysRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Popular days" card: the busiest day of the week for the selected range, as the weekday name and its mean views, over an area chart of the whole week\'s distribution. Both figures are means per occurrence of that weekday, not totals — a user-selected range rarely spans a whole number of weeks, so totals would let a weekday win on having occurred one extra time. Data comes from `stats/visits` at daily granularity, folded into seven buckets client-side; `stats/insights` also reports weekday views but over a window fixed at ten weeks, so it cannot follow the date picker. There is no WithComparison story — the widget strips comparison from its request and renders no delta, so it would be identical to Default.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PopularDaysRender > >;

export default meta;

type Story = StoryObj< Record< never, never > >;

/**
 * Default state — the peak weekday over the week's distribution.
 */
export const Default: Story = {
	render: renderPopularDays,
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderPopularDaysOnPreset( 'last-90-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'loading' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * The fetch failed with a permission-gated 403: neutral copy and no Retry
 * action, since retrying cannot clear a permission gate.
 */
export const Error: Story = {
	render: () => renderPopularDaysOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'error' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * The fetch failed in a way that can heal — the proxy's `no_connection` 403: the
 * retryable copy with a Retry action, which re-runs the query (still mocked as
 * failing while this story is active).
 */
export const ErrorRetryable: Story = {
	render: () => renderPopularDaysOnPreset( 'last-12-months' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'error-retryable' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * Resolved with no buckets: the widget shows its empty state.
 */
export const Empty: Story = {
	// Avoid presenting the same date range as ErrorRetryable in most years.
	render: () => renderPopularDaysOnPreset( 'last-year' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'empty' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * Comparison params are passed even though the widget strips them, so the story
 * covers the widget against crashing or inventing deltas when the host supplies
 * comparison dates.
 *
 * @param {WidgetDashboardWithWidgetControls} dashboardArgs - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function PopularDaysDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ POPULAR_DAYS_RENDER_MODULE }
			renderComponent={ PopularDaysRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <PopularDaysDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
