import { select } from '@wordpress/data';
import { SOCIAL_STORE_ID } from '../../social-store';
import {
	fetchJetpackSettings,
	updateJetpackSettings as updateJetpackSettingsControl,
} from '../controls';
import { setJetpackSettings } from './jetpack-settings';

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
		yield setJetpackSettings( settings );
		yield updateJetpackSettingsControl( settings );
		const updatedSettings = yield fetchJetpackSettings();
		yield setJetpackSettings( updatedSettings );
		return true;
	} catch ( e ) {
		const oldSettings = select( SOCIAL_STORE_ID ).getSocialNotesSettings();
		yield setJetpackSettings( oldSettings );
		return false;
	} finally {
		yield setUpdatingSocialNotesSettingsDone();
	}
}

/**
 * Yield actions to update settings
 *
 * @param {object} config - config to update
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* updateSocialNotesConfig( config ) {
	const prevConfig = select( SOCIAL_STORE_ID ).getSocialNotesConfig();
	const newConfig = { ...prevConfig, ...config };
	try {
		yield setJetpackSettings( { social_notes_config: newConfig } );
		yield updateJetpackSettingsControl( { social_notes_config: config } );
		const updatedSettings = yield fetchJetpackSettings();
		yield setJetpackSettings( updatedSettings );
		return true;
	} catch ( e ) {
		yield setJetpackSettings( { social_notes_config: prevConfig } );
		return false;
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
		const updatedSettings = yield fetchJetpackSettings();
		yield setJetpackSettings( updatedSettings );
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
	return setJetpackSettings( { social_notes_is_updating: true } );
}

/**
 * Set state updating finished
 *
 * @returns {object} - an action object.
 */
export function setUpdatingSocialNotesSettingsDone() {
	return setJetpackSettings( { social_notes_is_updating: false } );
}

/**
 * Set state updating action
 *
 * @returns {object} - an action object.
 */
export function setUpdatingSocialNotesConfig() {
	return setJetpackSettings( { social_notes_config_is_updating: true } );
}

export default {
	updateSocialNotesSettings,
	updateSocialNotesConfig,
	refreshSocialNotesSettings,
};
