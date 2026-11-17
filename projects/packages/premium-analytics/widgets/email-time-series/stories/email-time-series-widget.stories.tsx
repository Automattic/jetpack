/**
 * The post detail design has no period-over-period comparison, so the widget maps
 * no comparison rows; the dashboard story still passes comparison params so the
 * widget stays covered against inventing an overlay when a host supplies them.
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
import { withChartTheme } from '../../../packages/widgets-toolkit/src/stories/with-chart-theme';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	siteTimeZoneArgTypes,
	withSiteTimeZone,
	type SiteTimeZoneControls,
} from '../../stories/with-site-time-zone';
import EmailTimeSeriesRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { EmailSendWindow } from '@jetpack-premium-analytics/data';
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
const SEND_WINDOW_OPTIONS = widgetManifest.attributes[ 0 ].elements.map(
	element => element.value
) as EmailSendWindow[];

interface EmailTimeSeriesStoryControls extends SiteTimeZoneControls {
	metric: EmailTimeSeriesMetric;
	sendWindow: EmailSendWindow;
	chartType: EmailTimeSeriesChartType;
}

/**
 * Comparison stays a parameter so the dashboard story can pass host comparison
 * params without duplicating the scoping rule.
 */
function getEmailTimeSeriesAttributes(
	{ metric, sendWindow, chartType }: EmailTimeSeriesStoryControls,
	withComparison = false
): ComponentProps< typeof EmailTimeSeriesRender >[ 'attributes' ] {
	return {
		reportParams: {
			...getDefaultQueryParams( withComparison ),
			post_id: MOCK_EMAIL_ID,
		},
		metric,
		sendWindow,
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
				reportParams: { ...getDefaultQueryParams( false ), post_id: postId },
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
		...siteTimeZoneArgTypes,
		metric: { control: 'select', options: METRIC_OPTIONS },
		sendWindow: { control: 'select', options: SEND_WINDOW_OPTIONS },
		chartType: { control: 'radio', options: [ 'line', 'bar' ] },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Email performance" widget. Draws a single sent email\'s opens or clicks since it was sent — the chart section of the legacy email detail page. Its own "Time since send" control picks the window and with it the bucket: the first 24 hours by the hour, the first week or first 30 days by the day, all time by the month, each as the endpoint returns it. The window is counted from the start of the host\'s range, which the post page pins to the send day. Scoped to one email via a mocked `reportParams.post_id`. The post detail page has no comparison control, so comparison report params are ignored.',
			},
		},
	},
	decorators: [ withChartTheme, withSiteTimeZone ],
} satisfies Meta< ComponentProps< typeof EmailTimeSeriesRender > & EmailTimeSeriesStoryControls >;

export default meta;

type Story = StoryObj< EmailTimeSeriesStoryControls >;

/**
 * Default populated state — the selected email's opens per day over its first 30 days.
 */
export const Default: Story = {
	render: renderEmailTimeSeries,
	args: { metric: 'opens', sendWindow: 'first-30-days', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

/**
 * The clicks timeline used by the fixed Email clicks composition.
 */
export const Clicks: Story = {
	render: renderEmailTimeSeries,
	args: { metric: 'clicks', sendWindow: 'first-30-days', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

/**
 * All time: one bucket per calendar month, from the month of the send.
 */
export const AllTime: Story = {
	render: renderEmailTimeSeries,
	args: { metric: 'opens', sendWindow: 'all-time', chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

/**
 * The first 24 hours. The endpoint anchors its hourly buckets on the start
 * day's midnight, so the mock returns buckets from before the window opens and
 * the data layer trims them (WOOA7S-1840).
 */
export const FirstTwentyFourHours: Story = {
	render: renderEmailTimeSeries,
	args: { metric: 'opens', sendWindow: 'first-24-hours', chartType: 'line' },
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
	extends WidgetDashboardWithWidgetControls, EmailTimeSeriesStoryControls {}

/**
 * Mounts the real `WidgetDashboard`. It passes comparison params
 * unconditionally, so the widget stays covered against crashing or inventing
 * an overlay when a host supplies comparison dates.
 */
function EmailTimeSeriesDashboardStory( {
	metric,
	sendWindow,
	chartType,
	...dashboardArgs
}: EmailTimeSeriesDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ EMAIL_TIME_SERIES_RENDER_MODULE }
			renderComponent={ EmailTimeSeriesRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getEmailTimeSeriesAttributes( { metric, sendWindow, chartType }, true ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< EmailTimeSeriesDashboardStoryProps > = {
	tags: [ 'widget-dashboard' ],
	render: args => <EmailTimeSeriesDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		metric: 'opens',
		sendWindow: 'first-30-days',
		chartType: 'line',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		metric: { control: 'select', options: METRIC_OPTIONS },
		sendWindow: { control: 'select', options: SEND_WINDOW_OPTIONS },
		chartType: { control: 'radio', options: [ 'line', 'bar' ] },
	},
};
