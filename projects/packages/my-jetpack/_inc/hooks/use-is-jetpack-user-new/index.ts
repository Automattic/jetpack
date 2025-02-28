import { QUERY_PURCHASES_KEY, REST_API_SITE_PURCHASES_ENDPOINT } from '../../data/constants';
import useSimpleQuery from '../../data/use-simple-query';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../use-my-jetpack-connection';
import getGuessedSiteLifecycleStatus from './get-guessed-site-lifecycle-status';

const useIsJetpackUserNew = () => {
	const lifecycleStats = getMyJetpackWindowInitialState( 'lifecycleStats' );

	const { isSiteConnected } = useMyJetpackConnection();

	const { data, isLoading, isError } = useSimpleQuery< Purchase[] >( {
		name: QUERY_PURCHASES_KEY,
		query: { path: REST_API_SITE_PURCHASES_ENDPOINT },
		options: { enabled: isSiteConnected },
	} );

	const purchases = ! data || isError || isLoading ? [] : data;

	const acceptedStatuses = [ 'unknown', 'brand-new', 'new' ];
	return acceptedStatuses.includes(
		getGuessedSiteLifecycleStatus( lifecycleStats, purchases, isLoading )
	);
};

export default useIsJetpackUserNew;
