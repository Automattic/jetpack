import useSitePurchases from '../../data/use-site-purchases';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import getGuessedSiteLifecycleStatus from './get-guessed-site-lifecycle-status';

const useIsJetpackUserNew = () => {
	const lifecycleStats = getMyJetpackWindowInitialState( 'lifecycleStats' );

	const { data, isLoading, isError } = useSitePurchases();

	const purchases = ! data || isError || isLoading ? [] : data;

	const acceptedStatuses = [ 'unknown', 'brand-new', 'new' ];
	return acceptedStatuses.includes(
		getGuessedSiteLifecycleStatus( lifecycleStats, purchases, isLoading )
	);
};

export default useIsJetpackUserNew;
