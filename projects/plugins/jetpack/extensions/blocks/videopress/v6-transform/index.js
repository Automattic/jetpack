/**
 * External dependencies
 */
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
/**
 * Internal dependencies
 */
import withV6TransformEdit from './edit';

const VIDEOPRESS_VIDEO_FEATURE = 'videopress/video';

export default function addV6TransformSupport( settings, name ) {
	// Only apply to core/video block.
	if ( name !== 'core/video' ) {
		return settings;
	}

	// Only apply if VideoPress video block is available.
	if ( ! getJetpackExtensionAvailability( VIDEOPRESS_VIDEO_FEATURE ) ) {
		return settings;
	}

	return {
		...settings,
		edit: withV6TransformEdit( settings.edit ),
	};
}
