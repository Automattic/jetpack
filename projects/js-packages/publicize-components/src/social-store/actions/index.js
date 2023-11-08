import siteSettingActions from './jetpack-settings';
import jetpackSocialSettingActions from './jetpack-social-settings';

const actions = {
	...siteSettingActions,
	...jetpackSocialSettingActions,
};

export default actions;
