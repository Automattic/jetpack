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
/** The by-product endpoint lists at most this many items per period. */
const BY_PRODUCT_ITEM_LIMIT = 5;

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
		// compare_from/to equal from/to.
		let previousValue = currentItem.value;
		let previousIntervals = currentItem.intervals;
		if ( previousResponse ) {
			// An item missing from a full list may sit just below its cut; from a shorter one, it had no sales.
			const isCut = previousResponse.data.length >= BY_PRODUCT_ITEM_LIMIT;
			previousValue = previousItem?.value ?? ( isCut ? null : '0' );
			previousIntervals =
				previousItem?.intervals ??
				( isCut
					? []
					: currentItem.intervals.map( interval => ( { ...interval, net_sales: '0' } ) ) );
		}

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
