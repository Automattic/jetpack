/**
 * Internal dependencies
 */
import siteSettingActions from './jetpack-settings';
import sitePlanActions from './site-plan';
import siteStatsActions from './site-stats';
import noticeActions from 'components/global-notices/store/actions';

const actions = {
	...siteSettingActions,
	...sitePlanActions,
	...siteStatsActions,
	...noticeActions,
};

export default actions;
