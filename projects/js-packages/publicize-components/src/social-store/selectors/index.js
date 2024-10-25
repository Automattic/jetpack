import * as connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';
import * as shareStatusSelectors from './share-status';
import siteDataSelectors from './site-data';

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
	...shareStatusSelectors,
};

export default selectors;
