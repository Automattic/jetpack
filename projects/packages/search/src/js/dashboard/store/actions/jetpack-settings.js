/**
 * Internal dependencies
 */
import { updateJetpackSettings as updateJetpackSettingsControl } from '../controls';
import noticeActions from 'components/global-notices/store/actions';
import { removeUpdatingNotice, updatingNotice } from 'components/global-notices/store/actions';

export const SET_JETPACK_SETTINGS = 'SET_JETPACK_SETTINGS';
export const TOGGLE_SEARCH_MODULE = 'TOGGLE_SEARCH_MODULE';

/**
 * Yield actions to update Search Settings
 *
 * @param {object} settings
 * @returns object - yield an action object.
 */
export function* updateJetpackSettings( settings ) {
	yield setJetpackSettings( settings );
	yield setUpdatingJetpackSettings();
	const updatedSettings = yield updateJetpackSettingsControl( settings );
	yield setUpdatingJetpackSettingsDone();
	yield setJetpackSettings( updatedSettings );
	return noticeActions.successNotice( 'Update success' );
}

/**
 * @returns {object} - an action to set network busy.
 */
export function* setUpdatingJetpackSettings() {
	yield updatingNotice();
	return setJetpackSettings( { is_updating: true } );
}

/**
 *
 * @returns {object} - an action to set network free.
 */
export function* setUpdatingJetpackSettingsDone() {
	yield removeUpdatingNotice();
	return setJetpackSettings( { is_updating: false } );
}

export function setJetpackSettings( options ) {
	return { type: SET_JETPACK_SETTINGS, options };
}

export default { updateJetpackSettings, setJetpackSettings };
