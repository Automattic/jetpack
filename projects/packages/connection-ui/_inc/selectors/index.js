/**
 * Internal dependencies
 */
import connectionSelectors from './connection-status';
import APISelectors from './api';
import assetsSelectors from './assets';

const selectors = {
	...connectionSelectors,
	...APISelectors,
	...assetsSelectors,
};

export default selectors;
