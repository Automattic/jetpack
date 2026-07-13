import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import UtmInsightsRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const UTM_INSIGHTS_RENDER_MODULE = 'storybook/utm-insights';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface UtmInsightsStoryControls {
	withComparison: boolean;
}

interface UtmInsightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		UtmInsightsStoryControls {}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/UtmInsights',
	component: UtmInsightsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "UTM Insights" widget. Shows traffic breakdown by UTM parameter as a ranked leaderboard. The active dimension (Source/Medium, Campaign, etc.) is switched via a dropdown in the widget header and persisted per widget instance.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof UtmInsightsRender > & UtmInsightsStoryControls >;

export default meta;

type Story = StoryObj< UtmInsightsStoryControls >;
type DashboardStory = StoryObj< UtmInsightsDashboardStoryProps >;

// Default close-up — Source / Medium breakdown.
export const Default: Story = {
	render: ( { withComparison } ) => (
		<UtmInsightsRender
			attributes={ {
				utmDimension: 'utm_source,utm_medium',
				max: 10,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	),
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: ( { withComparison } ) => (
		<UtmInsightsRender
			attributes={ {
				utmDimension: 'utm_source,utm_medium',
				max: 10,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	),
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderUtmInsightsOnPreset( preset: PresetType ) {
	return (
		<UtmInsightsRender
			attributes={ {
				utmDimension: 'utm_source,utm_medium',
				max: 10,
				reportParams: getDefaultQueryParams( false, preset ),
			} }
		/>
	);
}

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderUtmInsightsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/utm', 'loading' );
		return () => forceStatsMockState( 'stats/utm', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderUtmInsightsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/utm', 'error' );
		return () => forceStatsMockState( 'stats/utm', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral megaphone
 * glyph and "No UTM data in this period.").
 */
export const Empty: Story = {
	render: () => renderUtmInsightsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/utm', 'empty' );
		return () => forceStatsMockState( 'stats/utm', null );
	},
};

// Alternative close-up showing the Campaign dimension.
export const ByCampaign: Story = {
	render: ( { withComparison } ) => (
		<UtmInsightsRender
			attributes={ {
				utmDimension: 'utm_campaign',
				max: 10,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	),
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

// Full dashboard story — mounts the real WidgetDashboard so the widget renders
// exactly as it does in product (size / edit-mode / host-environment controls).
function UtmInsightsDashboardStory( {
	withComparison,
	...dashboardArgs
}: UtmInsightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ UTM_INSIGHTS_RENDER_MODULE }
			renderComponent={ UtmInsightsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				utmDimension: 'utm_source,utm_medium',
				max: 10,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <UtmInsightsDashboardStory { ...args } />,
	args: { ...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS, withComparison: false },
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
};
