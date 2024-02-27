import { REST_API_SITE_PURCHASES_ENDPOINT } from '../constants';
import useSimpleQuery from '../use-simple-query';
import type { Purchase } from '../types';
import type { UseQueryResult } from '@tanstack/react-query';

const usePurchases: () => UseQueryResult< Array< Purchase >, Error > = () => {
	return useSimpleQuery( 'purchases', REST_API_SITE_PURCHASES_ENDPOINT );
};

export default usePurchases;
