import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_PRODUCT_BY_OWNERSHIP_KEY, QUERY_PRODUCT_KEY } from '../constants';
import { onSwitchWritten } from '../switch-written';

/**
 * Refetch the products and their ownership whenever a feature switch is written.
 *
 * A switch on the Features tab changes a product's status, and the Overview cards
 * would otherwise keep the one cached at page load.
 */
export function useRefreshProductsOnSwitch() {
	const queryClient = useQueryClient();

	useEffect(
		() =>
			onSwitchWritten( () => {
				queryClient.invalidateQueries( { queryKey: [ QUERY_PRODUCT_KEY ] } );
				queryClient.invalidateQueries( { queryKey: [ QUERY_PRODUCT_BY_OWNERSHIP_KEY ] } );
			} ),
		[ queryClient ]
	);
}
