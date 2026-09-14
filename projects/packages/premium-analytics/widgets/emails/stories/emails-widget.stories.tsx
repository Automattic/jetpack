/** Email widget stories and mocked report states. */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withStoryRouter } from '../../stories/with-story-router';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import EmailsRender, { EmailsList, type EmailRow } from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj, Decorator } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const EMAILS_RENDER_MODULE = 'storybook/emails';

const meta: Meta< typeof EmailsList > = {
	title: 'Packages/Premium Analytics/Widgets/Emails',
	component: EmailsList,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Lists the latest emails with their open or click count and rate. A rate with no attributable recipient shows an em dash. Close-up stories use fixtures; the dashboard story uses a mocked report.',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof EmailsList >;

const mockRows: EmailRow[] = [
	{
		id: 1,
		postId: 1,
		link: 'https://example.com/stand-out/',
		label: '4 Ways to Make Your Website Stand Out',
		opens: 402,
		uniqueOpens: 381,
		opensRate: 38.1,
		clicks: 41,
		uniqueClicks: 38,
		clicksRate: 3.81,
	},
	{
		id: 2,
		postId: 2,
		link: 'https://example.com/develop-locally/',
		label: 'Develop Locally on Linux with WordPress.com',
		opens: 1287,
		uniqueOpens: 1236,
		opensRate: 41.2,
		clicks: 190,
		uniqueClicks: 179,
		clicksRate: 5.98,
	},
	{
		id: 3,
		postId: 3,
		link: 'https://example.com/new-themes/',
		label: '10 Brand-New WordPress.com Themes for 2026',
		opens: 18432,
		uniqueOpens: 17850,
		opensRate: 35.7,
		clicks: 3702,
		uniqueClicks: 3560,
		clicksRate: 7.12,
	},
	{
		id: 4,
		postId: 4,
		link: 'https://example.com/languages/',
		label: 'WordPress.com Is Now Available in More Languages',
		opens: 560,
		uniqueOpens: 524,
		opensRate: 52.4,
		clicks: 12,
		uniqueClicks: 0,
		clicksRate: 0,
	},
	{
		id: 5,
		postId: 5,
		link: 'https://example.com/wordcamp-europe/',
		label: 'WordCamp Europe 2026: What to Expect',
		opens: 498,
		uniqueOpens: 479,
		opensRate: 47.9,
		clicks: 108,
		uniqueClicks: 103,
		clicksRate: 10.25,
	},
	{
		id: 6,
		postId: 6,
		link: 'https://example.com/collaborate/',
		label: 'Click, Comment, Done: A Better Way to Collaborate',
		opens: 0,
		uniqueOpens: 0,
		opensRate: 0,
		clicks: 0,
		uniqueClicks: 0,
		clicksRate: 0,
	},
];

const mockLongLabelRows: EmailRow[] = [
	{
		id: 1,
		postId: 1,
		link: 'https://example.com/long-subject/',
		label:
			'An exhaustively long, keyword-stuffed subject line that almost certainly needs to be truncated before it overflows the row',
		opens: 2250,
		uniqueOpens: 2100,
		opensRate: 22.5,
		clicks: 410,
		uniqueClicks: 395,
		clicksRate: 4.1,
	},
	{
		id: 2,
		postId: 2,
		link: 'https://example.com/monthly-digest/',
		label: 'Your monthly digest: billing, new features, and what is coming next',
		opens: 338,
		uniqueOpens: 320,
		opensRate: 33.8,
		clicks: 67,
		uniqueClicks: 60,
		clicksRate: 6.7,
	},
];

const withEmailsWidgetRoot: Decorator = Story => (
	<WidgetRoot attributes={ { reportParams: getDefaultQueryParams() } }>
		<Story />
	</WidgetRoot>
);

/**
 * Default populated state: latest emails (newest first) with their opens and open rate.
 */
export const Default: Story = {
	args: {
		rows: mockRows,
	},
	decorators: [ withWidgetCanvas, withEmailsWidgetRoot, withStoryRouter ],
};

/**
 * Clicks view: the `metric` attribute set to clicks and click rate instead of opens.
 */
export const ByClickRate: Story = {
	args: {
		rows: mockRows,
		metric: 'clicks',
	},
	decorators: [ withWidgetCanvas, withEmailsWidgetRoot, withStoryRouter ],
};

function renderEmails() {
	return <EmailsRender attributes={ { metric: 'opens' } } />;
}

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderEmails,
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		setReportMockState( 'stats/emails/summary', 'loading' );
		return () => setReportMockState( 'stats/emails/summary', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: renderEmails,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		setReportMockState( 'stats/emails/summary', 'error' );
		return () => setReportMockState( 'stats/emails/summary', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state ("Your latest emails
 * will appear here once you send a newsletter.").
 */
export const Empty: Story = {
	render: renderEmails,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		setReportMockState( 'stats/emails/summary', 'empty' );
		return () => setReportMockState( 'stats/emails/summary', null );
	},
};

/**
 * Long subject lines are truncated with an ellipsis so rows stay single-line.
 */
export const LongLabels: Story = {
	args: {
		rows: mockLongLabelRows,
	},
	decorators: [ withWidgetCanvas, withEmailsWidgetRoot, withStoryRouter ],
};

/**
 * Creates a decorator that wraps the story in a fixed-size container so the
 * widget's responsiveness can be inspected at a given width.
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
	decorators: [ createSizeDecorator( '448px' ), withEmailsWidgetRoot, withStoryRouter ],
};

/**
 * Large container (576px / xl breakpoint).
 */
export const SizeLarge: Story = {
	args: {
		rows: mockRows,
	},
	decorators: [ createSizeDecorator( '576px' ), withEmailsWidgetRoot, withStoryRouter ],
};

function EmailsDashboardStory( props: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...props }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ EMAILS_RENDER_MODULE }
			renderComponent={ EmailsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { metric: 'opens' } }
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
