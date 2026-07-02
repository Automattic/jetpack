/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import editorImageURL from '../../utils/editor-image-url';
import metadata from './block.json';
import { VideoPressIcon as icon } from './components/icons';
import deprecated from './deprecated';
import Edit from './edit';
import transforms from './transforms';
import videoPressBlockExampleImage from './videopress-block-example-image.jpg';
import './style.scss';
/**
 * Types
 */
import type { VideoBlockAttributes } from './types';

// Extend the core/embed block
import '../../extend/core-embed';

export const { name, title, description, attributes, category } = metadata;

registerBlockType< VideoBlockAttributes >( name, {
	edit: Edit,
	category,
	title,
	save: () => null,
	icon,
	attributes,
	example: {
		/*
		 * `satisfies` validates these are real attribute values (typos/wrong
		 * value types error here); the `unknown` cast then works around
		 * `@wordpress/blocks` typing `example.attributes` as a map of attribute
		 * schemas rather than values.
		 */
		attributes: {
			src: editorImageURL( videoPressBlockExampleImage ),
			isExample: true,
		} satisfies Partial< VideoBlockAttributes > as unknown as Record< string, never >,
	},
	transforms: transforms as never,
	deprecated,
} );
