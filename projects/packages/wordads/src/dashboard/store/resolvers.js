/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { fetchWordAdsSettings } from './controls';
import { setJetpackSettings } from './actions/jetpack-settings';
import { errorNotice } from '../components/global-notices/store/actions';

/**
 * Yield actions to get Search Module Status
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* getWordAdsModuleStatus() {
	try {
		const settings = yield fetchWordAdsSettings();
		if ( settings ) {
			return setJetpackSettings( settings );
		}
	} catch ( e ) {
		return errorNotice( __( 'Error fetching settings…', 'jetpack-wordads' ) );
	}
}

export default { getWordAdsModuleStatus };
