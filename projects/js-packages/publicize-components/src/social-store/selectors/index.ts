import * as connectionDataSelectors from './connection-data';
import * as shareStatusSelectors from './share-status';
import * as socialPluginSelectors from './social-plugin-settings';
import * as socialSettingsSelectors from './social-settings';

const selectors = {
	...connectionDataSelectors,
	...shareStatusSelectors,
	...socialPluginSelectors,
	...socialSettingsSelectors,
};

export default selectors;
