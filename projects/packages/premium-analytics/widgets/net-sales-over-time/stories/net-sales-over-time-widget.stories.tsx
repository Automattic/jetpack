import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import LineChart from '../../../../../js-packages/charts/src/charts/line-chart/line-chart';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import NetSalesOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const NET_SALES_OVER_TIME_RENDER_MODULE = 'storybook/net-sales-over-time';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;
// Static Storybook builds need this source import before ComparativeLineChart reads LineChart.Legend.
const ensureLineChartComposition = () => LineChart.Legend;

type NetSalesOverTimeWidgetProps = ComponentProps< typeof NetSalesOverTimeRender >;

interface NetSalesOverTimeStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type NetSalesOverTimeStoryProps = NetSalesOverTimeWidgetProps & NetSalesOverTimeStoryControls;

interface NetSalesOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		NetSalesOverTimeStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getNetSalesOverTimeAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): NetSalesOverTimeWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< NetSalesOverTimeStoryControls > ) {
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

function getNetSalesOverTimeSource( args: Partial< NetSalesOverTimeStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<NetSalesOverTimeRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderNetSalesOverTime( { withComparison, preset }: NetSalesOverTimeStoryControls ) {
	ensureLineChartComposition();

	return (
		<NetSalesOverTimeRender
			attributes={ getNetSalesOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

function NetSalesOverTimeDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: NetSalesOverTimeDashboardStoryProps ) {
	ensureLineChartComposition();

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ NET_SALES_OVER_TIME_RENDER_MODULE }
			renderComponent={ NetSalesOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getNetSalesOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/NetSalesOverTime',
	component: NetSalesOverTimeRender,
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
				component:
					'The "Net sales over time" widget. Fetches the orders report and displays net sales for the selected period with optional period-over-period comparison and a line chart.',
			},
		},
	},
} satisfies Meta< NetSalesOverTimeStoryProps >;

export default meta;

type Story = StoryObj< NetSalesOverTimeStoryControls >;
type DashboardStory = StoryObj< NetSalesOverTimeDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderNetSalesOverTime,
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
					storyContext: { args: Partial< NetSalesOverTimeStoryControls > }
				) => getNetSalesOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change and line chart data.
 */
export const WithComparison: Story = {
	render: renderNetSalesOverTime,
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
					storyContext: { args: Partial< NetSalesOverTimeStoryControls > }
				) => getNetSalesOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <NetSalesOverTimeDashboardStory { ...args } />,
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
\trenderModule="storybook/net-sales-over-time"
\trenderComponent={ NetSalesOverTimeRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
