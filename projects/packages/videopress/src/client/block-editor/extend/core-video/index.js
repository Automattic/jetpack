/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import withJetpackVideoPressEdit from './edit';

const extendCoreVideoBlock = ( settings, name ) => {
	if ( name !== 'core/video' ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			keepUsingCoreVideoVideoPressBlock: {
				type: 'boolean',
			},
		},
		edit: withJetpackVideoPressEdit( settings.edit ),
	};
};

addFilter(
	'blocks.registerBlockType',
	'videopress/core-video/handle-block-conversion',
	extendCoreVideoBlock
);
