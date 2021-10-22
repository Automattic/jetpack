/**
 * Internal dependencies
 */
import siteSettingActions from './jetpack-settings';
import sitePlanActions from './site-plan';

const actions = {
	...siteSettingActions,
	...sitePlanActions,
};

export default actions;
