import * as connectionData from './connection-data';
import * as pricingPageSettings from './pricing-page';
import * as shareStatus from './share-status';
import * as sigActions from './social-image-generator';
import * as socialModuleSettings from './social-module-settings';
import * as socialNoteSettings from './social-notes';
import * as utmActions from './utm-settings';

const actions = {
	...shareStatus,
	...connectionData,
	...sigActions,
	...utmActions,
	...socialNoteSettings,
	...pricingPageSettings,
	...socialModuleSettings,
};

export default actions;
