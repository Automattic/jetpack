/**
 * Internal dependencies
 */
import { fetchJetpackSettings, fetchSearchPlanInfo } from './controls';
import actions from './actions';

export function* getSearchModuleStatus() {
	const settings = yield fetchJetpackSettings();
	if ( settings ) {
		return actions.setJetpackSettings( settings );
	}
	return;
}

export function* getSearchPlanInfo() {
	const planInfo = yield fetchSearchPlanInfo();
	if ( planInfo ) {
		return actions.setSearchPlanInfo( planInfo );
	}
	return;
}

export default { getSearchModuleStatus, getSearchPlanInfo };
