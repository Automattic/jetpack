import { useQuery } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../api';
import { QUERY_PRODUCT_DATA_KEY } from '../constants';

/**
 * Credentials Query Hook
 *
 * @return {object} useQuery Hook
 */
export default function useProductDataQuery() {
	return useQuery( {
		queryKey: [ QUERY_PRODUCT_DATA_KEY ],
		queryFn: API.getProductData,
		initialData: camelize( window?.jetpackProtectInitialState?.jetpackScan ),
	} );
}
