import * as connectionDataSelectors from './connection-data';
import * as scheduledSharesSelectors from './scheduled-shares';
import * as servicesSelectors from './services';
import * as sharepostSelectors from './share-post';
import * as shareStatusSelectors from './share-status';
import * as socialImageGeneratorSelectors from './social-image-generator';
import * as socialModuleSelectors from './social-module-settings';
import * as socialSettingsSelectors from './social-settings';
import * as unifiedModalSelectors from './unified-modal';
import * as xUsageSelectors from './x-usage';

const selectors = {
	...connectionDataSelectors,
	...shareStatusSelectors,
	...sharepostSelectors,
	...socialImageGeneratorSelectors,
	...socialModuleSelectors,
	...socialSettingsSelectors,
	...servicesSelectors,
	...scheduledSharesSelectors,
	...unifiedModalSelectors,
	...xUsageSelectors,
};

export default selectors;
