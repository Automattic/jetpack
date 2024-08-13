import { getScriptData } from '@automattic/jetpack-script-data';
import { SocialScriptData } from '../types/types';

/**
 * Get the social script data from the window object.
 *
 * @returns {SocialScriptData} The social script data.
 */
export function getSocialScriptData(): SocialScriptData {
	return getScriptData().social;
}
