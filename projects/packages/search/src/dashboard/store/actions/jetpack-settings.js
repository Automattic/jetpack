/**
 * External dependencies
 */
/*eslint lodash/import-scope: [2, "method"]*/
import pick from 'lodash/pick';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	fetchJetpackSettings,
	updateJetpackSettings as updateJetpackSettingsControl,
} from '../controls';
import {
	removeUpdatingNotice,
	updatingNotice,
	errorNotice,
	successNotice,
} from 'components/global-notices/store/actions';
import { STORE_ID } from '../../store';

export const SET_JETPACK_SETTINGS = 'SET_JETPACK_SETTINGS';
export const TOGGLE_SEARCH_MODULE = 'TOGGLE_SEARCH_MODULE';

/**
 * Yield actions to update Search Settings
 *
 * @param {object} settings - settings to apply.
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* updateJetpackSettings( settings ) {
	try {
		yield updatingNotice();
		yield setUpdatingJetpackSettings();
		yield setJetpackSettings( settings );
		yield updateJetpackSettingsControl( settings );
		const updatedSettings = yield fetchJetpackSettings();
		yield setJetpackSettings( updatedSettings );
		return successNotice( __( 'Updated settings.', 'jetpack-search-pkg' ) );
	} catch ( e ) {
		const oldSettings = pick( select( STORE_ID ).getSearchModuleStatus(), [
			'module_active',
			'instant_search_enabled',
		] );
		yield setJetpackSettings( oldSettings );
		return errorNotice( __( 'Error Update settings…', 'jetpack-search-pkg' ) );
	} finally {
		yield removeUpdatingNotice();
		yield setUpdatingJetpackSettingsDone();
	}
}

/**
 * Set state updating action
 *
 * @returns {object} - an action object.
 */
export function setUpdatingJetpackSettings() {
	return setJetpackSettings( { is_updating: true } );
}

/**
 * Set state updating finished
 *
 * @returns {object} - an action object.
 */
export function setUpdatingJetpackSettingsDone() {
	return setJetpackSettings( { is_updating: false } );
}

/**
 * Set Jetpack settings action
 *
 * @param {object} options - Jetpack settings.
 * @returns {object} - an action object.
 */
export function setJetpackSettings( options ) {
	return { type: SET_JETPACK_SETTINGS, options };
}

export default { updateJetpackSettings, setJetpackSettings };
