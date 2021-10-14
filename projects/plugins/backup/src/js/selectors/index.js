/**
 * Internal dependencies
 */
import APISelectors from './api';
import jetpackStatusSelectors from './jetpack-status';
import connectedPluginsSelectors from "./connected-plugins";

const selectors = {
	...APISelectors,
	...jetpackStatusSelectors,
	...connectedPluginsSelectors,
};

export default selectors;
