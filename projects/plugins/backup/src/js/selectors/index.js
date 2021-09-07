/**
 * Internal dependencies
 */
import connectionSelectors from './connection-status';
import APISelectors from './api';
import jetpackStatusSelectors from './jetpack-status';
import assetsSelectors from './assets';

const selectors = {
	...connectionSelectors,
	...APISelectors,
	...jetpackStatusSelectors,
	...assetsSelectors,
};

export default selectors;
