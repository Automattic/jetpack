/**
 * Internal dependencies
 */
import connectionStatusActions from '../components/with-connection-status/state/actions';
import connectedPluginsActions from '../components/with-connected-plugins/state/actions';

const actions = {
	...connectionStatusActions,
	...connectedPluginsActions,
};

export default actions;
