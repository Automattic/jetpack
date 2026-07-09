/**
 * All three stories render the data-connected widget through `WidgetRoot`, so
 * they need report data to resolve against. `registerReportMocks` covers the
 * shared paths, including the `jetpack-stats/usage` fixture wired into the
 * report-mocks middleware. The usage endpoint is a point-in-time reading with no
 * comparison period, so `WithComparison` renders identically to `Default` even
 * though comparison report params are supplied.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
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
			widgetType={ {
				name: widgetDefinition.name,
				title: widgetDefinition.title,
				icon: widgetDefinition.icon,
				help: widgetDefinition.help,
				presentation: 'framed',
			} }
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
