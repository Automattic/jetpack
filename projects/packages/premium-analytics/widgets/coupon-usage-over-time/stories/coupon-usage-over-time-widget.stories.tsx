import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import CouponUsageOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
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

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

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
