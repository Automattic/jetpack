import {
	BookingsRevenueByCustomerTypeWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { GlobalErrorProvider } from '@jetpack-premium-analytics/data';

type BookingsRevenueByCustomerTypeRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
	setError?: Parameters< typeof WidgetRoot >[ 0 ][ 'setError' ];
};

/**
 * Bookings revenue by customer type widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingsRevenueByCustomerTypeWidget
 * fetches the bookings customers report and renders the revenue breakdown.
 */
export default function BookingsRevenueByCustomerTypeRender( {
	attributes,
	setError,
}: BookingsRevenueByCustomerTypeRenderProps ) {
	return (
		<GlobalErrorProvider>
			<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
				<BookingsRevenueByCustomerTypeWidget />
			</WidgetRoot>
		</GlobalErrorProvider>
	);
}
