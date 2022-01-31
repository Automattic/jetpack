/**
 * Internal dependencies
 */
import APISelectors from './api';
import jetpackStatusSelectors from './jetpack-status';
import connectedPluginsSelectors from './connected-plugins';
import siteDataSelectors from './site-data';

const selectors = {
	...APISelectors,
	...jetpackStatusSelectors,
	...connectedPluginsSelectors,
	...siteDataSelectors,
};

export default selectors;
