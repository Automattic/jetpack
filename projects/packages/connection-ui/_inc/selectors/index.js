/**
 * Internal dependencies
 */
import APISelectors from './api';
import assetsSelectors from './assets';

const selectors = {
	...APISelectors,
	...assetsSelectors,
};

export default selectors;
