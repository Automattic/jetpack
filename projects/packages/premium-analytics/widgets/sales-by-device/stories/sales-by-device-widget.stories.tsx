import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
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
import SalesByDeviceRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SALES_BY_DEVICE_RENDER_MODULE = 'storybook/sales-by-device';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type SalesByDeviceWidgetProps = ComponentProps< typeof SalesByDeviceRender >;

interface SalesByDeviceStoryControls {
	/**
	 * Whether to include comparison report params.
	 */
	withComparison: boolean;
	/**
	 * Date-range preset used for report params.
	 */
	preset: SelectablePresetId;
}

type SalesByDeviceStoryProps = SalesByDeviceWidgetProps & SalesByDeviceStoryControls;

interface SalesByDeviceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SalesByDeviceStoryControls {}

function getSalesByDeviceAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): SalesByDeviceWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< SalesByDeviceStoryControls > ) {
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

function getSalesByDeviceSource( args: Partial< SalesByDeviceStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<SalesByDeviceRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderSalesByDevice( { withComparison, preset }: SalesByDeviceStoryControls ) {
	return (
		<SalesByDeviceRender attributes={ getSalesByDeviceAttributes( withComparison, preset ) } />
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderSalesByDeviceOnPreset( preset: SelectablePresetId ) {
	return <SalesByDeviceRender attributes={ getSalesByDeviceAttributes( false, preset ) } />;
}

/**
 * Story wrapper for rendering the sales by device widget in dashboard chrome.
 *
 * @param {SalesByDeviceDashboardStoryProps} props - Story controls.
 * @return The rendered Storybook story.
 */
function SalesByDeviceDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: SalesByDeviceDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SALES_BY_DEVICE_RENDER_MODULE }
			renderComponent={ SalesByDeviceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getSalesByDeviceAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SalesByDevice',
	component: SalesByDeviceRender,
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
					'The "Sales by device" widget. Fetches the order-attribution report and displays the sales breakdown by device type for the selected period.',
			},
		},
	},
} satisfies Meta< SalesByDeviceStoryProps >;

export default meta;

type Story = StoryObj< SalesByDeviceStoryControls >;
type DashboardStory = StoryObj< SalesByDeviceDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderSalesByDevice,
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
					storyContext: { args: Partial< SalesByDeviceStoryControls > }
				) => getSalesByDeviceSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period sales breakdown.
 */
export const WithComparison: Story = {
	render: renderSalesByDevice,
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
					storyContext: { args: Partial< SalesByDeviceStoryControls > }
				) => getSalesByDeviceSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: the order-attribution report is in flight, so the widget shows its
 * loading state. The mock is forced to never resolve for the duration of this
 * story.
 */
export const Loading: Story = {
	render: () => renderSalesByDeviceOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'order-attribution/device/summary', 'loading' );
		return () => setReportMockState( 'order-attribution/device/summary', null );
	},
};

/**
 * The order-attribution report failed: the widget shows its error state with a
 * Retry action (which re-runs the query — still mocked as failing while this
 * story is active).
 */
export const Error: Story = {
	render: () => renderSalesByDeviceOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'order-attribution/device/summary', 'error' );
		return () => setReportMockState( 'order-attribution/device/summary', null );
	},
};

/**
 * Resolved with no order-attribution rows: the widget shows its empty state (the
 * neutral device glyph and "No sales data in this period.").
 */
export const Empty: Story = {
	render: () => renderSalesByDeviceOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'order-attribution/device/summary', 'empty' );
		return () => setReportMockState( 'order-attribution/device/summary', null );
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <SalesByDeviceDashboardStory { ...args } />,
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
\trenderModule="storybook/sales-by-device"
\trenderComponent={ SalesByDeviceRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
