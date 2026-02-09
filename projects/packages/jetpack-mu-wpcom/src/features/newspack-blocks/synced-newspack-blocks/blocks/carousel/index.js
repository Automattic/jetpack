/**
 * Newspack dependencies
 */
import colors from 'newspack-colors';
import { contentCarousel as icon } from 'newspack-icons';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

/**
 * Style dependencies - will load in editor
 */
import './view.scss';
import './editor.scss';
import metadata from './block.json';
const { name, attributes, category } = metadata;

// Name must be exported separately.
export { name };

export const title = __( 'Content Carousel', 'jetpack-mu-wpcom' );

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: colors[ 'primary-400' ],
	},
	attributes,
	category,
	keywords: [
		__( 'posts', 'jetpack-mu-wpcom' ),
		__( 'articles', 'jetpack-mu-wpcom' ),
		__( 'latest', 'jetpack-mu-wpcom' ),
		__( 'query', 'jetpack-mu-wpcom' ),
	],
	description: __(
		'An advanced block that displays content in a carousel format with customizable parameters and visual configurations.',
		'jetpack-mu-wpcom'
	),
	supports: {
		html: false,
		align: [ 'center', 'wide', 'full' ],
	},
	edit,
	save: () => null, // to use view.php
};
