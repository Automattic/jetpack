import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SalesByCouponRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SALES_BY_COUPON_RENDER_MODULE = 'storybook/sales-by-coupon';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type SalesByCouponWidgetProps = ComponentProps< typeof SalesByCouponRender >;
const setStoryError: SalesByCouponWidgetProps[ 'setError' ] = () => undefined;

interface SalesByCouponStoryControls {
	/**
	 * Whether comparison report params are enabled.
	 */
	withComparison: boolean;
	/**
	 * Date-range preset used for report params.
	 */
	preset: SelectablePresetId;
}

type SalesByCouponStoryProps = SalesByCouponWidgetProps & SalesByCouponStoryControls;

interface SalesByCouponDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SalesByCouponStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getSalesByCouponAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): SalesByCouponWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function renderSalesByCoupon( { withComparison, preset }: SalesByCouponStoryControls ) {
	return (
		<SalesByCouponRender
			attributes={ getSalesByCouponAttributes( withComparison, preset ) }
			setError={ setStoryError }
		/>
	);
}

/**
 * Storybook dashboard wrapper for the Sales by coupon widget.
 *
 * @param {SalesByCouponDashboardStoryProps} props - Story controls.
 * @return The dashboard story surface with the widget rendered inside it.
 */
function SalesByCouponDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: SalesByCouponDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SALES_BY_COUPON_RENDER_MODULE }
			renderComponent={ SalesByCouponRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getSalesByCouponAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SalesByCoupon',
	component: SalesByCouponRender,
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
					'Dashboard widget that displays top coupon codes by order revenue for the selected period.',
			},
		},
	},
} satisfies Meta< SalesByCouponStoryProps >;

export default meta;

type Story = StoryObj< SalesByCouponStoryControls >;
type DashboardStory = StoryObj< SalesByCouponDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderSalesByCoupon,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison period enabled, showing period-over-period coupon revenue.
 */
export const WithComparison: Story = {
	render: renderSalesByCoupon,
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
	render: args => <SalesByCouponDashboardStory { ...args } />,
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
