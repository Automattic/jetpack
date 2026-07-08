import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import TotalReturnsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TOTAL_RETURNS_RENDER_MODULE = 'storybook/total-returns';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type TotalReturnsWidgetProps = ComponentProps< typeof TotalReturnsRender >;
const noopSetError: TotalReturnsWidgetProps[ 'setError' ] = () => undefined;

interface TotalReturnsStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type TotalReturnsStoryProps = TotalReturnsWidgetProps & TotalReturnsStoryControls;

interface TotalReturnsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TotalReturnsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getTotalReturnsAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): TotalReturnsWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function renderTotalReturns( { withComparison, preset }: TotalReturnsStoryControls ) {
	return (
		<TotalReturnsRender
			attributes={ getTotalReturnsAttributes( withComparison, preset ) }
			setError={ noopSetError }
		/>
	);
}

function TotalReturnsDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: TotalReturnsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ TOTAL_RETURNS_RENDER_MODULE }
			renderComponent={ TotalReturnsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getTotalReturnsAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TotalReturns',
	component: TotalReturnsRender,
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
				component: 'Dashboard widget that displays refunds and net sales for the selected period.',
			},
		},
	},
} satisfies Meta< TotalReturnsStoryProps >;

export default meta;

type Story = StoryObj< TotalReturnsStoryControls >;
type DashboardStory = StoryObj< TotalReturnsDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderTotalReturns,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison period enabled, showing period-over-period change data.
 */
export const WithComparison: Story = {
	render: renderTotalReturns,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TotalReturnsDashboardStory { ...args } />,
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
};
