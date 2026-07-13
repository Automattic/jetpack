/**
 * The close-up stories render the data-connected widget against a mocked per-post
 * `stats/<opens|clicks>/emails/<postId>/rate` response so the tiles populate without a
 * backend. `WidgetDashboardWithWidget` mounts the real dashboard with the same
 * widget.
 *
 * The widget is scoped to a single email by the host through
 * `reportParams.post_id` and to one view by the `metric` attribute (Opens or
 * Clicks). The rate breakdown is all-time and returns no comparison rows, so the
 * `WithComparison` story renders identically to `Default` — there is no
 * period-over-period data and no deltas are shown.
 *
 * The Loading / Error / Empty stories force the mock into that state with
 * `setReportMockState`; each uses a distinct `post_id` so its request has its own
 * query key and hits the override fresh rather than reading a sibling's cache.
 */
/**
 * Internal dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import EmailTopRowRender from '../render';
import widgetDefinition from '../widget';
import type { EmailMetric } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const EMAIL_TOP_ROW_RENDER_MODULE = 'storybook/email-top-row';

// A representative email; the mock returns populated totals for any post ID.
const MOCK_POST_ID = 2000;

// Overrides are keyed by this fragment of the opens rate-breakdown path.
const OPENS_MOCK_FRAGMENT = 'stats/opens/emails';

interface EmailTopRowStoryControls {
	metric: EmailMetric;
	withComparison: boolean;
}

function renderEmailTopRow(
	{ metric, withComparison }: EmailTopRowStoryControls,
	postId: number = MOCK_POST_ID
) {
	return (
		<EmailTopRowRender
			attributes={ {
				metric,
				reportParams: { ...getDefaultQueryParams( withComparison ), post_id: postId },
			} }
		/>
	);
}

// Close-up canvas so the tiles fill the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/EmailTopRow',
	component: EmailTopRowRender,
	tags: [ 'autodocs' ],
	argTypes: {
		metric: {
			control: 'inline-radio',
			options: [ 'opens', 'clicks' ],
		},
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Email top row" widget. Shows a single email\'s all-time headline totals as a row of metric tiles, switching between the Opens view (total sends, unique opens, total opens, open rate) and the Clicks view (total opens, total clicks, click rate) via the `metric` attribute. The email is selected by the host through `reportParams.post_id`. Data comes from the per-post `stats/<opens|clicks>/emails/<postId>/rate` breakdown, which is all-time and returns no comparison rows, so the widget ignores the dashboard date range and never shows period-over-period deltas.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof EmailTopRowRender > & EmailTopRowStoryControls >;

export default meta;

type Story = StoryObj< EmailTopRowStoryControls >;

/**
 * Default populated state — the selected email's Opens totals.
 */
export const Default: Story = {
	render: args => renderEmailTopRow( args ),
	args: { metric: 'opens', withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * The Clicks view — total opens, total clicks, and click rate for the same email.
 */
export const ClicksView: Story = {
	render: args => renderEmailTopRow( args ),
	args: { metric: 'clicks', withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * With comparison `reportParams` from the date range picker. The rate breakdown
 * has no comparison data, so the widget renders the same tiles with no deltas
 * rather than inventing period-over-period values.
 */
export const WithComparison: Story = {
	render: args => renderEmailTopRow( args ),
	args: { metric: 'opens', withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load with no data yet: the widget shows its loading overlay.
 */
export const Loading: Story = {
	render: args => renderEmailTopRow( args, 2001 ),
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	args: { metric: 'opens', withComparison: false },
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( OPENS_MOCK_FRAGMENT, 'loading' );
		return () => setReportMockState( OPENS_MOCK_FRAGMENT, null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: args => renderEmailTopRow( args, 2002 ),
	tags: [ '!autodocs' ],
	args: { metric: 'opens', withComparison: false },
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( OPENS_MOCK_FRAGMENT, 'error' );
		return () => setReportMockState( OPENS_MOCK_FRAGMENT, null );
	},
};

/**
 * Resolved with no stats for the email: the widget shows its empty state (the
 * envelope glyph and "No stats are available for this email yet.").
 */
export const Empty: Story = {
	render: args => renderEmailTopRow( args, 2003 ),
	tags: [ '!autodocs' ],
	args: { metric: 'opens', withComparison: false },
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( OPENS_MOCK_FRAGMENT, 'empty' );
		return () => setReportMockState( OPENS_MOCK_FRAGMENT, null );
	},
};

/**
 * No email selected (no `post_id`): the widget prompts to pick an email instead of
 * fetching. This is how the widget renders on a report page before a row is chosen.
 */
export const NoEmailSelected: Story = {
	render: ( { metric, withComparison }: EmailTopRowStoryControls ) => (
		<EmailTopRowRender
			attributes={ { metric, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	),
	args: { metric: 'opens', withComparison: false },
	decorators: [ withWidgetCanvas ],
};

interface EmailTopRowDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		EmailTopRowStoryControls {}

function EmailTopRowDashboardStory( {
	metric,
	withComparison,
	...dashboardArgs
}: EmailTopRowDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ EMAIL_TOP_ROW_RENDER_MODULE }
			renderComponent={ EmailTopRowRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				metric,
				reportParams: { ...getDefaultQueryParams( withComparison ), post_id: MOCK_POST_ID },
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< EmailTopRowDashboardStoryProps > = {
	render: args => <EmailTopRowDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		metric: 'opens',
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		metric: {
			control: 'inline-radio',
			options: [ 'opens', 'clicks' ],
		},
		withComparison: { control: 'boolean' },
	},
};
