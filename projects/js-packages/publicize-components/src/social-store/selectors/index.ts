import * as connectionDataSelectors from './connection-data';
import * as scheduledSharesSelectors from './scheduled-shares';
import * as servicesSelectors from './services';
import * as sharepostSelectors from './share-post';
import * as shareStatusSelectors from './share-status';
import * as sharesDataSelectors from './shares-data';
import * as socialModuleSelectors from './social-module-settings';
import * as socialSettingsSelectors from './social-settings';

const selectors = {
	...connectionDataSelectors,
	...shareStatusSelectors,
	...sharepostSelectors,
	...socialModuleSelectors,
	...socialSettingsSelectors,
	...servicesSelectors,
	...sharesDataSelectors,
	...scheduledSharesSelectors,
};

export default selectors;
