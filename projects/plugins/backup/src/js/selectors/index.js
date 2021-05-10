/**
 * Internal dependencies
 */
import connectionSelectors from './connection-status';
import APISelectors from './api';
import connectionData from './connection-data';

const selectors = {
	...connectionSelectors,
	...APISelectors,
	...connectionData,
};

export default selectors;
