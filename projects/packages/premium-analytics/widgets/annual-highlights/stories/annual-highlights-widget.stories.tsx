/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AnnualHighlightsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const ANNUAL_HIGHLIGHTS_RENDER_MODULE = 'storybook/annual-highlights';

interface AnnualHighlightsStoryControls {
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with report params derived from the
 * comparison toggle. The insights endpoint is not period-scoped, so toggling
 * comparison does not change what the widget shows — it is wired through only to
 * prove the widget renders unchanged when the host injects comparison params.
 *
 * @param props                - Story controls.
 * @param props.withComparison - Whether to inject comparison report params.
 * @return The rendered widget.
 */
function renderAnnualHighlights( { withComparison }: AnnualHighlightsStoryControls ) {
	return (
		<AnnualHighlightsRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the grid fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AnnualHighlights',
	component: AnnualHighlightsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Annual highlights" widget. Shows the most recent year\'s totals — posts, words, likes, comments, and images — as a grid of metric tiles. Data comes from the designated `useStatsInsights` hook; in Storybook it is served by `registerReportMocks()` (the `stats/insights` handler in `routeStatsReport`). The insights module has no comparison period, so the tiles show bare counts and the `WithComparison` story renders identically to `Default`.',
			},
		},
	},
} satisfies Meta< AnnualHighlightsStoryControls >;

export default meta;

type Story = StoryObj< AnnualHighlightsStoryControls >;

/**
 * The widget on its own, populated from the mocked insights payload.
 */
export const Default: Story = {
	render: renderAnnualHighlights,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with comparison report params injected. The insights module has
 * no comparison data, so this renders identically to `Default` — it only
 * verifies the widget stays stable when the host provides comparison params.
 */
export const WithComparison: Story = {
	render: renderAnnualHighlights,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface AnnualHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AnnualHighlightsStoryControls {}

/**
 * Renders the real registered widget through the shared dashboard harness.
 *
 * @param props                - Dashboard and widget controls.
 * @param props.withComparison - Whether to inject comparison report params.
 * @return The rendered dashboard with the widget.
 */
function AnnualHighlightsDashboardStory( {
	withComparison,
	...dashboardArgs
}: AnnualHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ ANNUAL_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={ AnnualHighlightsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< AnnualHighlightsDashboardStoryProps > = {
	render: args => <AnnualHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
