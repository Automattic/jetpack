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
import SubscriberHighlightsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SUBSCRIBER_HIGHLIGHTS_RENDER_MODULE = 'storybook/subscriber-highlights';

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

interface SubscriberHighlightsStoryControls {
	/**
	 * Whether to inject comparison report params.
	 */
	withComparison: boolean;
	/**
	 * Whether the Total subscribers tile is shown.
	 */
	showTotal: boolean;
	/**
	 * Whether the Paid subscribers tile is shown.
	 */
	showPaid: boolean;
	/**
	 * Whether the Free subscribers tile is shown.
	 */
	showFree: boolean;
	/**
	 * Whether the Social followers tile is shown.
	 */
	showSocial: boolean;
}

/**
 * Renders the data-connected widget with report params derived from the
 * comparison toggle and the per-metric visibility toggles. The counts endpoint
 * is not period-scoped, so toggling comparison does not change what the widget
 * shows — it is wired through only to prove the widget renders unchanged when the
 * host injects comparison params. The metric toggles mirror the widget's
 * checkbox settings and hide/show the matching tile.
 *
 * @param {SubscriberHighlightsStoryControls} props - Story controls.
 * @return The rendered widget.
 */
function renderSubscriberHighlights( {
	withComparison,
	showTotal,
	showPaid,
	showFree,
	showSocial,
}: SubscriberHighlightsStoryControls ) {
	return (
		<SubscriberHighlightsRender
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				showTotal,
				showPaid,
				showFree,
				showSocial,
			} }
		/>
	);
}

const METRIC_ARG_TYPES = {
	showTotal: { control: 'boolean' },
	showPaid: { control: 'boolean' },
	showFree: { control: 'boolean' },
	showSocial: { control: 'boolean' },
} as const;

const ALL_METRICS_ARGS = {
	showTotal: true,
	showPaid: true,
	showFree: true,
	showSocial: true,
} as const;

// Close-up canvas so the grid fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SubscriberHighlights',
	component: SubscriberHighlightsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Subscriber highlights" widget. Shows current subscriber totals — total, paid, free, and social followers — as a grid of metric tiles. Each metric tile can be toggled off via the widget\'s checkbox settings (the `show*` controls here). Data comes from the designated `useStatsSubscribersCounts` hook; in Storybook it is served by `registerReportMocks()` (the `subscribers/counts` handler). The counts module has no comparison period, so the tiles show bare counts and the `WithComparison` story renders identically to `Default`.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof SubscriberHighlightsRender > & SubscriberHighlightsStoryControls
>;

export default meta;

type Story = StoryObj< SubscriberHighlightsStoryControls >;

/**
 * The widget on its own, populated from the mocked subscribers/counts payload.
 */
export const Default: Story = {
	render: renderSubscriberHighlights,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with comparison report params injected. The counts module has no
 * comparison data, so this renders identically to `Default` — it only verifies
 * the widget stays stable when the host provides comparison params.
 */
export const WithComparison: Story = {
	render: renderSubscriberHighlights,
	args: { withComparison: true, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

interface SubscriberHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SubscriberHighlightsStoryControls {}

/**
 * Renders the real registered widget through the shared dashboard harness.
 *
 * @param {SubscriberHighlightsDashboardStoryProps} props - Dashboard and widget controls.
 * @return The rendered dashboard with the widget.
 */
function SubscriberHighlightsDashboardStory( {
	withComparison,
	showTotal,
	showPaid,
	showFree,
	showSocial,
	...dashboardArgs
}: SubscriberHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SUBSCRIBER_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={
				SubscriberHighlightsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				showTotal,
				showPaid,
				showFree,
				showSocial,
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< SubscriberHighlightsDashboardStoryProps > = {
	render: args => <SubscriberHighlightsDashboardStory { ...args } />,
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
