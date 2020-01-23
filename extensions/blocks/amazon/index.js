/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, Path } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import renderMaterialIcon from '../../shared/render-material-icon';
import edit from './edit';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'amazon';
export const title = __( 'Amazon', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'Amazon', 'jetpack' ) }</p>
			<ExternalLink href="#">{ __( 'Learn more about Amazon', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),
	/* @TODO Add the icon. You can use one of these https://material.io/tools/icons/?style=outline */
	icon: renderMaterialIcon(
		<Path d="M9 15h2V9H9v6zm1-10c-.5 0-1 .5-1 1s.5 1 1 1 1-.5 1-1-.5-1-1-1zm0-4c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm0 16c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z" />
	),
	category: 'jetpack',
	keywords: [],
	supports: {
		// Support for block's alignment (left, center, right, wide, full). When true, it adds block controls to change block’s alignment.
		align: false /* if set to true, the 'align' option below can be used*/,
		// Pick which alignment options to display.
		/*align: [ 'left', 'right', 'full' ],*/
		// Support for wide alignment, that requires additional support in themes.
		alignWide: true,
		// When true, a new field in the block sidebar allows to define an id for the block and a button to copy the direct link.
		anchor: false,
		// When true, a new field in the block sidebar allows to define a custom className for the block’s wrapper.
		customClassName: true,
		// When false, Gutenberg won't add a class like .wp-block-your-block-name to the root element of your saved markup
		className: true,
		// Setting this to false suppress the ability to edit a block’s markup individually. We often set this to false in Jetpack blocks.
		html: false,
		// Passing false hides this block in Gutenberg's visual inserter.
		/*inserter: true,*/
		// When false, user will only be able to insert the block once per post.
		multiple: true,
		// When false, the block won't be available to be converted into a reusable block.
		reusable: true,
	},
	edit,
	/* @TODO Write the block editor output */
	save: () => null,
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
};
