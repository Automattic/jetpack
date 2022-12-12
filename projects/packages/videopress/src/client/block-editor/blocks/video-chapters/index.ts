/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { formatListNumbered as icon } from '@wordpress/icons';
import { isExtensionEnabled } from '../../extensions';
/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';
import save from './save';
import './style.scss';

export const { name, title, description } = metadata;

if ( isExtensionEnabled( name ) ) {
	registerBlockType( name, {
		edit: Edit,
		save,
		icon,
	} );
}

/*
 * Extend VideoPress video block with chapters support.
 */
addFilter(
	'blocks.registerBlockType',
	'videopress/video-chapters/extend-video-block',
	( settings, blockName ) => {
		if ( blockName !== 'videopress/video' ) {
			return settings;
		}

		return {
			...settings,
			attributes: {
				...settings.attributes,
				persistentBlockLinkId: {
					type: 'string',
				},
			},
		};
	}
);
