/**
 * Internal dependencies
 */
import siteSettingActions from './jetpack-settings';
import noticeActions from 'components/global-notices/store/actions';

const actions = {
	...siteSettingActions,
	...noticeActions,
};

export default actions;
