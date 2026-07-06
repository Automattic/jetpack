import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import apiFetch from '@wordpress/api-fetch';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import StoreConversionRateBookingsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { APIFetchMiddleware } from '@wordpress/api-fetch';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

const API_BASE = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports';
const CONVERSION_RATE_PATH = `${ API_BASE }/sessions/by-conversion-rate`;
const STORE_CONVERSION_RATE_BOOKINGS_RENDER_MODULE = 'storybook/store-conversion-rate-bookings';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

let conversionRateMocksRegistered = false;
let conversionRateRequestCount = 0;

type StoreConversionRateBookingsWidgetProps = ComponentProps<
	typeof StoreConversionRateBookingsRender
>;

interface StoreConversionRateBookingsStoryControls {
	/**
	 * Whether to include comparison report params.
	 */
	withComparison: boolean;
	/**
	 * Date-range preset to use for report params.
	 */
	preset: SelectablePresetId;
}

type StoreConversionRateBookingsStoryProps = StoreConversionRateBookingsWidgetProps &
	StoreConversionRateBookingsStoryControls;

interface StoreConversionRateBookingsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		StoreConversionRateBookingsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

/**
 * Builds a mock conversion-rate report response.
 *
 * @param isComparison - Whether the response is for the comparison range.
 * @return Mock conversion-rate report response.
 */
function buildConversionRateMockResponse( isComparison: boolean ) {
	const activeSessions = isComparison ? 4860 : 5480;
	const visitors = isComparison ? 3920 : 4410;
	const withCartAddition = isComparison ? 970 : 1215;
	const reachedCheckout = isComparison ? 430 : 560;
	const completedCheckout = isComparison ? 218 : 310;

	const summary = {
		active_sessions: String( activeSessions ),
		visitors: String( visitors ),
		with_cart_addition: String( withCartAddition ),
		reached_checkout: String( reachedCheckout ),
		completed_checkout: String( completedCheckout ),
		date_start: '2026-05-01T00:00:00.000Z',
		date_end: '2026-05-31T23:59:59.999Z',
	};

	return {
		summary,
		data: [ summary ],
	};
}

/**
 * Registers the conversion-rate report mock once for the story.
 */
function registerConversionRateMocks(): void {
	if ( conversionRateMocksRegistered ) {
		return;
	}

	conversionRateMocksRegistered = true;

	const conversionRateMiddleware: APIFetchMiddleware = async ( options, next ) => {
		const requestPath = String( options.path ?? options.url ?? '' );

		if ( ! requestPath.startsWith( CONVERSION_RATE_PATH ) ) {
			return next( options );
		}

		const isComparison = conversionRateRequestCount % 2 === 1;
		conversionRateRequestCount += 1;

		return buildConversionRateMockResponse( isComparison );
	};

	apiFetch.use( conversionRateMiddleware );
}

function getStoreConversionRateBookingsAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): StoreConversionRateBookingsWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< StoreConversionRateBookingsStoryControls > ) {
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

function getStoreConversionRateBookingsSource(
	args: Partial< StoreConversionRateBookingsStoryControls >
) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<StoreConversionRateBookingsRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

/**
 * Renders the standalone store conversion rate bookings widget story.
 *
 * @param {StoreConversionRateBookingsStoryControls} props - Story controls.
 * @return Store conversion rate bookings widget story element.
 */
function renderStoreConversionRateBookings( {
	withComparison,
	preset,
}: StoreConversionRateBookingsStoryControls ) {
	return (
		<StoreConversionRateBookingsRender
			attributes={ getStoreConversionRateBookingsAttributes( withComparison, preset ) }
		/>
	);
}

/**
 * Renders the store conversion rate bookings widget inside the dashboard story shell.
 *
 * @param {StoreConversionRateBookingsDashboardStoryProps} props - Story controls.
 * @return Store conversion rate bookings dashboard story element.
 */
function StoreConversionRateBookingsDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: StoreConversionRateBookingsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ STORE_CONVERSION_RATE_BOOKINGS_RENDER_MODULE }
			renderComponent={
				StoreConversionRateBookingsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getStoreConversionRateBookingsAttributes( withComparison, preset ) }
		/>
	);
}

registerReportMocks();
registerConversionRateMocks();

const meta = {
	title: 'Packages/Premium Analytics/Widgets/StoreConversionRateBookings',
	component: StoreConversionRateBookingsRender,
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
					'Dashboard widget that displays the booking product conversion funnel for the selected period.',
			},
		},
	},
} satisfies Meta< StoreConversionRateBookingsStoryProps >;

export default meta;

type Story = StoryObj< StoreConversionRateBookingsStoryControls >;
type DashboardStory = StoryObj< StoreConversionRateBookingsDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderStoreConversionRateBookings,
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
					storyContext: { args: Partial< StoreConversionRateBookingsStoryControls > }
				) => getStoreConversionRateBookingsSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period conversion change.
 */
export const WithComparison: Story = {
	render: renderStoreConversionRateBookings,
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
					storyContext: { args: Partial< StoreConversionRateBookingsStoryControls > }
				) => getStoreConversionRateBookingsSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <StoreConversionRateBookingsDashboardStory { ...args } />,
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
\trenderModule="storybook/store-conversion-rate-bookings"
\trenderComponent={ StoreConversionRateBookingsRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
