/**
 * Internal dependencies
 */
import { PrivacySettingProp } from '../../types';
import {
	VIDEO_PRIVACY_LEVELS,
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
} from '../constants';

/**
 * Determines if a video is private taking into account the video
 * privacy setting and the site default privacy setting.
 *
 * @param {PrivacySettingProp} privacySetting - The privacy setting for the video
 * @param {boolean} privateEnabledForSite - The site default privacy setting, if it's private or not
 * @returns {boolean} - true if the video is private, false otherwise
 */
export const videoIsPrivate = (
	privacySetting: PrivacySettingProp,
	privateEnabledForSite: boolean
): boolean => {
	if ( VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_PUBLIC ) {
		return false;
	}

	if ( VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_PRIVATE ) {
		return true;
	}

	return privateEnabledForSite;
};
