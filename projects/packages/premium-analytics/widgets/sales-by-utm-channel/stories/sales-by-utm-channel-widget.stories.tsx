import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SalesByUtmChannelRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SALES_BY_UTM_CHANNEL_RENDER_MODULE = 'storybook/sales-by-utm-channel';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type SalesByUtmChannelWidgetProps = ComponentProps< typeof SalesByUtmChannelRender >;

interface SalesByUtmChannelStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type SalesByUtmChannelStoryProps = SalesByUtmChannelWidgetProps & SalesByUtmChannelStoryControls;

interface SalesByUtmChannelDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SalesByUtmChannelStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getSalesByUtmChannelAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): SalesByUtmChannelWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function renderSalesByUtmChannel( { withComparison, preset }: SalesByUtmChannelStoryControls ) {
	return (
		<SalesByUtmChannelRender
			attributes={ getSalesByUtmChannelAttributes( withComparison, preset ) }
		/>
	);
}

function SalesByUtmChannelDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: SalesByUtmChannelDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SALES_BY_UTM_CHANNEL_RENDER_MODULE }
			renderComponent={ SalesByUtmChannelRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getSalesByUtmChannelAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SalesByUtmChannel',
	component: SalesByUtmChannelRender,
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
					'Dashboard widget that displays top UTM channels by order revenue for the selected period.',
			},
		},
	},
} satisfies Meta< SalesByUtmChannelStoryProps >;

export default meta;

type Story = StoryObj< SalesByUtmChannelStoryControls >;
type DashboardStory = StoryObj< SalesByUtmChannelDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderSalesByUtmChannel,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison period enabled, showing period-over-period UTM channel changes.
 */
export const WithComparison: Story = {
	render: renderSalesByUtmChannel,
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
	render: args => <SalesByUtmChannelDashboardStory { ...args } />,
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
\trenderModule="storybook/sales-by-utm-channel"
\trenderComponent={ SalesByUtmChannelRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
