import { select } from '@wordpress/data';
import { SOCIAL_STORE_ID } from '../../social-store';
import {
	fetchSocialNotesSettings,
	updateSocialNotesSettings as updateSocialNotesSettingsControl,
} from '../controls';

export const SET_SOCIAL_NOTES_SETTINGS = 'SET_SOCIAL_NOTES_SETTINGS';

/**
 * Yield actions to update settings
 *
 * @param {object} settings - settings to apply.
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* updateSocialNotesSettings( settings ) {
	try {
		yield setUpdatingSocialNotesSettings();
		yield setSocialNotesSettings( settings );
		yield updateSocialNotesSettingsControl( settings );
		const updatedSettings = yield fetchSocialNotesSettings();
		yield setSocialNotesSettings( updatedSettings );
		return true;
	} catch ( e ) {
		const oldSettings = select( SOCIAL_STORE_ID ).getSocialNotesSettings();
		yield setSocialNotesSettings( oldSettings );
		return false;
	} finally {
		yield setUpdatingSocialNotesSettingsDone();
	}
}

/**
 * Yield actions to refresh settings
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* refreshSocialNotesSettings() {
	try {
		yield setUpdatingSocialNotesSettings();
		const updatedSettings = yield fetchSocialNotesSettings();
		yield setSocialNotesSettings( updatedSettings );
		return true;
	} catch ( e ) {
		return false;
	} finally {
		yield setUpdatingSocialNotesSettingsDone();
	}
}

/**
 * Set state updating action
 *
 * @returns {object} - an action object.
 */
export function setUpdatingSocialNotesSettings() {
	return setSocialNotesSettings( { isUpdating: true } );
}

/**
 * Set state updating finished
 *
 * @returns {object} - an action object.
 */
export function setUpdatingSocialNotesSettingsDone() {
	return setSocialNotesSettings( { isUpdating: false } );
}

/**
 * Set Social Notes settings action
 *
 * @param {object} options - Social Notes settings.
 * @returns {object} - an action object.
 */
export function setSocialNotesSettings( options ) {
	return { type: SET_SOCIAL_NOTES_SETTINGS, options };
}

export default {
	updateSocialNotesSettings,
	setSocialNotesSettings,
	refreshSocialNotesSettings,
};
