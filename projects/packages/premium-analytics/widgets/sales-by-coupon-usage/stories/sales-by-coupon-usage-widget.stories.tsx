import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SalesByCouponUsageRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SALES_BY_COUPON_USAGE_RENDER_MODULE = 'storybook/sales-by-coupon-usage';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type SalesByCouponUsageWidgetProps = ComponentProps< typeof SalesByCouponUsageRender >;

interface SalesByCouponUsageStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type SalesByCouponUsageStoryProps = SalesByCouponUsageWidgetProps & SalesByCouponUsageStoryControls;

interface SalesByCouponUsageDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SalesByCouponUsageStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getSalesByCouponUsageAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): SalesByCouponUsageWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< SalesByCouponUsageStoryControls > ) {
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

function getSalesByCouponUsageSource( args: Partial< SalesByCouponUsageStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<SalesByCouponUsageRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderSalesByCouponUsage( { withComparison, preset }: SalesByCouponUsageStoryControls ) {
	return (
		<SalesByCouponUsageRender
			attributes={ getSalesByCouponUsageAttributes( withComparison, preset ) }
		/>
	);
}

// Renders the widget on a preset distinct from the other stories. The query key
// derives from the date range, so a unique preset gives the forced-state stories
// their own cache entry and they hit the mock fresh instead of reading another
// story's cached success from the shared query client.
function renderSalesByCouponUsageOnPreset( preset: SelectablePresetId ) {
	return (
		<SalesByCouponUsageRender attributes={ getSalesByCouponUsageAttributes( false, preset ) } />
	);
}

function SalesByCouponUsageDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: SalesByCouponUsageDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SALES_BY_COUPON_USAGE_RENDER_MODULE }
			renderComponent={ SalesByCouponUsageRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getSalesByCouponUsageAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SalesByCouponUsage',
	component: SalesByCouponUsageRender,
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
					'Dashboard widget that displays the coupon sales breakdown for the selected period.',
			},
		},
	},
} satisfies Meta< SalesByCouponUsageStoryProps >;

export default meta;

type Story = StoryObj< SalesByCouponUsageStoryControls >;
type DashboardStory = StoryObj< SalesByCouponUsageDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderSalesByCouponUsage,
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
					storyContext: { args: Partial< SalesByCouponUsageStoryControls > }
				) => getSalesByCouponUsageSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period coupon sales data.
 */
export const WithComparison: Story = {
	render: renderSalesByCouponUsage,
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
					storyContext: { args: Partial< SalesByCouponUsageStoryControls > }
				) => getSalesByCouponUsageSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: the coupons report is in flight, so the widget shows its loading
 * state. The mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderSalesByCouponUsageOnPreset( 'last-90-days' ),
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'coupons/', 'loading' );
		return () => setReportMockState( 'coupons/', null );
	},
};

/**
 * The coupons report failed: the widget shows its error state with a Retry
 * action (which re-runs the query — still mocked as failing while this story is
 * active).
 */
export const Error: Story = {
	render: () => renderSalesByCouponUsageOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'coupons/', 'error' );
		return () => setReportMockState( 'coupons/', null );
	},
};

/**
 * Resolved with no coupon rows: the widget shows its empty state (the neutral
 * coupon glyph and "No coupon sales in this period.").
 */
export const Empty: Story = {
	render: () => renderSalesByCouponUsageOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'coupons/', 'empty' );
		return () => setReportMockState( 'coupons/', null );
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <SalesByCouponUsageDashboardStory { ...args } />,
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
\trenderModule="storybook/sales-by-coupon-usage"
\trenderComponent={ SalesByCouponUsageRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
