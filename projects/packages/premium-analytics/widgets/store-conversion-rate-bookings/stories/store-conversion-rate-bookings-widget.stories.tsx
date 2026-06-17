import apiFetch from '@wordpress/api-fetch';
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import StoreConversionRateBookingsRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware } from '@wordpress/api-fetch';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

const API_BASE = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports';
const CONVERSION_RATE_PATH = `${ API_BASE }/sessions/by-conversion-rate`;

let conversionRateMocksRegistered = false;
let conversionRateRequestCount = 0;

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

registerReportMocks();
registerConversionRateMocks();

const STORE_CONVERSION_RATE_BOOKINGS_RENDER_MODULE = 'storybook/store-conversion-rate-bookings';

interface StoreConversionRateBookingsDashboardStoryProps extends WidgetDashboardWithWidgetControls {
	withComparison: boolean;
}

function StoreConversionRateBookingsDashboardStory( {
	withComparison,
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
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/StoreConversionRateBookings',
	component: StoreConversionRateBookingsDashboardStory,
	tags: [ 'autodocs' ],
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
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
} satisfies Meta< typeof StoreConversionRateBookingsDashboardStory >;

export default meta;

type Story = StoryObj< typeof meta >;

export const WidgetDashboardWithWidget: Story = {};
