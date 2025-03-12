import * as connectionDataSelectors from './connection-data';
import * as scheduledSharesSelectors from './scheduled-shares';
import * as servicesSelectors from './services';
import * as shareStatusSelectors from './share-status';
import * as socialModuleSelectors from './social-module-settings';
import * as socialSettingsSelectors from './social-settings';

const selectors = {
	...connectionDataSelectors,
	...shareStatusSelectors,
	...socialModuleSelectors,
	...socialSettingsSelectors,
	...servicesSelectors,
	...scheduledSharesSelectors,
};

export default selectors;
