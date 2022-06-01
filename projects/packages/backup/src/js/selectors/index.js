import APISelectors from './api';
import connectedPluginsSelectors from './connected-plugins';
import jetpackStatusSelectors from './jetpack-status';
import siteDataSelectors from './site-data';

const selectors = {
	...APISelectors,
	...jetpackStatusSelectors,
	...connectedPluginsSelectors,
	...siteDataSelectors,
};

export default selectors;
