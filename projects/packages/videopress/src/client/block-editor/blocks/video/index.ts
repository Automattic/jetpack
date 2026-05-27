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

// Extend the core/embed block
import '../../extend/core-embed';

export const { name, title, description, attributes } = metadata;
const { category } = metadata;

registerBlockType( name, {
	edit: Edit,
	category,
	title,
	save: () => null,
	icon,
	attributes,
	example: {
		attributes: {
			src: editorImageURL( videoPressBlockExampleImage ),
			isExample: true,
		} as unknown as Record< string, never >,
	},
	transforms: transforms as never,
	deprecated,
} );
