/**
 * Internal dependencies
 */
import { isExtensionEnabled } from '../../extensions';
import withVideoChaptersEdit from './edit';

export const VIDEO_CHAPTERS_EXTENSION_NAME = 'videopress-video-chapters-plugin';

/**
 * Function to extend, via the `blocks.registerBlockType` filter,
 * the VideoPress Video block to add chapters funcionality.
 *
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @returns {object}          The block settings.
 */
export default function addVideoPressVideoChaptersSupport( settings, name ) {
	// Bail early if extension is not enabled.
	const isFeatureEnable = isExtensionEnabled( VIDEO_CHAPTERS_EXTENSION_NAME );
	if ( ! isFeatureEnable ) {
		return settings;
	}

	// Bail early if it's another block than our expected.
	if ( name !== 'videopress/video' ) {
		return settings;
	}

	const videoChaptersAttributes = {
		...settings.attributes,
		title: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
		videoChaptersClientId: {
			type: 'string',
		},
	};

	return {
		...settings,
		attributes: videoChaptersAttributes,
		edit: withVideoChaptersEdit( settings.edit ),
	};
}
