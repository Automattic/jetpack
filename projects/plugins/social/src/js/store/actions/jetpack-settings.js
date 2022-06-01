import { select } from '@wordpress/data';
import {
	fetchJetpackSettings,
	updateJetpackSettings as updateJetpackSettingsControl,
} from '../controls';
import { STORE_ID } from '../../store';

export const SET_JETPACK_SETTINGS = 'SET_JETPACK_SETTINGS';
export const TOGGLE_PUBLICIZE_MODULE = 'TOGGLE_PUBLICIZE_MODULE';

/**
 * Yield actions to update Publicize Settings
 *
 * @param {object} settings - settings to apply.
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* updateJetpackSettings( settings ) {
	try {
		yield setUpdatingJetpackSettings();
		yield setJetpackSettings( settings );
		yield updateJetpackSettingsControl( settings );
		const updatedSettings = yield fetchJetpackSettings();
		yield setJetpackSettings( updatedSettings );
		return true;
	} catch ( e ) {
		const oldSettings = select( STORE_ID ).getPublicizeModuleStatus();
		yield setJetpackSettings( { publicize_active: oldSettings?.publicize_active } );
		return false;
	} finally {
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
