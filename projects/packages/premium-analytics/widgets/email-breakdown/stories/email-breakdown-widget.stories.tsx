/**
 * The stories mount the data-connected "Email breakdown" widget; mocked
 * `stats/opens|clicks/emails/{id}/{breakdown}` responses from
 * `registerReportMocks` supply populated rows for each view and metric (the
 * links view merges the `link` and `user-content-link` breakdowns).
 * `WidgetDashboardWithWidget` mounts the real dashboard so it renders exactly
 * as it does in product.
 *
 * The breakdown is scoped to a single email via a mocked `reportParams.post_id`. These
 * endpoints report over the whole lifetime of the email and return no comparison period, so
 * the `WithComparison` story still renders without deltas — it only verifies the
 * widget stays graceful when the date picker injects comparison `reportParams`.
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
import EmailBreakdownRender from '../render';
import widgetDefinition from '../widget';
import type { EmailBreakdownMetric, EmailBreakdownView } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const EMAIL_BREAKDOWN_RENDER_MODULE = 'storybook/email-breakdown';

// A representative email whose breakdown the mocks return data for.
const MOCK_EMAIL_ID = 1234;

/**
 * Read an attribute's declared element values off the widget definition, so the
 * story controls always mirror the schema (a newly added view or metric shows
 * up as a control option without touching this file).
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

const VIEW_OPTIONS: EmailBreakdownView[] = attributeElementValues< EmailBreakdownView >( 'view' );
const METRIC_OPTIONS: EmailBreakdownMetric[] =
	attributeElementValues< EmailBreakdownMetric >( 'metric' );

/**
 * Widget-specific controls: the comparison toggle, the breakdown view, and the
 * opens/clicks metric for the dimension views.
 */
interface EmailBreakdownStoryControls {
	withComparison: boolean;
	view: EmailBreakdownView;
	metric: EmailBreakdownMetric;
}

function renderEmailBreakdown( { withComparison, view, metric }: EmailBreakdownStoryControls ) {
	return (
		<EmailBreakdownRender
			attributes={ {
				reportParams: { ...getDefaultQueryParams( withComparison ), post_id: MOCK_EMAIL_ID },
				view,
				metric,
			} }
		/>
	);
}

// Renders the widget against a distinct email ID. The breakdown endpoints take
// no date params, so (unlike the date-preset trick other widgets use) a unique
// email ID is what gives the forced-state stories their own cache entry — they
// hit the mock fresh instead of reading another story's cached success from the
// shared query client.
function renderEmailBreakdownForState( postId: number ) {
	return (
		<EmailBreakdownRender
			attributes={ {
				reportParams: { ...getDefaultQueryParams( false ), post_id: postId },
				view: 'countries',
				metric: 'opens',
			} }
		/>
	);
}

// Close-up canvas so the chart fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '320px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/EmailBreakdown',
	component: EmailBreakdownRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		view: { control: 'select', options: VIEW_OPTIONS },
		metric: { control: 'select', options: METRIC_OPTIONS },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Email breakdown" widget. Breaks a single sent email down by countries, devices, email clients, or clicked links, rendered as a leaderboard. The `view` attribute (`relevance: \'high\'`) is exposed as a control by the widget host; the `metric` attribute picks the opens or clicks breakdown for the dimension views, while `links` always reads the clicks breakdown (merging internal link types with clicked user-content links, like the Calypso links module). Scoped to one email via a mocked `reportParams.post_id`. These endpoints have no comparison period, so the widget renders without deltas even when the date picker injects comparison params.',
			},
		},
	},
	decorators: [ withChartTheme ],
} satisfies Meta< ComponentProps< typeof EmailBreakdownRender > & EmailBreakdownStoryControls >;

export default meta;

type Story = StoryObj< EmailBreakdownStoryControls >;

/**
 * Default populated state — the selected email broken down by country.
 */
export const Default: Story = {
	render: renderEmailBreakdown,
	args: { withComparison: false, view: 'countries', metric: 'opens' },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison `reportParams` from the date picker. The breakdown endpoints return
 * no comparison rows, so the widget renders normally without deltas.
 */
export const WithComparison: Story = {
	render: renderEmailBreakdown,
	args: { withComparison: true, view: 'countries', metric: 'opens' },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderEmailBreakdownForState( 5601 ),
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
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
	render: () => renderEmailBreakdownForState( 5602 ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/opens/emails', 'error' );
		return () => setReportMockState( 'stats/opens/emails', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the envelope glyph
 * and the per-view "no data yet" copy).
 */
export const Empty: Story = {
	render: () => renderEmailBreakdownForState( 5603 ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/opens/emails', 'empty' );
		return () => setReportMockState( 'stats/opens/emails', null );
	},
};

/**
 * No email selected: `reportParams.post_id` is unset, so no request is made and
 * the empty state prompts to select an email instead of "no data yet".
 */
export const NoEmailSelected: Story = {
	render: () => (
		<EmailBreakdownRender
			attributes={ { reportParams: getDefaultQueryParams( false ), view: 'countries' } }
		/>
	),
	decorators: [ withWidgetCanvas ],
};

interface EmailBreakdownDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		EmailBreakdownStoryControls {}

function EmailBreakdownDashboardStory( {
	withComparison,
	view,
	metric,
	...dashboardArgs
}: EmailBreakdownDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ EMAIL_BREAKDOWN_RENDER_MODULE }
			renderComponent={ EmailBreakdownRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: { ...getDefaultQueryParams( withComparison ), post_id: MOCK_EMAIL_ID },
				view,
				metric,
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< EmailBreakdownDashboardStoryProps > = {
	render: args => <EmailBreakdownDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		view: 'countries',
		metric: 'opens',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
		view: { control: 'select', options: VIEW_OPTIONS },
		metric: { control: 'select', options: METRIC_OPTIONS },
	},
};
