import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import BookingsByDeviceRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const BOOKINGS_BY_DEVICE_RENDER_MODULE = 'storybook/bookings-by-device';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type BookingsByDeviceRenderProps = ComponentProps< typeof BookingsByDeviceRender >;

interface BookingsByDeviceStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type BookingsByDeviceStoryProps = BookingsByDeviceRenderProps & BookingsByDeviceStoryControls;

interface BookingsByDeviceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		BookingsByDeviceStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getBookingsByDeviceAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): BookingsByDeviceRenderProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< BookingsByDeviceStoryControls > ) {
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

function getBookingsByDeviceSource( args: Partial< BookingsByDeviceStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<BookingsByDeviceRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderBookingsByDevice( { withComparison, preset }: BookingsByDeviceStoryControls ) {
	return (
		<BookingsByDeviceRender
			attributes={ getBookingsByDeviceAttributes( withComparison, preset ) }
		/>
	);
}

function BookingsByDeviceDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: BookingsByDeviceDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ BOOKINGS_BY_DEVICE_RENDER_MODULE }
			renderComponent={ BookingsByDeviceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getBookingsByDeviceAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/BookingsByDevice',
	component: BookingsByDeviceRender,
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
				component: 'Dashboard widget that displays which devices customers use to make bookings.',
			},
		},
	},
} satisfies Meta< BookingsByDeviceStoryProps >;

export default meta;

type Story = StoryObj< BookingsByDeviceStoryControls >;
type DashboardStory = StoryObj< BookingsByDeviceDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderBookingsByDevice,
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
					storyContext: { args: Partial< BookingsByDeviceStoryControls > }
				) => getBookingsByDeviceSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change and sparkline data.
 */
export const WithComparison: Story = {
	render: renderBookingsByDevice,
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
					storyContext: { args: Partial< BookingsByDeviceStoryControls > }
				) => getBookingsByDeviceSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <BookingsByDeviceDashboardStory { ...args } />,
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
\trenderModule="storybook/bookings-by-device"
\trenderComponent={ BookingsByDeviceRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
