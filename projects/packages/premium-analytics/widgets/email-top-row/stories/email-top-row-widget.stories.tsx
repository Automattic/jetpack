/**
 * The close-up stories render the data-connected widget against a mocked
 * `stats/emails/summary` response so the tiles populate without a backend.
 * `WidgetDashboardWithWidget` mounts the real dashboard with the same widget.
 *
 * The widget is scoped to a single email by the `postId` attribute; the stories
 * mock `postId` 2000, one of the emails returned by `registerReportMocks`. The
 * summary endpoint is all-time and returns no comparison rows, so the
 * `WithComparison` story renders identically to `Default` — there is no
 * period-over-period data to display and no deltas are shown.
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
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import EmailTopRowRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const EMAIL_TOP_ROW_RENDER_MODULE = 'storybook/email-top-row';

// A representative email present in the mocked `stats/emails/summary` response.
const MOCK_POST_ID = 2000;

interface EmailTopRowStoryControls {
	withComparison: boolean;
}

function renderEmailTopRow( { withComparison }: EmailTopRowStoryControls ) {
	return (
		<EmailTopRowRender
			attributes={ {
				postId: MOCK_POST_ID,
				reportParams: getDefaultQueryParams( withComparison ),
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
	title: 'Packages/Premium Analytics/Widgets/Email top row',
	component: EmailTopRowRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Email top row" widget. Shows a single email\'s all-time headline totals — total sends, total opens, unique opens, total clicks — plus the open and click rates, as a row of metric tiles. The email is selected by the `postId` attribute. Data comes from the all-time `stats/emails/summary` endpoint, which has no per-post filter and returns no comparison rows, so the widget ignores the dashboard date range and never shows period-over-period deltas.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof EmailTopRowRender > & EmailTopRowStoryControls >;

export default meta;

type Story = StoryObj< EmailTopRowStoryControls >;

/**
 * Default populated state — the selected email's totals, current period only.
 */
export const Default: Story = {
	render: renderEmailTopRow,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * With comparison `reportParams` from the date range picker. The summary
 * endpoint has no comparison data, so the widget renders the same tiles with no
 * deltas rather than inventing period-over-period values.
 */
export const WithComparison: Story = {
	render: renderEmailTopRow,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface EmailTopRowDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		EmailTopRowStoryControls {}

function EmailTopRowDashboardStory( {
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
				postId: MOCK_POST_ID,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< EmailTopRowDashboardStoryProps > = {
	render: args => <EmailTopRowDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
