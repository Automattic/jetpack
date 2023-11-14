import { getJetpackSocialOptions } from './get-jetpack-social-options';
import { SIGSettings } from './types';

/**
 * Get the image generator settings for a post.
 *
 * @returns {SIGSettings} An object of image generator settings.
 */
export function getImageGeneratorSettings(): SIGSettings {
	return getJetpackSocialOptions()?.image_generator_settings ?? { enabled: false };
}
