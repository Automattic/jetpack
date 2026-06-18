import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { DEFAULT_METRICS } from '@jetpack-premium-analytics/widgets-toolkit';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import LineChart from '../../../../../js-packages/charts/src/charts/line-chart/line-chart';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import StorePerformanceRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const STORE_PERFORMANCE_RENDER_MODULE = 'storybook/store-performance';
// Static Storybook builds need this source import before ComparativeLineChart reads LineChart.Legend.
const ensureLineChartComposition = () => LineChart.Legend;

interface StorePerformanceDashboardStoryProps extends WidgetDashboardWithWidgetControls {
	withComparison: boolean;
}

function StorePerformanceDashboardStory( {
	withComparison,
	...dashboardStoryArgs
}: StorePerformanceDashboardStoryProps ) {
	ensureLineChartComposition();

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ STORE_PERFORMANCE_RENDER_MODULE }
			renderComponent={ StorePerformanceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
				metrics: DEFAULT_METRICS,
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/StorePerformance',
	component: StorePerformanceDashboardStory,
	tags: [ 'autodocs' ],
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
		},
	},
	parameters: {
		docs: {
			description: {
				component: 'Dashboard widget that displays key store performance metrics at a glance.',
			},
		},
	},
} satisfies Meta< typeof StorePerformanceDashboardStory >;

export default meta;

type Story = StoryObj< typeof meta >;

export const WidgetDashboardWithWidget: Story = {};
