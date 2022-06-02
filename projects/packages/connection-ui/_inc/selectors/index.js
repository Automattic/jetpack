import APISelectors from './api';
import assetsSelectors from './assets';
import IDC from './idc';

const selectors = {
	...APISelectors,
	...assetsSelectors,
	...IDC,
};

export default selectors;
