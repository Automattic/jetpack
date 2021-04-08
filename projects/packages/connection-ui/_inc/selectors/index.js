/**
 * Internal dependencies
 */
import connectionSelectors from './connection';
import APISelectors from './api';

const selectors = {
	...connectionSelectors,
	...APISelectors,
};

export default selectors;
