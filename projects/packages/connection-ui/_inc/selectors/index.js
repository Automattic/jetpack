/**
 * Internal dependencies
 */
import connectionSelectors from './connection-status';
import APISelectors from './api';
import assetsSelectors from './assets';
import IDC from './idc';

const selectors = {
	...connectionSelectors,
	...APISelectors,
	...assetsSelectors,
	...IDC,
};

export default selectors;
