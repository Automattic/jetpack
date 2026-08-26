/**
 * The stories mount the data-connected "Email performance" widget; a mocked
 * `stats/opens|clicks/emails/{id}?stats_fields=timeline` response from
 * `registerReportMocks` supplies daily buckets spanning the requested window.
 * `WidgetDashboardWithWidget` mounts the real dashboard so it renders exactly
 * as it does in product.
 *
 * The timeline is scoped to a single email via a mocked `reportParams.post_id`.
 * The post detail design has no period-over-period comparison, so the widget
 * maps no comparison rows; the dashboard story still passes comparison params
 * so the widget stays covered against crashing or inventing an overlay when a
 * host supplies them.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { PRESET_LAST_24_HOURS } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { withChartTheme } from '../../../packages/widgets-toolkit/src/stories/with-chart-theme';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { presetForStoryInterval } from '../../stories/preset-for-story-interval';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import EmailTimeSeriesRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { StatsChartBucketPeriod } from '@jetpack-premium-analytics/data';
import type { EmailTimeSeriesChartType, EmailTimeSeriesMetric } from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const EMAIL_TIME_SERIES_RENDER_MODULE = 'storybook/email-time-series';

// A representative email whose timeline the mocks return data for.
const MOCK_EMAIL_ID = 1234;

// `metric` is pinned per email tab by the post detail layout rather than
// exposed as a user-facing attribute, so the story enumerates the union
// directly to preview both tab instances.
const METRIC_OPTIONS: EmailTimeSeriesMetric[] = [ 'opens', 'clicks' ];
const INTERVAL_OPTIONS: StatsChartBucketPeriod[] = [ 'day', 'week', 'month' ];

/**
 * Widget-specific controls: the opens/clicks metric and the page's chart
 * interval, which the widget buckets its daily timeline into.
 */
interface EmailTimeSeriesStoryControls {
	metric: EmailTimeSeriesMetric;
	interval: StatsChartBucketPeriod;
	chartType: EmailTimeSeriesChartType;
}

/**
 * Builds the widget attributes. Comparison stays a parameter so the dashboard
 * story can pass host comparison params without duplicating the scoping rule.
 */
function getEmailTimeSeriesAttributes(
	{ metric, interval, chartType }: EmailTimeSeriesStoryControls,
	withComparison = false
): ComponentProps< typeof EmailTimeSeriesRender >[ 'attributes' ] {
	return {
		reportParams: {
			...getDefaultQueryParams( withComparison, presetForStoryInterval( interval ) ),
			interval,
			post_id: MOCK_EMAIL_ID,
		},
		metric,
		chartType,
	};
}

function renderEmailTimeSeries( controls: EmailTimeSeriesStoryControls ) {
	return <EmailTimeSeriesRender attributes={ getEmailTimeSeriesAttributes( controls ) } />;
}

// Renders the widget against a distinct email ID so the forced-state stories
// get their own cache entry — they hit the mock fresh instead of reading
// another story's cached success from the shared query client.
function renderEmailTimeSeriesForState( postId: number ) {
	return (
		<EmailTimeSeriesRender
			attributes={ {
				reportParams: { ...getDefaultQueryParams( false ), interval: 'day', post_id: postId },
				metric: 'opens',
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/EmailTimeSeries',
	component: EmailTimeSeriesRender,
	tags: [ 'autodocs' ],
	argTypes: {
		metric: { control: 'select', options: METRIC_OPTIONS },
		interval: { control: 'select', options: INTERVAL_OPTIONS },
		chartType: { control: 'radio', options: [ 'line', 'bar' ] },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Email performance" widget. Draws a single sent email\'s opens or clicks per day as a line chart, spanning the dashboard date range — the chart section of the legacy email detail page. The bucket size follows the page\'s chart interval control; weekly and monthly grouping aggregate the daily buckets client-side because the endpoint only reports hourly/daily. Scoped to one email via a mocked `reportParams.post_id`. The post detail page has no comparison control, so comparison report params are ignored.',
			},
		},
	},
	decorators: [ withChartTheme ],
} satisfies Meta< ComponentProps< typeof EmailTimeSeriesRender > & EmailTimeSeriesStoryControls >;

export default meta;

type Story = StoryObj< EmailTimeSeriesStoryControls >;

/**
 * Default populated state — the selected email's opens per day.
 */
export const Default: Story = {
	render: renderEmailTimeSeries,
	args: { metric: 'opens', interval: 'day', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

/**
 * The clicks timeline used by the fixed Email clicks composition.
 */
export const Clicks: Story = {
	render: renderEmailTimeSeries,
	args: { metric: 'clicks', interval: 'day', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

/**
 * Weekly grouping: the daily buckets aggregate client-side into ISO weeks.
 */
export const ByWeeks: Story = {
	render: renderEmailTimeSeries,
	args: { metric: 'opens', interval: 'week', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

/**
 * The last-24-hours preset: an hourly window that usually spans two calendar
 * days. The endpoint anchors its hourly buckets on the start day's midnight,
 * so the mock returns buckets from before the window opens — the data layer
 * trims them, and the chart draws exactly the selected 24 hours (WOOA7S-1840).
 * The page interval is pinned to `hour` by the preset, so the interval
 * control is hidden here.
 */
export const LastTwentyFourHours: Story = {
	render: ( { metric, chartType } ) => (
		<EmailTimeSeriesRender
			attributes={ {
				reportParams: {
					...getDefaultQueryParams( false, PRESET_LAST_24_HOURS ),
					post_id: MOCK_EMAIL_ID,
				},
				metric,
				chartType,
			} }
		/>
	),
	args: { metric: 'opens', interval: 'day', chartType: 'line' },
	argTypes: { interval: { table: { disable: true } } },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderEmailTimeSeriesForState( 5701 ),
	// Off the shared autodocs page — path-keyed override; see setReportMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/opens/emails', 'loading' );
		return () => setReportMockState( 'stats/opens/emails', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderEmailTimeSeriesForState( 5702 ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/opens/emails', 'error' );
		return () => setReportMockState( 'stats/opens/emails', null );
	},
};

/**
 * Resolved with no buckets: the widget shows its empty state.
 */
export const Empty: Story = {
	render: () => renderEmailTimeSeriesForState( 5703 ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/opens/emails', 'empty' );
		return () => setReportMockState( 'stats/opens/emails', null );
	},
};

/**
 * No email selected: `reportParams.post_id` is unset, so no request is made and
 * the empty state prompts to open an email report instead of "no activity".
 */
export const NoEmailSelected: Story = {
	render: () => (
		<EmailTimeSeriesRender
			attributes={ { reportParams: getDefaultQueryParams( false ), metric: 'opens' } }
		/>
	),
	decorators: [ withWidgetCanvas ],
};

interface EmailTimeSeriesDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		EmailTimeSeriesStoryControls {}

/**
 * Mounts the real `WidgetDashboard`. It passes comparison params
 * unconditionally, so the widget stays covered against crashing or inventing
 * an overlay when a host supplies comparison dates.
 */
function EmailTimeSeriesDashboardStory( {
	metric,
	interval,
	chartType,
	...dashboardArgs
}: EmailTimeSeriesDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ EMAIL_TIME_SERIES_RENDER_MODULE }
			renderComponent={ EmailTimeSeriesRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getEmailTimeSeriesAttributes( { metric, interval, chartType }, true ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< EmailTimeSeriesDashboardStoryProps > = {
	render: args => <EmailTimeSeriesDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		metric: 'opens',
		interval: 'day',
		chartType: 'line',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		metric: { control: 'select', options: METRIC_OPTIONS },
		interval: { control: 'select', options: INTERVAL_OPTIONS },
		chartType: { control: 'radio', options: [ 'line', 'bar' ] },
	},
};
