/**
 * Internal dependencies
 */
import APISelectors from './api';
import jetpackStatusSelectors from './jetpack-status';

const selectors = {
	...APISelectors,
	...jetpackStatusSelectors,
};

export default selectors;
