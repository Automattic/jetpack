import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'ai-chat';
export const title = __( 'AI Chat (Experimental)', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description: __(
		'Provides summarized chat across a site’s content, powered by AI magic.',
		'jetpack'
	),
	icon: {
		src: 'superhero',
		foreground: getIconColor(),
	},
	category: 'text',
	keywords: [
		_x( 'AI', 'block search term', 'jetpack' ),
		_x( 'GPT', 'block search term', 'jetpack' ),
		_x( 'Chat', 'block search term', 'jetpack' ),
		_x( 'Search', 'block search term', 'jetpack' ),
	],
	supports: {
		// Support for block's alignment (left, center, right, wide, full). When true, it adds block controls to change block’s alignment.
		align: true /* if set to true, the 'align' option below can be used*/,
		// Pick which alignment options to display.
		/*align: [ 'left', 'right', 'full' ],*/
		// Support for wide alignment, that requires additional support in themes.
		alignWide: true,
		// When true, a new field in the block sidebar allows to define a custom className for the block’s wrapper.
		customClassName: true,
		// When false, Gutenberg won't add a class like .wp-block-your-block-name to the root element of your saved markup
		className: true,
		// Setting this to false suppress the ability to edit a block’s markup individually. We often set this to false in Jetpack blocks.
		html: false,
		// Passing false hides this block in Gutenberg's visual inserter.
		/*inserter: true,*/
		// When false, user will only be able to insert the block once per post.
		multiple: false,
		// When false, the block won't be available to be converted into a reusable block.
		reusable: false,
	},
	edit,
	save: () => {},
	attributes,
	example: {},
};
