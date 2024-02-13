import { select } from '@wordpress/data';
import { SOCIAL_STORE_ID } from '../../social-store';
import {
	fetchAutoConversionSettings,
	updateAutoConversionSettings as updateAutoConversionSettingsControl,
} from '../controls';

export const SET_AUTO_CONVERSION_SETTINGS = 'SET_AUTO_CONVERSION_SETTINGS';

/**
 * Yield actions to update settings
 *
 * @param {object} settings - settings to apply.
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* updateAutoConversionSettings( settings ) {
	try {
		yield setUpdatingAutoConversionSettings();
		yield setAutoConversionSettings( settings );
		yield updateAutoConversionSettingsControl( settings );
		const updatedSettings = yield fetchAutoConversionSettings();
		yield setAutoConversionSettings( updatedSettings.jetpack_social_autoconvert_images );
		return true;
	} catch ( e ) {
		const oldSettings = select( SOCIAL_STORE_ID ).getAutoConversionSettings();
		yield setAutoConversionSettings( oldSettings );
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
export function* refreshAutoConversionSettings() {
	try {
		yield setUpdatingAutoConversionSettings();
		const updatedSettings = yield fetchAutoConversionSettings();
		yield setAutoConversionSettings( updatedSettings.jetpack_social_autoconvert_images );
		return true;
	} catch ( e ) {
		return false;
	} finally {
		yield setUpdatingAutoConversionSettingsDone();
	}
}

/**
 * Set state updating action
 *
 * @returns {object} - an action object.
 */
export function setUpdatingAutoConversionSettings() {
	return setAutoConversionSettings( { isUpdating: true } );
}

/**
 * Set state updating finished
 *
 * @returns {object} - an action object.
 */
export function setUpdatingAutoConversionSettingsDone() {
	return setAutoConversionSettings( { isUpdating: false } );
}

/**
 * Set Social Image Generator settings action
 *
 * @param {object} options - Social Image Generator settings.
 * @returns {object} - an action object.
 */
export function setAutoConversionSettings( options ) {
	return { type: SET_AUTO_CONVERSION_SETTINGS, options };
}

export default {
	updateAutoConversionSettings,
	setAutoConversionSettings,
	refreshAutoConversionSettings,
};
