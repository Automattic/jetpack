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
import widgetDefinition, { DEFAULT_HIGHLIGHT_METRICS, type AnnualHighlightMetric } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const ANNUAL_HIGHLIGHTS_RENDER_MODULE = 'storybook/annual-highlights';

// Carry the widget's metadata, including the metric-visibility attribute schema
// so the dashboard story's settings drawer renders the real checkboxes.
// Presentation is left unset so the host frames the widget and renders its
// identity (title + icon), matching widget.json. The attribute schema is typed
// loosely on the widget definition, so it is cast to the WidgetType shape.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
};

interface AnnualHighlightsStoryControls {
	/**
	 * Whether to inject comparison report params.
	 */
	withComparison: boolean;
	/**
	 * Metric tiles to show in the widget body.
	 */
	metrics: AnnualHighlightMetric[];
}

/**
 * Renders the data-connected widget with report params derived from the
 * comparison toggle and the selected metrics. The insights endpoint is not
 * period-scoped, so toggling comparison does not change what the widget shows
 * — it is wired through only to prove the widget renders unchanged when the
 * host injects comparison params.
 *
 * @param {AnnualHighlightsStoryControls} props - Story controls.
 * @return The rendered widget.
 */
function renderAnnualHighlights( { withComparison, metrics }: AnnualHighlightsStoryControls ) {
	return (
		<AnnualHighlightsRender
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				metrics,
			} }
		/>
	);
}

const METRIC_OPTIONS = DEFAULT_HIGHLIGHT_METRICS.map( metric => ( {
	value: metric,
	label: metric.charAt( 0 ).toUpperCase() + metric.slice( 1 ),
} ) );

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: METRIC_OPTIONS.map( option => option.value ),
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_HIGHLIGHT_METRICS,
} as const;

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
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					"The \"Annual highlights\" widget. Shows one year's totals — posts, words, likes, and comments — as a grid of metric tiles, with year arrows to step through the years the site has published in. Which tiles appear is controlled by the `metrics` attribute (`relevance: 'high'`), exposed inline in the widget header and in the settings drawer. Data comes from the designated `useStatsInsights` hook; in Storybook it is served by `registerReportMocks()` (the `stats/insights` handler in `routeStatsReport`). The insights module has no comparison period, so the tiles show bare counts and the `WithComparison` story renders identically to `Default`.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof AnnualHighlightsRender > & AnnualHighlightsStoryControls >;

export default meta;

type Story = StoryObj< AnnualHighlightsStoryControls >;

/**
 * The widget on its own, populated from the mocked insights payload.
 */
export const Default: Story = {
	render: renderAnnualHighlights,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with comparison report params injected. The insights module has
 * no comparison data, so this renders identically to `Default` — it only
 * verifies the widget stays stable when the host provides comparison params.
 */
export const WithComparison: Story = {
	render: renderAnnualHighlights,
	args: { withComparison: true, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

interface AnnualHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AnnualHighlightsStoryControls {}

/**
 * Renders the real registered widget through the shared dashboard harness.
 *
 * @param {AnnualHighlightsDashboardStoryProps} props - Dashboard and widget controls.
 * @return The rendered dashboard with the widget.
 */
function AnnualHighlightsDashboardStory( {
	withComparison,
	metrics,
	...dashboardArgs
}: AnnualHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ ANNUAL_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={ AnnualHighlightsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				metrics,
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< AnnualHighlightsDashboardStoryProps > = {
	render: args => <AnnualHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 1,
		widgetHeight: 1,
		withComparison: true,
		...ALL_METRICS_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
};
