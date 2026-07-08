/**
 * The stories mount the data-connected "Email breakdown" widget; a mocked
 * `stats/opens/emails/{id}/{breakdown}` (and `stats/clicks/emails/{id}/{breakdown}`
 * for links) response from `registerReportMocks` supplies populated rows for each
 * view. `WidgetDashboardWithWidget` mounts the real dashboard so it renders exactly
 * as it does in product.
 *
 * The breakdown is scoped to a single email via a mocked `postId`. These endpoints
 * report over the whole lifetime of the email and return no comparison period, so
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
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { withChartTheme } from '../../../packages/widgets-toolkit/src/stories/with-chart-theme';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import EmailBreakdownRender from '../render';
import widgetDefinition from '../widget';
import type { EmailBreakdownView } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const EMAIL_BREAKDOWN_RENDER_MODULE = 'storybook/email-breakdown';

// A representative email whose breakdown the mocks return data for.
const MOCK_EMAIL_ID = 1234;

const VIEW_OPTIONS: EmailBreakdownView[] = [ 'countries', 'devices', 'clients', 'links' ];

/**
 * Widget-specific controls: the comparison toggle and the breakdown view.
 */
interface EmailBreakdownStoryControls {
	withComparison: boolean;
	view: EmailBreakdownView;
}

function renderEmailBreakdown( { withComparison, view }: EmailBreakdownStoryControls ) {
	return (
		<EmailBreakdownRender
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				postId: MOCK_EMAIL_ID,
				view,
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
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Email breakdown" widget. Breaks a single sent email down by countries, devices, email clients, or clicked links, rendered as a leaderboard. The `view` attribute (`relevance: \'high\'`) is exposed as a control by the widget host; `countries`/`devices`/`clients` read the email opens breakdown and `links` reads the clicks breakdown. Scoped to one email via a mocked `postId`. These endpoints have no comparison period, so the widget renders without deltas even when the date picker injects comparison params.',
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
	args: { withComparison: false, view: 'countries' },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison `reportParams` from the date picker. The breakdown endpoints return
 * no comparison rows, so the widget renders normally without deltas.
 */
export const WithComparison: Story = {
	render: renderEmailBreakdown,
	args: { withComparison: true, view: 'countries' },
	decorators: [ withWidgetCanvas ],
};

interface EmailBreakdownDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		EmailBreakdownStoryControls {}

function EmailBreakdownDashboardStory( {
	withComparison,
	view,
	...dashboardArgs
}: EmailBreakdownDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ EMAIL_BREAKDOWN_RENDER_MODULE }
			renderComponent={ EmailBreakdownRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				postId: MOCK_EMAIL_ID,
				view,
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
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
		view: { control: 'select', options: VIEW_OPTIONS },
	},
};
