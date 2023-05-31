/**
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
/**
 * Internal dependencies
 */
import attributes from './attributes';
import description from './description';
import edit from './edit';
import transforms from './transforms';
/**
 * Supports and extensions
 */
import './supports';
import './extensions/ai-assistant';
import './extensions/jetpack-contact-form';
/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'ai-assistant';
export const blockName = `jetpack/${ name }`;
export const title = __( 'AI Assistant (Experimental)', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description,
	icon: {
		src: aiAssistantIcon,
		foreground: getIconColor(),
	},
	category: 'text',
	keywords: [
		_x( 'AI', 'block search term', 'jetpack' ),
		_x( 'GPT', 'block search term', 'jetpack' ),
		_x( 'AL', 'block search term', 'jetpack' ),
		_x( 'Magic', 'block search term', 'jetpack' ),
		_x( 'help', 'block search term', 'jetpack' ),
		_x( 'assistant', 'block search term', 'jetpack' ),
	],
	supports: {
		// Setting this to false suppress the ability to edit a block’s markup individually. We often set this to false in Jetpack blocks.
		html: false,
		// Passing false hides this block in Gutenberg's visual inserter.
		/*inserter: true,*/
		// When false, user will only be able to insert the block once per post.
		multiple: true,
		// When false, the block won't be available to be converted into a reusable block.
		reusable: false,
	},
	edit,
	save: () => null,
	attributes,
	transforms,
	example: {
		attributes: {
			// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
			content: __(
				'With **Jetpack AI Assistant**, you can provide a prompt, and it will generate high-quality blog posts, informative pages, well-organized lists, and thorough tables that meet your specific requirements.\n\nTo start using the **Jetpack AI Assistant**, type `/AI` in the block editor.',
				'jetpack'
			),
		},
	},
};
