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
import { WidgetCanvas, withWidgetCanvas } from '../../stories/with-widget-canvas';
import EmailBreakdownRender, { MAP_MIN_WIDTH } from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { EmailBreakdownMetric, EmailBreakdownView } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const EMAIL_BREAKDOWN_RENDER_MODULE = 'storybook/email-breakdown';

// A representative email whose breakdown the mocks return data for.
const MOCK_EMAIL_ID = 1234;

// The widget declares no editable attributes (the post detail page pins `view`
// and `metric` per card), so the control options are listed here rather than
// read off the definition. Keep in sync with the `EmailBreakdownView` and
// `EmailBreakdownMetric` unions in `../widget.ts`.
const VIEW_OPTIONS: EmailBreakdownView[] = [ 'countries', 'devices', 'clients', 'links' ];
const METRIC_OPTIONS: EmailBreakdownMetric[] = [ 'opens', 'clicks' ];

/**
 * Widget-specific controls: the breakdown view and opens/clicks metric for the
 * dimension views.
 */
interface EmailBreakdownStoryControls {
	view: EmailBreakdownView;
	metric: EmailBreakdownMetric;
	showMap: boolean;
}

// The card must clear the widget's map floor after its own 16px padding and 1px
// border on each side, with a little headroom so the map isn't rendered at the edge.
const MAP_CANVAS_WIDTH = `${ MAP_MIN_WIDTH + 2 * ( 16 + 1 ) + 48 }px`;

// Widens the canvas under the same condition the widget mounts its map, so the
// `showMap` control actually shows it instead of doing nothing in a one-column card.
const withMapAwareWidgetCanvas: Decorator< EmailBreakdownStoryControls > = ( Story, { args } ) => (
	<WidgetCanvas width={ args.showMap && args.view === 'countries' ? MAP_CANVAS_WIDTH : undefined }>
		<Story />
	</WidgetCanvas>
);

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
					'The "Email breakdown" widget. Breaks a single sent email down by countries, devices, email clients, or clicked links, rendered as a leaderboard. Neither `view` nor `metric` is user-editable — the post detail page pins both per card, so the host renders no settings affordance. The `metric` attribute picks the opens or clicks breakdown for the dimension views, while `links` always reads the clicks breakdown (merging internal link types with clicked user-content links, like the Calypso links module). Scoped to one email via a mocked `reportParams.post_id`. The email breakdown endpoints have no comparison period, so the widget renders without deltas.',
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
	decorators: [ withMapAwareWidgetCanvas ],
};

/**
 * The country map beside the countries leaderboard, as the two-column
 * "Locations" card on the post detail Email clicks tab renders it. The
 * widget only mounts the map at container widths of 720px and up, so the canvas
 * widens to a two-column card while `showMap` is on for the countries view.
 */
export const LocationClicksWithMap: Story = {
	render: renderEmailBreakdown,
	args: { view: 'countries', metric: 'clicks', showMap: true },
	decorators: [ withMapAwareWidgetCanvas ],
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
