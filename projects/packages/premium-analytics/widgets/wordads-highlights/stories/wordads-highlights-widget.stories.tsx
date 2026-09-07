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
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	forceWordAdsEarningsState,
	registerReportMocks,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import WordAdsHighlightsRender from '../render';
import widgetDefinition, {
	DEFAULT_WORDADS_EARNINGS_METRICS,
	type WordAdsEarningsMetricId,
} from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const WORDADS_HIGHLIGHTS_RENDER_MODULE = 'storybook/wordads-highlights';

// Carry the widget's metadata, including the metric-visibility attribute schema
// so the dashboard story's settings drawer renders the real checkboxes.
// `presentation` comes from widget.json ( 'framed' ), so the host frames the
// widget and renders its identity (title + icon).
const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

interface WordAdsHighlightsStoryControls {
	/**
	 * Earnings cards to show in the widget body.
	 */
	metrics: WordAdsEarningsMetricId[];
}

function renderWordAdsHighlights( { metrics }: WordAdsHighlightsStoryControls ) {
	return (
		<WordAdsHighlightsRender
			attributes={ {
				reportParams: getDefaultQueryParams(),
				metrics,
			} }
		/>
	);
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: DEFAULT_WORDADS_EARNINGS_METRICS,
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_WORDADS_EARNINGS_METRICS,
} as const;

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsHighlights',
	component: WordAdsHighlightsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "WordAds highlights" widget. Shows all-time WordAds payouts — total earnings, amount paid, and outstanding balance — as a grid of currency tiles (paid = earnings − outstanding). Ported from the Calypso WordAds "Totals" section. Which cards appear is controlled by the `metrics` attribute (`relevance: \'high\'`), exposed inline in the widget header and in the settings drawer. Data comes from the designated `useStatsWordAdsEarnings` hook; in Storybook it is served by `registerReportMocks()` (the `wordads/earnings` handler). The earnings module has no comparison period, so the tiles show bare amounts.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof WordAdsHighlightsRender > & WordAdsHighlightsStoryControls
>;

export default meta;

type Story = StoryObj< WordAdsHighlightsStoryControls >;

/**
 * The widget on its own, populated from the mocked wordads/earnings payload.
 */
export const Default: Story = {
	render: renderWordAdsHighlights,
	args: { ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderWordAdsHighlights,
	args: { ...ALL_METRICS_ARGS },
	// Off the shared autodocs page — path-keyed override; see forceWordAdsEarningsState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWordAdsEarningsState( 'loading' ),
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: renderWordAdsHighlights,
	args: { ...ALL_METRICS_ARGS },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWordAdsEarningsState( 'error' ),
};

/**
 * No card selected: the widget shows its empty state ("Select at least one
 * metric to display."). Unlike period-scoped widgets, WordAds earnings has no
 * data-driven empty — a zero balance is a valid `$0.00`, not an empty state — so
 * the empty state is reached by clearing the `metrics` attribute.
 */
export const Empty: Story = {
	render: renderWordAdsHighlights,
	args: { metrics: [] },
	decorators: [ withWidgetCanvas ],
};

interface WordAdsHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		WordAdsHighlightsStoryControls {}

function WordAdsHighlightsDashboardStory( {
	metrics,
	...dashboardArgs
}: WordAdsHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ WORDADS_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={ WordAdsHighlightsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( true ),
				metrics,
			} }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WordAdsHighlightsDashboardStoryProps > = {
	render: args => <WordAdsHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 1,
		widgetHeight: 1,
		...ALL_METRICS_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...METRIC_ARG_TYPES,
	},
};
