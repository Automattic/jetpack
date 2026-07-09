import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import OrdersFulfillmentRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const ORDERS_FULFILLMENT_RENDER_MODULE = 'storybook/orders-fulfillment';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type OrdersFulfillmentWidgetProps = ComponentProps< typeof OrdersFulfillmentRender >;

interface OrdersFulfillmentStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type OrdersFulfillmentStoryProps = OrdersFulfillmentWidgetProps & OrdersFulfillmentStoryControls;

interface OrdersFulfillmentDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		OrdersFulfillmentStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getOrdersFulfillmentAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): OrdersFulfillmentWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< OrdersFulfillmentStoryControls > ) {
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

function getOrdersFulfillmentSource( args: Partial< OrdersFulfillmentStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<OrdersFulfillmentRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderOrdersFulfillment( { withComparison, preset }: OrdersFulfillmentStoryControls ) {
	return (
		<OrdersFulfillmentRender
			attributes={ getOrdersFulfillmentAttributes( withComparison, preset ) }
		/>
	);
}

function OrdersFulfillmentDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: OrdersFulfillmentDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ ORDERS_FULFILLMENT_RENDER_MODULE }
			renderComponent={ OrdersFulfillmentRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getOrdersFulfillmentAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/OrdersFulfillment',
	component: OrdersFulfillmentRender,
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
					'Dashboard widget that displays fulfilled and unfulfilled orders for the selected period.',
			},
		},
	},
} satisfies Meta< OrdersFulfillmentStoryProps >;

export default meta;

type Story = StoryObj< OrdersFulfillmentStoryControls >;
type DashboardStory = StoryObj< OrdersFulfillmentDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderOrdersFulfillment,
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
					storyContext: { args: Partial< OrdersFulfillmentStoryControls > }
				) => getOrdersFulfillmentSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period fulfilled and unfulfilled totals.
 */
export const WithComparison: Story = {
	render: renderOrdersFulfillment,
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
					storyContext: { args: Partial< OrdersFulfillmentStoryControls > }
				) => getOrdersFulfillmentSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <OrdersFulfillmentDashboardStory { ...args } />,
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
\trenderModule="storybook/orders-fulfillment"
\trenderComponent={ OrdersFulfillmentRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
