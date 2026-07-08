import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import LineChart from '../../../../../js-packages/charts/src/charts/line-chart/line-chart';
import TotalSalesOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TOTAL_SALES_OVER_TIME_RENDER_MODULE = 'storybook/total-sales-over-time';
// Static Storybook builds need this source import before ComparativeLineChart reads LineChart.Legend.
const ensureLineChartComposition = () => LineChart.Legend;
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type TotalSalesOverTimeWidgetProps = ComponentProps< typeof TotalSalesOverTimeRender >;

interface TotalSalesOverTimeStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type TotalSalesOverTimeStoryProps = TotalSalesOverTimeWidgetProps & TotalSalesOverTimeStoryControls;

interface TotalSalesOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TotalSalesOverTimeStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getTotalSalesOverTimeAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): TotalSalesOverTimeWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< TotalSalesOverTimeStoryControls > ) {
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

function getTotalSalesOverTimeSource( args: Partial< TotalSalesOverTimeStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<TotalSalesOverTimeRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderTotalSalesOverTime( { withComparison, preset }: TotalSalesOverTimeStoryControls ) {
	ensureLineChartComposition();

	return (
		<TotalSalesOverTimeRender
			attributes={ getTotalSalesOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

function TotalSalesOverTimeDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: TotalSalesOverTimeDashboardStoryProps ) {
	ensureLineChartComposition();

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ TOTAL_SALES_OVER_TIME_RENDER_MODULE }
			renderComponent={ TotalSalesOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison, preset ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TotalSalesOverTime',
	component: TotalSalesOverTimeRender,
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
				component: 'Dashboard widget that displays total sales over time for the selected period.',
			},
		},
	},
} satisfies Meta< TotalSalesOverTimeStoryProps >;

export default meta;

type Story = StoryObj< TotalSalesOverTimeStoryControls >;
type DashboardStory = StoryObj< TotalSalesOverTimeDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderTotalSalesOverTime,
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
					storyContext: { args: Partial< TotalSalesOverTimeStoryControls > }
				) => getTotalSalesOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change and line chart data.
 */
export const WithComparison: Story = {
	render: renderTotalSalesOverTime,
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
					storyContext: { args: Partial< TotalSalesOverTimeStoryControls > }
				) => getTotalSalesOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TotalSalesOverTimeDashboardStory { ...args } />,
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
\trenderModule="storybook/total-sales-over-time"
\trenderComponent={ TotalSalesOverTimeRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
