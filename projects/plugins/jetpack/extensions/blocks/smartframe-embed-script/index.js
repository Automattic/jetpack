/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
//import attributes from './attributes';
//import edit from './edit';
import icon from './icon';
import { getIconColor } from '../../shared/block-icons';

export const URL_REGEX = /smartframe\.io\/[a-zA-Z]+/i;
//export const URL_REGEX = /<script\ssrc=\"https:\/\/embed\.smartframe\.(?:io|net)\/(\w+)\.js\"\sdata-image-id=\"(.*?)\"(?:\sdata-width=\"(?:\d+(?:%|px))\"\s)?(?:data-max-width=\"(\d+(%|px)))?\"><\/script>/i;
//export const URL_REGEX = /<script>[a-zA-Z]+<\/script>/i;

/**
 * Style dependencies
 */
//import './editor.scss';

export const name = 'smartframe-embed-script';
export const title = __( 'SmartFrame Embed Script', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'SmartFrame Embed Script', 'jetpack' ) }</p>
			<ExternalLink href="#">
				{ __( 'Learn more about SmartFrame Embed Script', 'jetpack' ) }
			</ExternalLink>
		</Fragment>
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
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
	edit: () => null,
	/* @TODO Write the block editor output */
	save: () => null,
	attributes: {},
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node => {
					//console.log( node.nodeName );
					//return node.nodeName === 'P' && URL_REGEX.test( node.textContent );
					return URL_REGEX.test( node.textContent );
				},
				transform: node => {
					//console.log( node );
					return createBlock( 'core/paragraph', {
						content: node.textContent.trim() + ' hello',
					} );
				},
			},
		],
	},
};
