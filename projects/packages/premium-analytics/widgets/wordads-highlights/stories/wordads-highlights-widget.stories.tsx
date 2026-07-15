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
import WordAdsHighlightsRender from '../render';
import widgetDefinition, {
	DEFAULT_WORDADS_EARNINGS_METRICS,
	type WordAdsEarningsMetricId,
} from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const WORDADS_HIGHLIGHTS_RENDER_MODULE = 'storybook/wordads-highlights';

// Carry the widget's metadata, including the metric-visibility attribute schema
// so the dashboard story's settings drawer renders the real checkboxes.
// Presentation is left unset so the host frames the widget and renders its
// identity (title + icon), matching widget.json.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	help: widgetDefinition.help,
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
};

interface WordAdsHighlightsStoryControls {
	/**
	 * Whether to inject comparison report params.
	 */
	withComparison: boolean;
	/**
	 * Earnings cards to show in the widget body.
	 */
	metrics: WordAdsEarningsMetricId[];
}

/**
 * Renders the data-connected widget with report params derived from the
 * comparison toggle and the selected metrics. The earnings endpoint is not
 * period-scoped, so toggling comparison does not change what the widget shows
 * — it is wired through only to prove the widget renders unchanged when the
 * host injects comparison params.
 *
 * @param {WordAdsHighlightsStoryControls} props - Story controls.
 * @return The rendered widget.
 */
function renderWordAdsHighlights( { withComparison, metrics }: WordAdsHighlightsStoryControls ) {
	return (
		<WordAdsHighlightsRender
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
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "WordAds highlights" widget. Shows all-time WordAds payouts — total earnings, amount paid, and outstanding balance — as a grid of currency tiles (paid = earnings − outstanding). Ported from the Calypso WordAds "Totals" section. Which cards appear is controlled by the `metrics` attribute (`relevance: \'high\'`), exposed inline in the widget header and in the settings drawer. Data comes from the designated `useStatsWordAdsEarnings` hook; in Storybook it is served by `registerReportMocks()` (the `wordads/earnings` handler). The earnings module has no comparison period, so the tiles show bare amounts and the `WithComparison` story renders identically to `Default`.',
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
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with comparison report params injected. The earnings module has
 * no comparison data, so this renders identically to `Default` — it only
 * verifies the widget stays stable when the host provides comparison params.
 */
export const WithComparison: Story = {
	render: renderWordAdsHighlights,
	args: { withComparison: true, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

// The earnings endpoint takes no params, so its query key is static and every
// story in this file shares one cache entry (a distinct date preset can't
// separate them — the query does not key on report params). Dropping the query
// on story enter and exit gives each forced-state story a fresh fetch, and
// clears a never-settling `loading` fetch before the other stories reuse the key.
function resetWordAdsEarningsQuery() {
	queryClient.removeQueries( { queryKey: [ 'stats', 'wordads-earnings' ] } );
}

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderWordAdsHighlights,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		resetWordAdsEarningsQuery();
		setReportMockState( 'wordads/earnings', 'loading' );
		return () => {
			setReportMockState( 'wordads/earnings', null );
			resetWordAdsEarningsQuery();
		};
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: renderWordAdsHighlights,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		resetWordAdsEarningsQuery();
		setReportMockState( 'wordads/earnings', 'error' );
		return () => {
			setReportMockState( 'wordads/earnings', null );
			resetWordAdsEarningsQuery();
		};
	},
};

/**
 * No card selected: the widget shows its empty state ("Select at least one
 * metric to display."). Unlike period-scoped widgets, WordAds earnings has no
 * data-driven empty — a zero balance is a valid `$0.00`, not an empty state — so
 * the empty state is reached by clearing the `metrics` attribute.
 */
export const Empty: Story = {
	render: renderWordAdsHighlights,
	args: { withComparison: false, metrics: [] },
	decorators: [ withWidgetCanvas ],
};

interface WordAdsHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		WordAdsHighlightsStoryControls {}

/**
 * Renders the real registered widget through the shared dashboard harness.
 *
 * @param {WordAdsHighlightsDashboardStoryProps} props - Dashboard and widget controls.
 * @return The rendered dashboard with the widget.
 */
function WordAdsHighlightsDashboardStory( {
	withComparison,
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
				reportParams: getDefaultQueryParams( withComparison ),
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
		withComparison: true,
		...ALL_METRICS_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
};
