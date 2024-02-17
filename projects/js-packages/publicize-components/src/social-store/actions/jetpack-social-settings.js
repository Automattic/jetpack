import { fetchJetpackSocialSettings } from '../controls';
import {
	setAutoConversionSettings,
	setUpdatingAutoConversionSettings,
	setUpdatingAutoConversionSettingsDone,
} from './auto-conversion-settings';
import {
	setSocialImageGeneratorSettings,
	setUpdatingSocialImageGeneratorSettings,
	setUpdatingSocialImageGeneratorSettingsDone,
} from './social-image-generator-settings';

/**
 * Yield actions to refresh all of the Jetpack Social registered settings.
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* refreshJetpackSocialSettings() {
	try {
		yield setUpdatingAutoConversionSettings();
		yield setUpdatingSocialImageGeneratorSettings();
		const updatedSettings = yield fetchJetpackSocialSettings();
		yield setAutoConversionSettings( updatedSettings.jetpack_social_autoconvert_images );
		yield setSocialImageGeneratorSettings(
			updatedSettings.jetpack_social_image_generator_settings
		);
		return true;
	} catch ( e ) {
		return false;
	} finally {
		yield setUpdatingAutoConversionSettingsDone();
		yield setUpdatingSocialImageGeneratorSettingsDone();
	}
}

export default {
	refreshJetpackSocialSettings,
};
