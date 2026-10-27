/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { statsYearlyProductQuery } from '../queries/stats-yearly-product-query';

export function useStatsYearlyProduct() {
	return useQuery( statsYearlyProductQuery() );
}
