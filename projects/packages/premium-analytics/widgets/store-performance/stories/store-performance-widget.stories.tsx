import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import LineChart from '../../../../../js-packages/charts/src/charts/line-chart/line-chart';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import { DEFAULT_STORE_PERFORMANCE_METRICS, type StorePerformanceMetricId } from '../metrics';
import StorePerformanceRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const STORE_PERFORMANCE_RENDER_MODULE = 'storybook/store-performance';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;
// Static Storybook builds need this source import before ComparativeLineChart reads LineChart.Legend.
const ensureLineChartComposition = () => LineChart.Legend;

// Carry the widget's metadata, including the metric-visibility attribute schema
// so the dashboard story's settings drawer renders the real checkboxes.
// Presentation is left unset so the host frames the widget and renders its
// identity (title + icon), matching widget.json. The attribute schema is typed
// loosely on the widget definition, so it is cast to the WidgetType shape.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	help: widgetDefinition.help,
	icon: widgetDefinition.icon,
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
};

type StorePerformanceRenderProps = ComponentProps< typeof StorePerformanceRender >;

interface StorePerformanceStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
	metrics: StorePerformanceMetricId[];
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: DEFAULT_STORE_PERFORMANCE_METRICS,
		description: 'Store metrics to show as selectable tabs in the widget body.',
	},
} as const;

type StorePerformanceStoryProps = StorePerformanceRenderProps & StorePerformanceStoryControls;

interface StorePerformanceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		StorePerformanceStoryControls {}

function getStorePerformanceAttributes( {
	withComparison = false,
	preset = DEFAULT_PRESET,
	metrics = DEFAULT_STORE_PERFORMANCE_METRICS,
}: Partial< StorePerformanceStoryControls > ): StorePerformanceRenderProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
		metrics,
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< StorePerformanceStoryControls > ) {
	const hasComparison = Boolean( withComparison );
	const storyPreset = preset ?? DEFAULT_PRESET;

	if ( ! hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams()';
	}

	if ( hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams( true )';
	}

	return `getDefaultQueryParams( ${ hasComparison ? 'true' : 'false' }, '${ storyPreset }' )`;
}

function getMetricsSource(
	metrics: StorePerformanceMetricId[] = DEFAULT_STORE_PERFORMANCE_METRICS
) {
	return `[ ${ metrics.map( metric => `'${ metric }'` ).join( ', ' ) } ]`;
}

function getStorePerformanceSource( args: Partial< StorePerformanceStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<StorePerformanceRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t\tmetrics: ${ getMetricsSource( args.metrics ) },
\t} }
/>`;
}

function renderStorePerformance( {
	withComparison,
	preset,
	metrics,
}: StorePerformanceStoryControls ) {
	ensureLineChartComposition();

	return (
		<StorePerformanceRender
			attributes={ getStorePerformanceAttributes( { withComparison, preset, metrics } ) }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderStorePerformanceOnPreset(
	preset: SelectablePresetId,
	metrics: StorePerformanceMetricId[] = DEFAULT_STORE_PERFORMANCE_METRICS
) {
	ensureLineChartComposition();

	return (
		<StorePerformanceRender
			attributes={ getStorePerformanceAttributes( { withComparison: false, preset, metrics } ) }
		/>
	);
}

// Every report endpoint behind the widget's default metrics (net sales/orders,
// bookings, visitors, conversion rate, customers). State stories force all of
// them so no metric report resolves with data.
const STORE_PERFORMANCE_ENDPOINTS = [
	'orders/by-date',
	'orders-by-product-type/by-date',
	'sessions/by-date',
	'sessions/by-conversion-rate',
	'customers/by-date',
] as const;

function setAllReportMockStates( state: 'loading' | 'error' | null ) {
	STORE_PERFORMANCE_ENDPOINTS.forEach( endpoint => setReportMockState( endpoint, state ) );
}

function StorePerformanceDashboardStory( {
	withComparison,
	preset,
	metrics,
	...dashboardStoryArgs
}: StorePerformanceDashboardStoryProps ) {
	ensureLineChartComposition();

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ storyWidgetType }
			renderModule={ STORE_PERFORMANCE_RENDER_MODULE }
			renderComponent={ StorePerformanceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getStorePerformanceAttributes( { withComparison, preset, metrics } ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/StorePerformance',
	component: StorePerformanceRender,
	tags: [ 'autodocs' ],
	argTypes: {
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					"Dashboard widget that displays key store performance metrics at a glance. Which metrics render as tabs is controlled by the `metrics` attribute (`relevance: 'high'`), exposed inline in the widget header and in the settings drawer.",
			},
		},
	},
} satisfies Meta< StorePerformanceStoryProps >;

export default meta;

type Story = StoryObj< StorePerformanceStoryControls >;
type DashboardStory = StoryObj< StorePerformanceDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderStorePerformance,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
		metrics: DEFAULT_STORE_PERFORMANCE_METRICS,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< StorePerformanceStoryControls > }
				) => getStorePerformanceSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period changes and chart data.
 */
export const WithComparison: Story = {
	render: renderStorePerformance,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: true,
		metrics: DEFAULT_STORE_PERFORMANCE_METRICS,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< StorePerformanceStoryControls > }
				) => getStorePerformanceSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: every metric report is in flight, so the widget shows its loading
 * state. The mocks are forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderStorePerformanceOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setAllReportMockStates( 'loading' );
		return () => setAllReportMockStates( null );
	},
};

/**
 * Every metric report failed: the widget shows its error state with a Retry
 * action (which re-runs all queries — still mocked as failing while this story
 * is active).
 */
export const Error: Story = {
	render: () => renderStorePerformanceOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setAllReportMockStates( 'error' );
		return () => setAllReportMockStates( null );
	},
};

/**
 * No metrics selected: the widget has no tabs to show, so it renders its empty
 * state before fetching reports.
 */
export const Empty: Story = {
	render: () => renderStorePerformanceOnPreset( 'last-365-days', [] ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <StorePerformanceDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		preset: DEFAULT_PRESET,
		withComparison: true,
		metrics: DEFAULT_STORE_PERFORMANCE_METRICS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			source: {
				code: `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<WidgetDashboardWithWidget
\twidgetType={ widgetDefinition }
\trenderModule="storybook/store-performance"
\trenderComponent={ StorePerformanceRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t\tmetrics: ${ getMetricsSource() },
\t} }
/>`,
			},
		},
	},
};
