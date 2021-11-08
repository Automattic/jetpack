/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { fetchJetpackSettings, fetchSearchPlanInfo } from './controls';
import { setJetpackSettings } from './actions/jetpack-settings';
import { setSearchPlanInfo } from './actions/site-plan';
import { errorNotice } from '../components/global-notices/store/actions';

export function* getSearchModuleStatus() {
	try {
		const settings = yield fetchJetpackSettings();
		if ( settings ) {
			return setJetpackSettings( settings );
		}
	} catch ( e ) {
		return errorNotice( __( 'Error fetching settings...' ) );
	}
}

export function* getSearchPlanInfo() {
	try {
		const planInfo = yield fetchSearchPlanInfo();
		if ( planInfo ) {
			return setSearchPlanInfo( planInfo );
		}
	} catch ( e ) {
		return errorNotice( __( 'Error fetching search plan...' ) );
	}
}

export default { getSearchModuleStatus, getSearchPlanInfo };
