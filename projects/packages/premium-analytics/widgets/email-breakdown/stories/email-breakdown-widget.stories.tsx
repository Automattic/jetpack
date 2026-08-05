/**
 * The stories mount the data-connected "Email breakdown" widget; mocked
 * `stats/opens|clicks/emails/{id}/{breakdown}` responses from
 * `registerReportMocks` supply populated rows for each view and metric (the
 * links view merges the `link` and `user-content-link` breakdowns).
 * `WidgetDashboardWithWidget` mounts the real dashboard so it renders exactly
 * as it does in product.
 *
 * The breakdown is scoped to a single email via a mocked `reportParams.post_id`.
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
import EmailBreakdownRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { EmailBreakdownMetric, EmailBreakdownView } from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
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
 * Widget-specific controls: the breakdown view and opens/clicks metric for the
 * dimension views.
 */
interface EmailBreakdownStoryControls {
	view: EmailBreakdownView;
	metric: EmailBreakdownMetric;
	showMap: boolean;
}

function renderEmailBreakdown( { view, metric, showMap }: EmailBreakdownStoryControls ) {
	return (
		<EmailBreakdownRender
			attributes={ {
				reportParams: { ...getDefaultQueryParams(), post_id: MOCK_EMAIL_ID },
				view,
				metric,
				showMap,
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

const meta = {
	title: 'Packages/Premium Analytics/Widgets/EmailBreakdown',
	component: EmailBreakdownRender,
	tags: [ 'autodocs' ],
	argTypes: {
		view: { control: 'select', options: VIEW_OPTIONS },
		metric: { control: 'select', options: METRIC_OPTIONS },
		showMap: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Email breakdown" widget. Breaks a single sent email down by countries, devices, email clients, or clicked links, rendered as a leaderboard. The `view` attribute (`relevance: \'high\'`) is exposed as a control by the widget host; the `metric` attribute picks the opens or clicks breakdown for the dimension views, while `links` always reads the clicks breakdown (merging internal link types with clicked user-content links, like the Calypso links module). Scoped to one email via a mocked `reportParams.post_id`. The email breakdown endpoints have no comparison period, so the widget renders without deltas.',
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
	args: { view: 'countries', metric: 'opens', showMap: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * The optional map beside the countries leaderboard. No fixed composition
 * enables it anymore (the Email clicks Locations card is a plain leaderboard
 * per the design mocks); the story keeps the capability covered.
 */
export const LocationClicksWithMap: Story = {
	render: renderEmailBreakdown,
	args: { view: 'countries', metric: 'clicks', showMap: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderEmailBreakdownForState( 5601 ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
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
	view,
	metric,
	showMap,
	...dashboardArgs
}: EmailBreakdownDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ EMAIL_BREAKDOWN_RENDER_MODULE }
			renderComponent={ EmailBreakdownRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: { ...getDefaultQueryParams( true ), post_id: MOCK_EMAIL_ID },
				view,
				metric,
				showMap,
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< EmailBreakdownDashboardStoryProps > = {
	render: args => <EmailBreakdownDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		view: 'countries',
		metric: 'opens',
		showMap: false,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		view: { control: 'select', options: VIEW_OPTIONS },
		metric: { control: 'select', options: METRIC_OPTIONS },
		showMap: { control: 'boolean' },
	},
};
