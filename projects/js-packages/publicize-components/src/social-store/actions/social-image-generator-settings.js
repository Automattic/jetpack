import { select } from '@wordpress/data';
import { SOCIAL_STORE_ID } from '../../social-store';
import {
	fetchSocialImageGeneratorSettings,
	updateSocialImageGeneratorSettings as updateSocialImageGeneratorSettingsControl,
} from '../controls';

export const SET_SOCIAL_IMAGE_GENERATOR_SETTINGS = 'SET_SOCIAL_IMAGE_GENERATOR_SETTINGS';

/**
 * Yield actions to update settings
 *
 * @param {object} settings - settings to apply.
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* updateSocialImageGeneratorSettings( settings ) {
	try {
		yield setUpdatingSocialImageGeneratorSettings();
		yield setSocialImageGeneratorSettings( settings );
		yield updateSocialImageGeneratorSettingsControl( settings );
		const updatedSettings = yield fetchSocialImageGeneratorSettings();
		yield setSocialImageGeneratorSettings(
			updatedSettings.jetpack_social_image_generator_settings
		);
		return true;
	} catch ( e ) {
		const oldSettings = select( SOCIAL_STORE_ID ).getSocialImageGeneratorSettings();
		yield setSocialImageGeneratorSettings( oldSettings );
		return false;
	} finally {
		yield setUpdatingSocialImageGeneratorSettingsDone();
	}
}

/**
 * Set state updating action
 *
 * @returns {object} - an action object.
 */
export function setUpdatingSocialImageGeneratorSettings() {
	return setSocialImageGeneratorSettings( { isUpdating: true } );
}

/**
 * Set state updating finished
 *
 * @returns {object} - an action object.
 */
export function setUpdatingSocialImageGeneratorSettingsDone() {
	return setSocialImageGeneratorSettings( { isUpdating: false } );
}

/**
 * Set Social Image Generator settings action
 *
 * @param {object} options - Social Image Generator settings.
 * @returns {object} - an action object.
 */
export function setSocialImageGeneratorSettings( options ) {
	return { type: SET_SOCIAL_IMAGE_GENERATOR_SETTINGS, options };
}

/**
 * Yield actions to refresh settings
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* refreshSocialImageGeneratorSettings() {
	try {
		yield setUpdatingSocialImageGeneratorSettings();
		const updatedSettings = yield fetchSocialImageGeneratorSettings();
		yield setSocialImageGeneratorSettings(
			updatedSettings.jetpack_social_image_generator_settings
		);
		return true;
	} catch ( e ) {
		return false;
	} finally {
		yield setUpdatingSocialImageGeneratorSettingsDone();
	}
}

export default {
	updateSocialImageGeneratorSettings,
	setSocialImageGeneratorSettings,
	refreshSocialImageGeneratorSettings,
};
