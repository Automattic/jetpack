import {
	BookingConversionRateWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';

type StoreConversionRateBookingsRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

/**
 * Store conversion rate bookings widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingConversionRateWidget
 * fetches the conversion-rate report with bookings filters and renders the
 * funnel.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes supplied by the dashboard.
 * @return Store conversion rate bookings widget element.
 */
export default function StoreConversionRateBookingsRender( {
	attributes,
}: StoreConversionRateBookingsRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<BookingConversionRateWidget />
		</WidgetRoot>
	);
}
