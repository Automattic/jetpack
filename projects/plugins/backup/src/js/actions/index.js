/**
 * Internal dependencies
 */
import connectionStatusActions from './connection-status';
import connectionDataActions from './connection-data';

const actions = {
	...connectionStatusActions,
	...connectionDataActions,
};

export default actions;
