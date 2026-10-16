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
 */
export function normalizeOrderAttributionByProductResponse(
	currentResponse: OrderAttributionByProductResponse,
	previousResponse?: OrderAttributionByProductResponse
): OrderAttributionSummaryResponse {
	const previousDataMap = new Map< string, ( typeof currentResponse.data )[ 0 ] >();
	if ( previousResponse ) {
		previousResponse.data.forEach( item => {
			previousDataMap.set( item.item, item );
		} );
	}

	const normalizedData = currentResponse.data.map( currentItem => {
		const previousItem = previousDataMap.get( currentItem.item );

		// Without a comparison both periods read the current one, as the regular API does when
		// compare_from/to equal from/to. With one, an item outside its top 5 has no figure there.
		const previousValue = previousResponse ? ( previousItem?.value ?? null ) : currentItem.value;
		const previousIntervals = previousResponse
			? ( previousItem?.intervals ?? [] )
			: currentItem.intervals;

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
