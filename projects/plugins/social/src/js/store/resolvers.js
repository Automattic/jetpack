import { setJetpackSettings } from './actions/jetpack-settings';
import { setSocialImageGeneratorSettings } from './actions/social-image-generator-settings';
import { fetchJetpackSettings, fetchSocialImageGeneratorSettings } from './controls';

/**
 * Yield actions to get the Jetpack settings.
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* getJetpackSettings() {
	try {
		const settings = yield fetchJetpackSettings();
		if ( settings ) {
			return setJetpackSettings( settings );
		}
	} catch ( e ) {
		// TODO: Add proper error handling here
		console.log( e ); // eslint-disable-line no-console
	}
}

/**
 * Yield actions to get the Social Image Generator settings.
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* getSocialImageGeneratorSettings() {
	try {
		const settings = yield fetchSocialImageGeneratorSettings();
		if ( settings ) {
			return setSocialImageGeneratorSettings( settings );
		}
	} catch ( e ) {
		// TODO: Add proper error handling here
		console.log( e ); // eslint-disable-line no-console
	}
}

export default { getJetpackSettings, getSocialImageGeneratorSettings };
