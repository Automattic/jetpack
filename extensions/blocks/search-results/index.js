/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import renderMaterialIcon from '../../shared/render-material-icon';
import edit from './components/edit';
import './editor.scss';

export const name = 'search-results';
export const icon = renderMaterialIcon(
	<Path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
);
export const settings = {
	category: 'widgets',
	description: __( 'Display search results from Jetpack Search.', 'jetpack' ),
	icon,
	// keywords: [
	// 	_x( 'return', 'block search term', 'jetpack' ),
	// 	_x( 'visitors', 'block search term', 'jetpack' ),
	// 	_x( 'visibility', 'block search term', 'jetpack' ),
	// ],
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
		multiple: false,
		/*
		 * When false, the block won't be available to be converted into a reusable
		 * block.
		 */
		reusable: true,
	},
	title: __( 'Search Results', 'jetpack' ),
	edit,
	save: () => null,
};
