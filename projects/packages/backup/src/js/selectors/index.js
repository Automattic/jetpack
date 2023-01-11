import APISelectors from './api';
import connectedPluginsSelectors from './connected-plugins';
import jetpackStatusSelectors from './jetpack-status';
import siteDataSelectors from './site-data';
import siteRewindSelectors from './site-rewind';

const selectors = {
	...APISelectors,
	...jetpackStatusSelectors,
	...connectedPluginsSelectors,
	...siteDataSelectors,
	...siteRewindSelectors,
};

export default selectors;
