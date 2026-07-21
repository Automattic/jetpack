import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import CouponUsageOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const COUPON_USAGE_OVER_TIME_RENDER_MODULE = 'storybook/coupon-usage-over-time';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type CouponUsageOverTimeWidgetProps = ComponentProps< typeof CouponUsageOverTimeRender >;

interface CouponUsageOverTimeStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type CouponUsageOverTimeStoryProps = CouponUsageOverTimeWidgetProps &
	CouponUsageOverTimeStoryControls;

interface CouponUsageOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		CouponUsageOverTimeStoryControls {}

function getCouponUsageOverTimeAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): CouponUsageOverTimeWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< CouponUsageOverTimeStoryControls > ) {
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

function getCouponUsageOverTimeSource( args: Partial< CouponUsageOverTimeStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<CouponUsageOverTimeRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderCouponUsageOverTime( { withComparison, preset }: CouponUsageOverTimeStoryControls ) {
	return (
		<CouponUsageOverTimeRender
			attributes={ getCouponUsageOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderCouponUsageOverTimeOnPreset( preset: SelectablePresetId ) {
	return (
		<CouponUsageOverTimeRender attributes={ getCouponUsageOverTimeAttributes( false, preset ) } />
	);
}

function CouponUsageOverTimeDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: CouponUsageOverTimeDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ COUPON_USAGE_OVER_TIME_RENDER_MODULE }
			renderComponent={ CouponUsageOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getCouponUsageOverTimeAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/CouponUsageOverTime',
	component: CouponUsageOverTimeRender,
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
					'The "Coupon usage over time" widget. Fetches coupon usage for the selected period and displays sales with and without coupons in a donut chart.',
			},
		},
	},
} satisfies Meta< CouponUsageOverTimeStoryProps >;

export default meta;

type Story = StoryObj< CouponUsageOverTimeStoryControls >;
type DashboardStory = StoryObj< CouponUsageOverTimeDashboardStoryProps >;

export const Default: Story = {
	render: renderCouponUsageOverTime,
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
					storyContext: { args: Partial< CouponUsageOverTimeStoryControls > }
				) => getCouponUsageOverTimeSource( storyContext.args ),
			},
		},
	},
};

export const WithComparison: Story = {
	render: renderCouponUsageOverTime,
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
					storyContext: { args: Partial< CouponUsageOverTimeStoryControls > }
				) => getCouponUsageOverTimeSource( storyContext.args ),
			},
		},
	},
};

/**
 * First load: the coupons-by-date report is in flight, so the widget shows its
 * loading state. The mock is forced to never resolve for the duration of this
 * story.
 */
export const Loading: Story = {
	render: () => renderCouponUsageOverTimeOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'coupons/by-date', 'loading' );
		return () => setReportMockState( 'coupons/by-date', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action
 * (which re-runs the query — still mocked as failing while this story is
 * active).
 */
export const Error: Story = {
	render: () => renderCouponUsageOverTimeOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'coupons/by-date', 'error' );
		return () => setReportMockState( 'coupons/by-date', null );
	},
};

/**
 * Resolved with no coupon usage: the widget shows its empty state ("No coupon
 * usage in this period.").
 */
export const Empty: Story = {
	render: () => renderCouponUsageOverTimeOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'coupons/by-date', 'empty' );
		return () => setReportMockState( 'coupons/by-date', null );
	},
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <CouponUsageOverTimeDashboardStory { ...args } />,
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
\trenderModule="storybook/coupon-usage-over-time"
\trenderComponent={ CouponUsageOverTimeRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
