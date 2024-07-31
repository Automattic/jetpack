import { fetchJetpackSocialSettings } from '../controls';
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
		yield setUpdatingSocialImageGeneratorSettings();
		const updatedSettings = yield fetchJetpackSocialSettings();
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
	refreshJetpackSocialSettings,
};
