/**
 * Internal dependencies
 */
import { connectionStatusActions } from './connection-status';
import { pluginActions } from './plugins';

const actions = {
	...connectionStatusActions,
	...pluginActions,
};

export default actions;
