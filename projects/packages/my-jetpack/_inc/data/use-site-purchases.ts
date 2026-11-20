import useMyJetpackConnection from '../hooks/use-my-jetpack-connection';
import { QUERY_PURCHASES_KEY, REST_API_SITE_PURCHASES_ENDPOINT } from './constants';
import useSimpleQuery from './use-simple-query';

/**
 * The site's purchases, fetched once the site is connected and shared by every caller.
 *
 * @param options           - Options.
 * @param options.enabled   - Whether to fetch yet, on top of the site being connected.
 * @param options.staleTime - How long, in ms, cached purchases count as fresh: enabling the query refetches older ones.
 * @return The purchases query.
 */
export default function useSitePurchases( {
	enabled = true,
	staleTime,
}: { enabled?: boolean; staleTime?: number } = {} ) {
	const { isSiteConnected } = useMyJetpackConnection();

	return useSimpleQuery< Purchase[] >( {
		name: QUERY_PURCHASES_KEY,
		query: { path: REST_API_SITE_PURCHASES_ENDPOINT },
		options: { enabled: isSiteConnected && enabled, staleTime },
	} );
}
