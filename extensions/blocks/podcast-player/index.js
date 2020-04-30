/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import { queueMusic } from './icons/';

/**
 * Style dependencies
 */
import './style.scss';
import './editor.scss';
import { supportsCollections } from '../../shared/block-category';

export const name = 'podcast-player';
export const namespaceName = `jetpack/${ name }`;
export const title = __( 'Podcast Player', 'jetpack' );
export const settings = {
	title,
	description: __( 'Select and play episodes from a single podcast.', 'jetpack' ),
	icon: queueMusic,
	category: supportsCollections() ? 'embed' : 'jetpack',
	keywords: [
		_x( 'audio', 'block search term', 'jetpack' ),
		_x( 'embed', 'block search term', 'jetpack' ),
	],
	supports: {
		/*
		 * Support for block's alignment (left, center, right, wide, full). When
		 * true, it adds block controls to change block’s alignment.
		 */
		align: false, // [ 'left', 'right', 'full' ]
		/*
		 * Support for wide alignment, that requires additional support in themes.
		 */
		alignWide: true,
		/*
		 * When true, a new field in the block sidebar allows to define an id for
		 * the block and a button to copy the direct link.
		 */
		anchor: false,
		/*
		 * When true, a new field in the block sidebar allows to define a custom
		 * className for the block’s wrapper.
		 */
		customClassName: true,
		/*
		 * When false, Gutenberg won't add a class like .wp-block-your-block-name to
		 * the root element of your saved markup.
		 */
		className: true,
		/*
		 * Setting this to false suppress the ability to edit a block’s markup
		 * individually. We often set this to false in Jetpack blocks.
		 */
		html: false,
		/*
		 * When false, user will only be able to insert the block once per post.
		 */
		multiple: true,
		/*
		 * When false, the block won't be available to be converted into a reusable
		 * block.
		 */
		reusable: true,
	},
	edit,
	/* @TODO Write the block editor output */
	save: () => null,
	attributes,
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
};
