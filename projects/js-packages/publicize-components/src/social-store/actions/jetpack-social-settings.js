import { select } from '@wordpress/data';
import { SOCIAL_STORE_ID } from '../../social-store';
import {
	fetchJetpackSocialSettings,
	updateSocialImageGeneratorSettings as updateSocialImageGeneratorSettingsControl,
	updateAutoConversionSettings as updateAutoConversionSettingsControl,
} from '../controls';

export const SET_JETPACK_SOCIAL_SETTINGS = 'SET_JETPACK_SOCIAL_SETTINGS';
export const SET_SOCIAL_IMAGE_GENERATOR_SETTINGS = 'SET_SOCIAL_IMAGE_GENERATOR_SETTINGS';
export const SET_AUTO_CONVERSION_SETTINGS = 'SET_AUTO_CONVERSION_SETTINGS';

/**
 *
 * @param settings
 */
export function* updateSocialImageGeneratorSettings( settings ) {
	try {
		yield setUpdatingSocialImageGeneratorSettings();
		yield setSocialImageGeneratorSettings( settings );
		yield updateSocialImageGeneratorSettingsControl( settings );
		const updatedSettings = yield fetchJetpackSocialSettings();
		yield setSocialImageGeneratorSettings( updatedSettings );
		return true;
	} catch ( e ) {
		const oldSettings = select( SOCIAL_STORE_ID ).getJetpackSocialSettings();
		yield setJetpackSocialSettings( oldSettings );
		return false;
	} finally {
		yield setUpdatingSocialImageGeneratorSettingsDone();
	}
}

/**
 *
 * @param settings
 */
export function* updateAutoConversionSettings( settings ) {
	try {
		yield setUpdatingAutoConversionSettings();
		yield setAutoConversionSettings( settings );
		yield updateAutoConversionSettingsControl( settings );
		const updatedSettings = yield fetchJetpackSocialSettings();
		yield setAutoConversionSettings( updatedSettings );
		return true;
	} catch ( e ) {
		const oldSettings = select( SOCIAL_STORE_ID ).getJetpackSocialSettings();
		yield setJetpackSocialSettings( oldSettings );
		return false;
	} finally {
		yield setUpdatingAutoConversionSettingsDone();
	}
}

/**
 * Yield actions to refresh settings
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* refreshJetpackSocialSettings() {
	try {
		const updatedSettings = yield fetchJetpackSocialSettings();
		yield setJetpackSocialSettings( updatedSettings );
		return true;
	} catch ( e ) {
		return false;
	}
}

/**
 * Set state updating action
 *
 * @returns {object} - an action object.
 */
export function setUpdatingJetpackSocialSettings() {
	return setJetpackSocialSettings( { isUpdating: true } );
}

/**
 * Set state updating finished
 *
 * @returns {object} - an action object.
 */
export function setUpdatingJetpackSocialSettingsDone() {
	return setJetpackSocialSettings( { isUpdating: false } );
}

/**
 * Set state updating action
 *
 * @returns {object} - an action object.
 */
export function setUpdatingAutoConversionSettings() {
	return setJetpackSocialSettings( { isUpdatingAutoConversionSettings: true } );
}

/**
 * Set state updating finished
 *
 * @returns {object} - an action object.
 */
export function setUpdatingAutoConversionSettingsDone() {
	return setJetpackSocialSettings( { isUpdatingAutoConversionSettings: false } );
}

/**
 * Set state updating action
 *
 * @returns {object} - an action object.
 */
export function setUpdatingSocialImageGeneratorSettings() {
	return setJetpackSocialSettings( { isUpdatingSocialImageGeneratorSettings: true } );
}

/**
 * Set state updating finished
 *
 * @returns {object} - an action object.
 */
export function setUpdatingSocialImageGeneratorSettingsDone() {
	return setJetpackSocialSettings( { isUpdatingSocialImageGeneratorSettings: false } );
}

/**
 * Set Social Image Generator settings action
 *
 * @param {object} options - Social Image Generator settings.
 * @returns {object} - an action object.
 */
export function setJetpackSocialSettings( options ) {
	return { type: SET_JETPACK_SOCIAL_SETTINGS, options };
}

/**
 *
 * @param options
 */
export function setSocialImageGeneratorSettings( options ) {
	return { type: SET_SOCIAL_IMAGE_GENERATOR_SETTINGS, options };
}

/**
 *
 * @param options
 */
export function setAutoConversionSettings( options ) {
	return { type: SET_AUTO_CONVERSION_SETTINGS, options };
}

export default {
	updateAutoConversionSettings,
	updateSocialImageGeneratorSettings,
	setJetpackSocialSettings,
	refreshJetpackSocialSettings,
};
