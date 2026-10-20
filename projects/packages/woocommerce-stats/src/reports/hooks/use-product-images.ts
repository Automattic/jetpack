/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { productImagesQuery } from '../queries/product-images-query';
import type { ReportParams } from '../utils/types';

const DISABLED_COMPARISON_KEY = [ 'products', 'images', '__comparison__', 'disabled' ];

/**
 * The images of the products a report listed, through the dashboard's query client. Images belong
 * to products, not to a period, so the comparison slot stays parked.
 *
 * @param productIds - The products of the selected period, as the report listed them.
 * @param params     - The widget's report params, which say whether a comparison runs.
 * @return The images by product id, under the dashboard's query flags.
 */
export function useProductImages( productIds: readonly number[], params: ReportParams ) {
	return useReport(
		( _params, queryType ) =>
			queryType === 'primary'
				? productImagesQuery( productIds )
				: { queryKey: DISABLED_COMPARISON_KEY, enabled: false },
		params,
		{ disabledComparisonKey: DISABLED_COMPARISON_KEY }
	);
}
