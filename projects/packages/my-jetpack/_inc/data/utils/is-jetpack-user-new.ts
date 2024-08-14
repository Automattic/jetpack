import getGuessedSiteLifecycleStatus from './get-guessed-site-lifecycle-status';
import { getMyJetpackWindowInitialState } from './get-my-jetpack-window-state';

const isJetpackUserNew = () => {
	const lifecycleStats = getMyJetpackWindowInitialState( 'lifecycleStats' );

	const acceptedStatuses = [ 'unknown', 'brand-new', 'new' ];
	return acceptedStatuses.includes( getGuessedSiteLifecycleStatus( lifecycleStats ) );
};

export default isJetpackUserNew;
