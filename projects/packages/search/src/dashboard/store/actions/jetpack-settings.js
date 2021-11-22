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
import { __ } from '@wordpress/i18n';

export const SET_JETPACK_SETTINGS = 'SET_JETPACK_SETTINGS';
export const TOGGLE_SEARCH_MODULE = 'TOGGLE_SEARCH_MODULE';

/**
 * Yield actions to update Search Settings
 *
 * @param {object} settings - settings to apply.
 * @param {object} oldSettings - Old settings.
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* updateJetpackSettings( settings, oldSettings ) {
	try {
		yield setJetpackSettings( settings );
		yield setUpdatingJetpackSettings();
		yield updateJetpackSettingsControl( settings );
		const updatedSettings = yield fetchJetpackSettings();
		yield setJetpackSettings( updatedSettings );
		return successNotice( __( 'Updated settings.' ) );
	} catch ( e ) {
		// TODO toggle back
		yield setJetpackSettings( oldSettings );
		return errorNotice( __( 'Error Update settings…' ) );
	} finally {
		yield setUpdatingJetpackSettingsDone();
	}
}

/**
 * Set state updating action
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* setUpdatingJetpackSettings() {
	yield updatingNotice();
	return setJetpackSettings( { is_updating: true } );
}

/**
 * Set state updating finished
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* setUpdatingJetpackSettingsDone() {
	yield removeUpdatingNotice();
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
