/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { statsYearlyProductQuery } from '../queries/stats-yearly-product-query';

/** The yearly Stats product, priced in the connected user's checkout currency when there is one. */
export function useStatsYearlyProduct() {
	const currency =
		getScriptData()?.connection?.userConnectionData?.currentUser?.wpcomUser?.user_currency;

	return useQuery( statsYearlyProductQuery( currency ) );
}
