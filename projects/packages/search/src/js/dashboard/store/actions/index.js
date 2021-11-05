/**
 * Internal dependencies
 */
import siteSettingActions from './jetpack-settings';
import sitePlanActions from './site-plan';
import noticeActions from 'components/global-notices/store/actions';

const actions = {
	...siteSettingActions,
	...sitePlanActions,
	...noticeActions,
};

export default actions;
