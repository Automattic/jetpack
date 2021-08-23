/**
 * Internal dependencies
 */
import connectionSelectors from './connection-status';
import APISelectors from './api';
import jetpackStatusSelectors from './jetpack-status';

const selectors = {
	...connectionSelectors,
	...APISelectors,
	...jetpackStatusSelectors,
};

export default selectors;
