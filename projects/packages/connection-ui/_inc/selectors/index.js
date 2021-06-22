/**
 * Internal dependencies
 */
import connectionSelectors from './connection-status';
import APISelectors from './api';

const selectors = {
	...connectionSelectors,
	...APISelectors,
};

export default selectors;
