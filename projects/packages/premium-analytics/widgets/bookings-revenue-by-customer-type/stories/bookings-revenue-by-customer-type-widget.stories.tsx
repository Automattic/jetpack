import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import BookingsRevenueByCustomerTypeRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const BOOKINGS_REVENUE_BY_CUSTOMER_TYPE_RENDER_MODULE =
	'storybook/bookings-revenue-by-customer-type';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type BookingsRevenueByCustomerTypeRenderProps = ComponentProps<
	typeof BookingsRevenueByCustomerTypeRender
>;

interface BookingsRevenueByCustomerTypeStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type BookingsRevenueByCustomerTypeStoryProps = BookingsRevenueByCustomerTypeRenderProps &
	BookingsRevenueByCustomerTypeStoryControls;

interface BookingsRevenueByCustomerTypeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		BookingsRevenueByCustomerTypeStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getBookingsRevenueByCustomerTypeAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): BookingsRevenueByCustomerTypeRenderProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< BookingsRevenueByCustomerTypeStoryControls > ) {
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

function getBookingsRevenueByCustomerTypeSource(
	args: Partial< BookingsRevenueByCustomerTypeStoryControls >
) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<BookingsRevenueByCustomerTypeRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderBookingsRevenueByCustomerType( {
	withComparison,
	preset,
}: BookingsRevenueByCustomerTypeStoryControls ) {
	return (
		<BookingsRevenueByCustomerTypeRender
			attributes={ getBookingsRevenueByCustomerTypeAttributes( withComparison, preset ) }
		/>
	);
}

function BookingsRevenueByCustomerTypeDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: BookingsRevenueByCustomerTypeDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ BOOKINGS_REVENUE_BY_CUSTOMER_TYPE_RENDER_MODULE }
			renderComponent={
				BookingsRevenueByCustomerTypeRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getBookingsRevenueByCustomerTypeAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/BookingsRevenueByCustomerType',
	component: BookingsRevenueByCustomerTypeRender,
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
					'Dashboard widget that displays booking revenue from new customers versus returning customers.',
			},
		},
	},
} satisfies Meta< BookingsRevenueByCustomerTypeStoryProps >;

export default meta;

type Story = StoryObj< BookingsRevenueByCustomerTypeStoryControls >;
type DashboardStory = StoryObj< BookingsRevenueByCustomerTypeDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderBookingsRevenueByCustomerType,
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
					storyContext: { args: Partial< BookingsRevenueByCustomerTypeStoryControls > }
				) => getBookingsRevenueByCustomerTypeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period revenue changes.
 */
export const WithComparison: Story = {
	render: renderBookingsRevenueByCustomerType,
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
					storyContext: { args: Partial< BookingsRevenueByCustomerTypeStoryControls > }
				) => getBookingsRevenueByCustomerTypeSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <BookingsRevenueByCustomerTypeDashboardStory { ...args } />,
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
\trenderModule="storybook/bookings-revenue-by-customer-type"
\trenderComponent={ BookingsRevenueByCustomerTypeRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
