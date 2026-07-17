/**
 * The stories mount the data-connected "Email performance" widget; a mocked
 * `stats/opens|clicks/emails/{id}?stats_fields=timeline` response from
 * `registerReportMocks` supplies daily buckets spanning the requested window.
 * `WidgetDashboardWithWidget` mounts the real dashboard so it renders exactly
 * as it does in product.
 *
 * The timeline is scoped to a single email via a mocked `reportParams.post_id`.
 * The endpoint has no comparison period, so the chart always draws a single
 * line even when the date picker injects comparison `reportParams`.
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
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import EmailTimeSeriesRender from '../render';
import widgetDefinition from '../widget';
import type { EmailTimeSeriesGranularity, EmailTimeSeriesMetric } from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const EMAIL_TIME_SERIES_RENDER_MODULE = 'storybook/email-time-series';

// A representative email whose timeline the mocks return data for.
const MOCK_EMAIL_ID = 1234;

/**
 * Read an attribute's declared element values off the widget definition, so the
 * story controls always mirror the schema.
 *
 * @param id - The attribute id on the widget definition.
 * @return The attribute's element values.
 */
function attributeElementValues< Value extends string >( id: string ): Value[] {
	return (
		widgetDefinition.attributes
			.find( attribute => attribute.id === id )
			?.elements?.map( element => element.value as Value ) ?? []
	);
}

const METRIC_OPTIONS: EmailTimeSeriesMetric[] =
	attributeElementValues< EmailTimeSeriesMetric >( 'metric' );
const GRANULARITY_OPTIONS: EmailTimeSeriesGranularity[] =
	attributeElementValues< EmailTimeSeriesGranularity >( 'granularity' );

/**
 * Widget-specific controls: the comparison toggle, the opens/clicks metric, and
 * the day/week bucket granularity.
 */
interface EmailTimeSeriesStoryControls {
	withComparison: boolean;
	metric: EmailTimeSeriesMetric;
	granularity: EmailTimeSeriesGranularity;
}

function renderEmailTimeSeries( {
	withComparison,
	metric,
	granularity,
}: EmailTimeSeriesStoryControls ) {
	return (
		<EmailTimeSeriesRender
			attributes={ {
				reportParams: { ...getDefaultQueryParams( withComparison ), post_id: MOCK_EMAIL_ID },
				metric,
				granularity,
			} }
		/>
	);
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
				granularity: 'day',
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/EmailTimeSeries',
	component: EmailTimeSeriesRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		metric: { control: 'select', options: METRIC_OPTIONS },
		granularity: { control: 'select', options: GRANULARITY_OPTIONS },
	},
	parameters: {
		docs: {
			description: {
				component:
					"The \"Email performance\" widget. Draws a single sent email's opens or clicks per day as a line chart, spanning the dashboard date range — the chart section of the legacy email detail page. The `granularity` attribute (`relevance: 'high'`) is exposed as a control by the widget host; weekly grouping aggregates the daily buckets client-side because the endpoint only reports hourly/daily. Scoped to one email via a mocked `reportParams.post_id`. The endpoint has no comparison period, so the chart stays a single line even when the date picker injects comparison params.",
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
	args: { withComparison: false, metric: 'opens', granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

/**
 * The clicks timeline used by the fixed Email clicks composition.
 */
export const Clicks: Story = {
	render: renderEmailTimeSeries,
	args: { withComparison: false, metric: 'clicks', granularity: 'day' },
	decorators: [ withWidgetCanvas ],
};

/**
 * Weekly grouping: the daily buckets aggregate client-side into ISO weeks.
 */
export const ByWeeks: Story = {
	render: renderEmailTimeSeries,
	args: { withComparison: false, metric: 'opens', granularity: 'week' },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison `reportParams` from the date picker. The timeline endpoint returns
 * no comparison period, so the chart still draws a single line.
 */
export const WithComparison: Story = {
	render: renderEmailTimeSeries,
	args: { withComparison: true, metric: 'opens', granularity: 'day' },
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

function EmailTimeSeriesDashboardStory( {
	withComparison,
	metric,
	granularity,
	...dashboardArgs
}: EmailTimeSeriesDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ EMAIL_TIME_SERIES_RENDER_MODULE }
			renderComponent={ EmailTimeSeriesRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: { ...getDefaultQueryParams( withComparison ), post_id: MOCK_EMAIL_ID },
				metric,
				granularity,
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< EmailTimeSeriesDashboardStoryProps > = {
	render: args => <EmailTimeSeriesDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: false,
		metric: 'opens',
		granularity: 'day',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
		metric: { control: 'select', options: METRIC_OPTIONS },
		granularity: { control: 'select', options: GRANULARITY_OPTIONS },
	},
};
