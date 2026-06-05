/**
 * Internal dependencies
 */
import type { OrderAttributionByProductResponse } from '../../api/report-order-attribution-by-product-fetch';
import type { OrderAttributionSummaryResponse } from '../../api/report-order-attribution-summary-fetch';

/**
 * Normalizes the order-attribution-by-product API response to match the
 * structure of the regular order-attribution API response.
 *
 * The new API has a flatter structure without current_period/previous_period nesting,
 * so we need to transform it to match the expected format for widgets.
 *
 * @param currentResponse  - Response from the current period request
 * @param previousResponse - Optional response from the comparison period request
 * @return Normalized response matching OrderAttributionSummaryResponse structure
 */
export function normalizeOrderAttributionByProductResponse(
	currentResponse: OrderAttributionByProductResponse,
	previousResponse?: OrderAttributionByProductResponse
): OrderAttributionSummaryResponse {
	// Create a map for quick lookup of previous period data by item
	const previousDataMap = new Map< string, ( typeof currentResponse.data )[ 0 ] >();
	if ( previousResponse ) {
		previousResponse.data.forEach( item => {
			previousDataMap.set( item.item, item );
		} );
	}

	// Transform the flat structure to nested structure
	const normalizedData = currentResponse.data.map( currentItem => {
		const previousItem = previousDataMap.get( currentItem.item );

		// If no previous response provided (no comparison), use current data for both periods
		// This matches the behavior of the existing API when compare_from/to equal from/to
		const previousValue = previousItem?.value || currentItem.value;
		const previousIntervals = previousItem?.intervals || currentItem.intervals;

		return {
			item: currentItem.item,
			current_period: {
				value: currentItem.value,
				intervals: currentItem.intervals,
			},
			previous_period: {
				value: previousValue,
				intervals: previousIntervals,
			},
		};
	} );

	// Handle items that exist in previous period but not in current
	// This ensures we don't lose data when an item had sales in the previous period but not current
	if ( previousResponse ) {
		previousResponse.data.forEach( previousItem => {
			const existsInCurrent = currentResponse.data.some( item => item.item === previousItem.item );

			if ( ! existsInCurrent ) {
				normalizedData.push( {
					item: previousItem.item,
					current_period: {
						value: '0',
						intervals: previousItem.intervals.map( interval => ( {
							...interval,
							net_sales: '0',
						} ) ),
					},
					previous_period: {
						value: previousItem.value,
						intervals: previousItem.intervals,
					},
				} );
			}
		} );
	}

	return {
		view: currentResponse.view,
		order_by: currentResponse.order_by,
		data: normalizedData,
	};
}
