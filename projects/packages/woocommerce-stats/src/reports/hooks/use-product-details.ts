/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { productDetailsQuery } from '../queries/product-details-query';
import type { ReportParams } from '../utils/types';

const DISABLED_COMPARISON_KEY = [ 'products', 'details', '__comparison__', 'disabled' ];

/**
 * The image and public URL of the products a report listed, through the dashboard's query client.
 * They belong to products, not to a period, so the comparison slot stays parked.
 *
 * @param productIds - The products of the selected period, as the report listed them.
 * @param params     - The widget's report params, which say whether a comparison runs.
 * @return The details by product id, under the dashboard's query flags.
 */
export function useProductDetails( productIds: readonly number[], params: ReportParams ) {
	return useReport(
		( _params, queryType ) =>
			queryType === 'primary'
				? productDetailsQuery( productIds )
				: { queryKey: DISABLED_COMPARISON_KEY, enabled: false },
		params,
		{ disabledComparisonKey: DISABLED_COMPARISON_KEY, refreshNotice: false }
	);
}
