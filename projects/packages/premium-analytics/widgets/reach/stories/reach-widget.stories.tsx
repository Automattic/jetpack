/**
 * The Reach widget combines the WordPress.com and email follower totals (from
 * the proxied `stats/followers` endpoint) with each connected social service
 * (from `stats/publicize`) into a single ranked list. Both modules report
 * lifetime totals, so there is no comparison period: the `WithComparison` story
 * passes comparison `reportParams` but renders identically to `Default`. Data is
 * served in Storybook by `registerReportMocks()` (the `stats/followers` and
 * `stats/publicize` handlers).
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
import ReachRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const REACH_RENDER_MODULE = 'storybook/reach';

interface ReachStoryControls {
	/**
	 * Whether to inject comparison report params.
	 */
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with report params from the date range
 * picker. The follower and Publicize modules report lifetime totals, so toggling
 * comparison does not change what the widget shows — it is wired through only to
 * prove the widget renders unchanged when the host injects comparison params.
 *
 * @param {ReachStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderReach( { withComparison }: ReachStoryControls ) {
	return <ReachRender attributes={ { reportParams: getDefaultQueryParams( withComparison ) } } />;
}

// Close-up canvas so the leaderboard fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Reach',
	component: ReachRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Reach" widget ranks every subscriber channel — WordPress.com, Email, and each connected social (Publicize) service — by follower count. Data comes from the `useStatsFollowers` and `useStatsPublicize` hooks; in Storybook it is served by `registerReportMocks()`. These modules report lifetime totals, so there is no comparison period and the `WithComparison` story renders identically to `Default`.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof ReachRender > & ReachStoryControls >;

export default meta;

type Story = StoryObj< ReachStoryControls >;

/**
 * Default — the ranked subscriber channels, populated from the mocked followers
 * and Publicize payloads.
 */
export const Default: Story = {
	render: renderReach,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * WithComparison — comparison `reportParams` are supplied by the date range
 * picker, but these modules have no comparison data, so the widget renders
 * identically to `Default` (no deltas).
 */
export const WithComparison: Story = {
	render: renderReach,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface ReachDashboardStoryProps extends WidgetDashboardWithWidgetControls, ReachStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {ReachDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function ReachDashboardStory( { withComparison, ...dashboardArgs }: ReachDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ REACH_RENDER_MODULE }
			renderComponent={ ReachRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< ReachDashboardStoryProps > = {
	render: args => <ReachDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 1,
		widgetHeight: 2,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
