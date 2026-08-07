/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
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
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import TotalVisitorsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TOTAL_VISITORS_RENDER_MODULE = 'storybook/total-visitors';

const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

/**
 * Renders the data-connected widget.
 *
 * @return The rendered widget.
 */
function renderTotalVisitors() {
	return <TotalVisitorsRender attributes={ { reportParams: getDefaultQueryParams( false ) } } />;
}

/**
 * Renders the widget on its own date preset.
 *
 * A distinct preset means a distinct query-cache entry, so a forced state cannot
 * be served from another story's cached response.
 *
 * @param preset - The date-range preset to render on.
 * @return The rendered widget.
 */
function renderTotalVisitorsOnPreset( preset: PresetType ) {
	return (
		<TotalVisitorsRender attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TotalVisitors',
	component: TotalVisitorsRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Total visitors" card: the selected period\'s visitor total as a large figure over an area sparkline of the trend. The total sums each day\'s visitors, so a returning visitor counts once per day — the card carries that caveat in its info popover. There is no WithComparison story: the widget strips comparison from its request and renders no delta.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TotalVisitorsRender > >;

export default meta;

type Story = StoryObj< Record< never, never > >;

/**
 * Default state — the period total over its trend sparkline.
 */
export const Default: Story = {
	render: renderTotalVisitors,
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderTotalVisitorsOnPreset( 'last-90-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'loading' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * The fetch failed with a permission-gated 403: neutral copy and no Retry
 * action, since retrying cannot clear a permission gate.
 */
export const Error: Story = {
	render: () => renderTotalVisitorsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'error' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * The fetch failed in a way that can heal — the proxy's `no_connection` 403: the
 * retryable copy with a Retry action, which re-runs the query (still mocked as
 * failing while this story is active).
 */
export const ErrorRetryable: Story = {
	render: () => renderTotalVisitorsOnPreset( 'last-12-months' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'error-retryable' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * Resolved with no buckets: the widget shows its empty state.
 */
export const Empty: Story = {
	render: () => renderTotalVisitorsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/visits', 'empty' );
		return () => setReportMockState( 'stats/visits', null );
	},
};

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {WidgetDashboardWithWidgetControls} dashboardArgs - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function TotalVisitorsDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TOTAL_VISITORS_RENDER_MODULE }
			renderComponent={ TotalVisitorsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( false ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <TotalVisitorsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
