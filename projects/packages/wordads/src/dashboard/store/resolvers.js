import { __ } from '@wordpress/i18n';
import { errorNotice } from '../components/global-notices/store/actions';
import { setJetpackSettings } from './actions/jetpack-settings';
import { fetchWordAdsSettings } from './controls';

/**
 * Yield actions to get Search Module Status
 *
 * @yield {object} - an action object.
 * @return {object} - an action object.
 */
export function* getWordAdsModuleStatus() {
	try {
		const settings = yield fetchWordAdsSettings();
		if ( settings ) {
			return setJetpackSettings( settings );
		}
	} catch {
		return errorNotice( __( 'Error fetching settings…', 'jetpack-wordads' ) );
	}
}

export default { getWordAdsModuleStatus };
