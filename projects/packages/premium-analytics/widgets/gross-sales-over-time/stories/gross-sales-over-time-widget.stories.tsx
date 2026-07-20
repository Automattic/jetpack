import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import LineChart from '../../../../../js-packages/charts/src/charts/line-chart/line-chart';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import GrossSalesOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const GROSS_SALES_OVER_TIME_RENDER_MODULE = 'storybook/gross-sales-over-time';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;
// Static Storybook builds need this source import before ComparativeLineChart reads LineChart.Legend.
const ensureLineChartComposition = () => LineChart.Legend;

type GrossSalesOverTimeWidgetProps = ComponentProps< typeof GrossSalesOverTimeRender >;

interface GrossSalesOverTimeStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type GrossSalesOverTimeStoryProps = GrossSalesOverTimeWidgetProps & GrossSalesOverTimeStoryControls;

interface GrossSalesOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		GrossSalesOverTimeStoryControls {}

function getGrossSalesOverTimeAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): GrossSalesOverTimeWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< GrossSalesOverTimeStoryControls > ) {
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

function getGrossSalesOverTimeSource( args: Partial< GrossSalesOverTimeStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<GrossSalesOverTimeRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderGrossSalesOverTime( { withComparison, preset }: GrossSalesOverTimeStoryControls ) {
	ensureLineChartComposition();

	return (
		<GrossSalesOverTimeRender
			attributes={ getGrossSalesOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderGrossSalesOverTimeOnPreset( preset: SelectablePresetId ) {
	ensureLineChartComposition();

	return (
		<GrossSalesOverTimeRender attributes={ getGrossSalesOverTimeAttributes( false, preset ) } />
	);
}

function GrossSalesOverTimeDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: GrossSalesOverTimeDashboardStoryProps ) {
	ensureLineChartComposition();

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ GROSS_SALES_OVER_TIME_RENDER_MODULE }
			renderComponent={ GrossSalesOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getGrossSalesOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/GrossSalesOverTime',
	component: GrossSalesOverTimeRender,
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
	},
	parameters: {
		docs: {
			description: {
				component: 'Dashboard widget that displays gross sales over time for the selected period.',
			},
		},
	},
} satisfies Meta< GrossSalesOverTimeStoryProps >;

export default meta;

type Story = StoryObj< GrossSalesOverTimeStoryControls >;
type DashboardStory = StoryObj< GrossSalesOverTimeDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderGrossSalesOverTime,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< GrossSalesOverTimeStoryControls > }
				) => getGrossSalesOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change and line chart data.
 */
export const WithComparison: Story = {
	render: renderGrossSalesOverTime,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< GrossSalesOverTimeStoryControls > }
				) => getGrossSalesOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderGrossSalesOverTimeOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'orders/by-date', 'loading' );
		return () => setReportMockState( 'orders/by-date', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderGrossSalesOverTimeOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'orders/by-date', 'error' );
		return () => setReportMockState( 'orders/by-date', null );
	},
};

/**
 * Resolved with no gross sales data: the widget shows its empty state ("No sales
 * in this period.").
 */
export const Empty: Story = {
	render: () => renderGrossSalesOverTimeOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'orders/by-date', 'empty' );
		return () => setReportMockState( 'orders/by-date', null );
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <GrossSalesOverTimeDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		preset: DEFAULT_PRESET,
		withComparison: true,
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
	},
	parameters: {
		docs: {
			source: {
				code: `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<WidgetDashboardWithWidget
\twidgetType={ widgetDefinition }
\trenderModule="storybook/gross-sales-over-time"
\trenderComponent={ GrossSalesOverTimeRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
