/**
 * Internal dependencies
 */
import { updateJetpackSettings as updateJetpackSettingsControl } from '../controls';

export const SET_JETPACK_SETTINGS = 'SET_JETPACK_SETTINGS';
export const TOGGLE_SEARCH_MODULE = 'TOGGLE_SEARCH_MODULE';

/**
 * Yield actions to update Search Settings
 *
 * @param {object} settings
 * @returns object - yield an action object.
 */
function* updateJetpackSettings( settings ) {
	yield setJetpackSettings( settings );
	yield setUpdatingJetpackSettings();
	const updatedSettings = yield updateJetpackSettingsControl( settings );
	yield setUpdatingJetpackSettingsDone();
	return setJetpackSettings( updatedSettings );
}

/**
 * @returns {object} - an action to set network busy.
 */
function setUpdatingJetpackSettings() {
	return setJetpackSettings( { is_updating: true } );
}

/**
 *
 * @returns {object} - an action to set network free.
 */
function setUpdatingJetpackSettingsDone() {
	return setJetpackSettings( { is_updating: false } );
}

function setJetpackSettings( options ) {
	return { type: SET_JETPACK_SETTINGS, options };
}

export default { updateJetpackSettings, setJetpackSettings };
