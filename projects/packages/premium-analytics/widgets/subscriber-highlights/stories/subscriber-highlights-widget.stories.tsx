/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SubscriberHighlightsRender from '../render';
import widgetDefinition, { DEFAULT_SUBSCRIBER_METRICS, type SubscriberMetricId } from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
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
	 * Metric tiles to show in the widget body.
	 */
	metrics: SubscriberMetricId[];
}

/**
 * Renders the data-connected widget with report params derived from the
 * comparison toggle and the selected metrics. The counts endpoint is not
 * period-scoped, so toggling comparison does not change what the widget shows
 * — it is wired through only to prove the widget renders unchanged when the
 * host injects comparison params.
 *
 * @param {SubscriberHighlightsStoryControls} props - Story controls.
 * @return The rendered widget.
 */
function renderSubscriberHighlights( {
	withComparison,
	metrics,
}: SubscriberHighlightsStoryControls ) {
	return (
		<SubscriberHighlightsRender
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				metrics,
			} }
		/>
	);
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: DEFAULT_SUBSCRIBER_METRICS,
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_SUBSCRIBER_METRICS,
} as const;

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
					'The "Subscriber highlights" widget. Shows current subscriber totals — total, paid, free, and social followers — as a grid of metric tiles. Which tiles appear is controlled by the `metrics` attribute (`relevance: \'high\'`), exposed inline in the widget header and in the settings drawer. Data comes from the designated `useStatsSubscribersCounts` hook; in Storybook it is served by `registerReportMocks()` (the `subscribers/counts` handler). The counts module has no comparison period, so the tiles show bare counts and the `WithComparison` story renders identically to `Default`.',
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

// The counts endpoint takes no params, so its query key is static and every
// story in this file shares one cache entry (a distinct date preset can't
// separate them — the query does not key on report params). Dropping the query
// on story enter and exit gives each forced-state story a fresh fetch, and
// clears a never-settling `loading` fetch before the other stories reuse the key.
function resetSubscribersCountsQuery() {
	queryClient.removeQueries( { queryKey: [ 'stats', 'subscribers-counts' ] } );
}

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderSubscriberHighlights,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		resetSubscribersCountsQuery();
		setReportMockState( 'subscribers/counts', 'loading' );
		return () => {
			setReportMockState( 'subscribers/counts', null );
			resetSubscribersCountsQuery();
		};
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: renderSubscriberHighlights,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		resetSubscribersCountsQuery();
		setReportMockState( 'subscribers/counts', 'error' );
		return () => {
			setReportMockState( 'subscribers/counts', null );
			resetSubscribersCountsQuery();
		};
	},
};

/**
 * Resolved without counts: the widget shows its empty state (the neutral
 * customer glyph and "No subscriber counts available yet.").
 */
export const Empty: Story = {
	render: renderSubscriberHighlights,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		resetSubscribersCountsQuery();
		setReportMockState( 'subscribers/counts', 'empty' );
		return () => {
			setReportMockState( 'subscribers/counts', null );
			resetSubscribersCountsQuery();
		};
	},
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
	metrics,
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
				metrics,
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
