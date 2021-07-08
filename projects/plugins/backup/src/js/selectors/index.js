/**
 * Internal dependencies
 */
import connectionSelectors from './connection-status';
import APISelectors from './api';
import connectionData from './connection-data';
import jetpackStatusSelectors from './jetpack-status';

const selectors = {
	...connectionSelectors,
	...APISelectors,
	...connectionData,
	...jetpackStatusSelectors,
};

export default selectors;
