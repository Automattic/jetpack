/**
 * The close-up stories exercise the presentational `EmailsLeaderboard` with
 * fixtures so each state (populated, loading, empty, error) renders without a
 * backend. `WidgetDashboardWithWidget` mounts the real dashboard with the
 * data-connected widget; `registerReportMocks` supplies a mock
 * `stats/emails/summary` response so it renders populated in product context.
 */
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
import EmailsRender, { EmailsLeaderboard, type EmailRow } from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj, Decorator } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const EMAILS_RENDER_MODULE = 'storybook/emails';

const meta: Meta< typeof EmailsLeaderboard > = {
	title: 'Packages/Premium Analytics/Widgets/Emails',
	component: EmailsLeaderboard,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Emails" widget. Lists the most recently sent emails with their open or click rate, rendered as a leaderboard. The displayed rate is the `metric` attribute (`relevance: \'high\'`), exposed as a control by the widget host. The close-up stories drive the presentational `EmailsLeaderboard` with fixtures; `WidgetDashboardWithWidget` mounts the real dashboard with the data-connected widget (fed by a mocked `stats/emails/summary` response).',
			},
		},
	},
	decorators: [ withChartTheme ],
};

export default meta;

type Story = StoryObj< typeof EmailsLeaderboard >;

const mockRows: EmailRow[] = [
	{
		id: 1,
		label: '4 Ways to Make Your Website Stand Out',
		opensRate: 38.1,
		clicksRate: 3.81,
	},
	{
		id: 2,
		label: 'Develop Locally on Linux with WordPress.com',
		opensRate: 41.2,
		clicksRate: 5.98,
	},
	{
		id: 3,
		label: '10 Brand-New WordPress.com Themes for 2026',
		opensRate: 35.7,
		clicksRate: 7.12,
	},
	{
		id: 4,
		label: 'WordPress.com Is Now Available in More Languages',
		opensRate: 52.4,
		clicksRate: 8.93,
	},
	{
		id: 5,
		label: 'WordCamp Europe 2026: What to Expect',
		opensRate: 47.9,
		clicksRate: 10.25,
	},
	{
		id: 6,
		label: 'Click, Comment, Done: A Better Way to Collaborate',
		opensRate: 44.3,
		clicksRate: 10.38,
	},
];

const mockLongLabelRows: EmailRow[] = [
	{
		id: 1,
		label:
			'An exhaustively long, keyword-stuffed subject line that almost certainly needs to be truncated before it overflows the row',
		opensRate: 22.5,
		clicksRate: 4.1,
	},
	{
		id: 2,
		label: 'Your monthly digest: billing, new features, and what is coming next',
		opensRate: 33.8,
		clicksRate: 6.7,
	},
];

/**
 * Close-up canvas so the widget fills a real body area outside the dashboard
 * grid — the loading overlay and empty state need a sized container to render in.
 */
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '320px' } }>
		<Story />
	</div>
);

/**
 * Default populated state — latest emails (newest first) with their open rate.
 */
export const Default: Story = {
	args: {
		rows: mockRows,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Click-rate view — the `metric` attribute set to click rate instead of open rate.
 */
export const ByClickRate: Story = {
	args: {
		rows: mockRows,
		metric: 'clicks',
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Loading state — the loading overlay renders while data is fetched.
 */
export const Loading: Story = {
	args: {
		rows: [],
		isLoading: true,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Empty state — no emails have been sent yet.
 */
export const Empty: Story = {
	args: {
		rows: [],
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Error state — the report could not be loaded.
 */
export const ErrorState: Story = {
	args: {
		isError: true,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Long subject lines are truncated with an ellipsis so rows stay single-line.
 */
export const LongLabels: Story = {
	args: {
		rows: mockLongLabelRows,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Creates a decorator that wraps the story in a fixed-size container so the
 * widget's responsiveness can be inspected at a given width.
 *
 * @param width    - The container width (any CSS length).
 * @param [height] - The container height; defaults to `auto`.
 * @return A Storybook decorator.
 */
const createSizeDecorator = ( width: string, height = 'auto' ): Decorator => {
	return Story => (
		<div
			style={ {
				width,
				height,
				border: '1px dashed #ccc',
				borderRadius: '8px',
				containerType: 'inline-size',
				containerName: 'widget',
			} }
		>
			<Story />
		</div>
	);
};

/**
 * Medium container (448px / md breakpoint).
 */
export const SizeMedium: Story = {
	args: {
		rows: mockRows,
	},
	decorators: [ createSizeDecorator( '448px' ) ],
};

/**
 * Large container (576px / xl breakpoint).
 */
export const SizeLarge: Story = {
	args: {
		rows: mockRows,
	},
	decorators: [ createSizeDecorator( '576px' ) ],
};

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (full-bleed framing, sizing, edit mode).
 *
 * @param props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function EmailsDashboardStory( props: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...props }
			widgetType={ {
				name: widgetDefinition.name,
				title: widgetDefinition.title,
				icon: widgetDefinition.icon,
				presentation: 'framed',
			} }
			renderModule={ EMAILS_RENDER_MODULE }
			renderComponent={ EmailsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 6, metric: 'opens' } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <EmailsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
