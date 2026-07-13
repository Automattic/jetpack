/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import ClicksRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const CLICKS_RENDER_MODULE = 'storybook/clicks';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface ClicksStoryControls {
	withComparison: boolean;
}

interface ClicksDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		ClicksStoryControls {}

function renderClicksWidget( { withComparison }: ClicksStoryControls ) {
	return (
		<ClicksRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderClicksOnPreset( preset: PresetType ) {
	return (
		<ClicksRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

function ClicksDashboardStory( { withComparison, ...dashboardArgs }: ClicksDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ CLICKS_RENDER_MODULE }
			renderComponent={ ClicksRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Clicks',
	component: ClicksRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Clicks" widget. Shows the most-clicked external domains as a ranked leaderboard, using the global dashboard date range. Top-level rows drill down into clicked destination URLs when available.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof ClicksRender > & ClicksStoryControls >;

export default meta;

type Story = StoryObj< ClicksStoryControls >;
type DashboardStory = StoryObj< ClicksDashboardStoryProps >;

export const Default: Story = {
	render: renderClicksWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderClicksWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 *
 * Forced through `forceStatsMockState`: `stats/clicks` is answered by the legacy
 * stats mocks before the shared `setReportMockState` override can intercept it.
 */
export const Loading: Story = {
	render: () => renderClicksOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/clicks', 'loading' );
		return () => forceStatsMockState( 'stats/clicks', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderClicksOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/clicks', 'error' );
		return () => forceStatsMockState( 'stats/clicks', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral chart
 * glyph and "No clicks in this period.").
 */
export const Empty: Story = {
	render: () => renderClicksOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/clicks', 'empty' );
		return () => forceStatsMockState( 'stats/clicks', null );
	},
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <ClicksDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
};
