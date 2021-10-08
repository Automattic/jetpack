/**
 * Internal dependencies
 */
import connectionSelectors from '../components/with-connection-status/state/selectors';
import connectedPlugnisSelectors from '../components/with-connected-plugins/state/selectors';

const selectors = {
	...connectionSelectors,
	...connectedPlugnisSelectors,
};

export default selectors;
