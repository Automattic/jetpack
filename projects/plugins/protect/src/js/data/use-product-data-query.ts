import { useQuery, UseQueryResult } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../api';
import { QUERY_PRODUCT_DATA_KEY } from '../constants';

/**
 * Product Data Query Hook
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useProductDataQuery(): UseQueryResult {
	return useQuery( {
		queryKey: [ QUERY_PRODUCT_DATA_KEY ],
		queryFn: API.getProductData,
		initialData: camelize( window?.jetpackProtectInitialState?.jetpackScan ),
	} );
}
