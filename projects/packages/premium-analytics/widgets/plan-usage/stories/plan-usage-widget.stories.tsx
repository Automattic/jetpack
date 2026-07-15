/**
 * All stories render the data-connected widget through `WidgetRoot`, so they
 * need report data to resolve against. `registerReportMocks` covers the shared
 * paths, including the `jetpack-stats/usage` fixture wired into the
 * report-mocks middleware. The usage endpoint is a point-in-time reading with no
 * comparison period, so `WithComparison` renders identically to `Default` even
 * though comparison report params are supplied. The Loading / Error /
 * Unavailable stories force the request into each state via
 * `setReportMockState`.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { mockPlanUsageOverLimitData } from '../../../packages/widgets-toolkit/src/stories/mocks/data';
import {
	registerReportMocks,
	setReportMockResponse,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import PlanUsageRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// The upgrade note builds its purchase URL from `window.JetpackScriptData`,
// which only wp-admin provides; seed the fields it reads so the "Upgrade now"
// link resolves in Storybook too.
window.JetpackScriptData = {
	...window.JetpackScriptData,
	site: {
		...window.JetpackScriptData?.site,
		admin_url: 'https://example.com/wp-admin/',
		wpcom: { blog_id: 123456789 },
	},
} as typeof window.JetpackScriptData;

const PLAN_USAGE_RENDER_MODULE = 'storybook/plan-usage';

/**
 * Puts the plan-usage request into a forced state for a story's lifetime.
 *
 * The usage endpoint takes no report params, so its query key is static — the
 * per-story date-preset trick other widgets use to isolate forced-state stories
 * doesn't apply. Instead, drop the cached entry from the shared query client on
 * both enter and cleanup, so this story fetches fresh (hitting the forced mock)
 * and the sibling stories refetch their success response afterwards.
 *
 * @param state - The forced mock state for the plan-usage endpoint.
 * @return A `beforeEach` implementation returning its cleanup.
 */
function forcePlanUsageState( state: 'loading' | 'error' | 'empty' ) {
	return () => {
		setReportMockState( 'jetpack-stats/usage', state );
		queryClient.removeQueries( { queryKey: [ 'stats-app', 'plan-usage' ] } );
		return () => {
			setReportMockState( 'jetpack-stats/usage', null );
			queryClient.removeQueries( { queryKey: [ 'stats-app', 'plan-usage' ] } );
		};
	};
}

/**
 * Forces the plan-usage request to resolve with the over-limit reading for a
 * story's lifetime, optionally seeding a VIP `host` so the story shows the
 * over-limit warning being suppressed. Drops the cached usage entry on enter and
 * cleanup (the query key is static — see `forcePlanUsageState`) and restores the
 * script data `host` afterwards.
 *
 * @param options     - Story options.
 * @param options.vip - Whether to seed `site.host = 'vip'` for the story.
 * @return A `beforeEach` implementation returning its cleanup.
 */
function forcePlanUsageOverLimit( { vip }: { vip: boolean } ) {
	return () => {
		setReportMockResponse( 'jetpack-stats/usage', mockPlanUsageOverLimitData );
		if ( vip ) {
			window.JetpackScriptData.site.host = 'vip';
		}
		queryClient.removeQueries( { queryKey: [ 'stats-app', 'plan-usage' ] } );
		return () => {
			setReportMockResponse( 'jetpack-stats/usage', null );
			if ( vip ) {
				delete window.JetpackScriptData.site.host;
			}
			queryClient.removeQueries( { queryKey: [ 'stats-app', 'plan-usage' ] } );
		};
	};
}

/**
 * Story controls. `withComparison` toggles the comparison report params to
 * confirm the widget renders identically — the usage endpoint has no comparison
 * period.
 */
interface PlanUsageStoryControls {
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with the given comparison state.
 *
 * @param {PlanUsageStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderPlanUsage( { withComparison }: PlanUsageStoryControls ) {
	return (
		<PlanUsageRender attributes={ { reportParams: getDefaultQueryParams( withComparison ) } } />
	);
}

// Close-up canvas so the gauge fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '360px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PlanUsage',
	component: PlanUsageRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Plan usage" widget. Shows billable views used in the current billing cycle against the plan\'s limit as a horizontal usage meter — figures and days-until-reset inside the bar, an upgrade note below it — following the Stats "Plan usage" section. The usage endpoint is a point-in-time reading with no date range or comparison period.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof PlanUsageRender > & PlanUsageStoryControls >;

export default meta;

type Story = StoryObj< PlanUsageStoryControls >;

/**
 * Default state — the current-cycle usage gauge.
 */
export const Default: Story = {
	render: renderPlanUsage,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison state — comparison report params are supplied, but the usage
 * endpoint has no comparison data, so this renders identically to Default.
 */
export const WithComparison: Story = {
	render: renderPlanUsage,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			description: {
				story:
					'The usage endpoint has no comparison period, so this renders identically to Default even when comparison report params are supplied.',
			},
		},
	},
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderPlanUsage,
	args: { withComparison: false },
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forcePlanUsageState( 'loading' ),
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: renderPlanUsage,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forcePlanUsageState( 'error' ),
};

/**
 * Resolved without a usable limit — the forced empty response carries no
 * `views_limit`, the same shape legacy or unplanned sites report — so the widget
 * shows its unavailable state (the neutral percent glyph and "Plan usage isn't
 * available for your current plan.").
 */
export const Unavailable: Story = {
	render: renderPlanUsage,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forcePlanUsageState( 'empty' ),
};

/**
 * Over-limit state — usage has exceeded the limit for two consecutive cycles, so
 * the meter fills red and the bold over-limit warning precedes the upgrade note.
 */
export const OverLimit: Story = {
	render: renderPlanUsage,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forcePlanUsageOverLimit( { vip: false } ),
};

/**
 * Over-limit on a VIP site — the same over-limit reading, but `site.host` is
 * `'vip'`, so the over-limit warning is suppressed (matching the Stats "Plan
 * usage" section). The red fill remains; only the warning is gone.
 */
export const OverLimitVip: Story = {
	render: renderPlanUsage,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forcePlanUsageOverLimit( { vip: true } ),
};

interface PlanUsageDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PlanUsageStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {PlanUsageDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function PlanUsageDashboardStory( {
	withComparison,
	...dashboardArgs
}: PlanUsageDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ PLAN_USAGE_RENDER_MODULE }
			renderComponent={ PlanUsageRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< PlanUsageDashboardStoryProps > = {
	render: args => <PlanUsageDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
