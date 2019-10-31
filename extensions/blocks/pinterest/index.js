/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, G, Path, Rect, SVG } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import edit from './edit';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'pinterest';
export const title = __( 'Pinterest', 'jetpack' );
export const settings = {
	title,

	description: (
		<Fragment>
			<p>{ __( 'Pinterest', 'jetpack' ) }</p>
			<ExternalLink href="#">{ __( 'Learn more about Pinterest', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),

	icon: (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Rect x="0" fill="none" width="24" height="24" />
			<G>
				<Path d="M12,2C6.477,2,2,6.477,2,12c0,4.236,2.636,7.855,6.356,9.312c-0.087-0.791-0.166-2.005,0.035-2.869c0.182-0.78,1.173-4.971,1.173-4.971s-0.299-0.599-0.299-1.484c0-1.39,0.806-2.429,1.809-2.429c0.853,0,1.265,0.641,1.265,1.409c0,0.858-0.546,2.141-0.828,3.329c-0.236,0.996,0.499,1.807,1.481,1.807c1.777,0,3.144-1.874,3.144-4.579c0-2.394-1.72-4.068-4.177-4.068c-2.845,0-4.515,2.134-4.515,4.34c0,0.859,0.331,1.781,0.744,2.282c0.082,0.099,0.094,0.186,0.069,0.287C8.18,14.682,8.011,15.361,7.978,15.5c-0.044,0.183-0.145,0.222-0.334,0.134c-1.249-0.581-2.03-2.407-2.03-3.874c0-3.154,2.292-6.051,6.607-6.051c3.469,0,6.165,2.472,6.165,5.775c0,3.446-2.173,6.22-5.189,6.22c-1.013,0-1.966-0.526-2.292-1.148c0,0-0.501,1.909-0.623,2.377c-0.226,0.869-0.835,1.957-1.243,2.622C9.975,21.844,10.969,22,12,22c5.523,0,10-4.477,10-10C22,6.477,17.523,2,12,2z" />
			</G>
		</SVG>
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
};
