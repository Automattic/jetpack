/**
 * Internal dependencies
 */
import connectionStatusSelectors from './connection-status';
import pluginSelectors from './plugins';

const selectors = {
	...connectionStatusSelectors,
	...pluginSelectors,
};

export default selectors;
