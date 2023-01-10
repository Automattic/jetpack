import { useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'ai-paragraph';
export const title = __( 'Jetpack AI Paragraph (Experimental)', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description: (
		<Fragment>
			<p>
				{ __(
					'Automatically generate new paragraphs using your existing content, powered by AI magic. We are experimenting with this feature and can tweak or remove it at any point.',
					'jetpack'
				) }
			</p>
		</Fragment>
	),
	icon: {
		src: 'welcome-write-blog',
		foreground: getIconColor(),
	},
	category: 'text',
	keywords: [ 'AI', 'GPT' ],
	supports: {
		// Support for block's alignment (left, center, right, wide, full). When true, it adds block controls to change block’s alignment.
		align: true /* if set to true, the 'align' option below can be used*/,
		// Pick which alignment options to display.
		/*align: [ 'left', 'right', 'full' ],*/
		// Support for wide alignment, that requires additional support in themes.
		alignWide: true,
		// When true, a new field in the block sidebar allows to define an id for the block and a button to copy the direct link.
		anchor: true,
		// When true, a new field in the block sidebar allows to define a custom className for the block’s wrapper.
		customClassName: true,
		// When false, Gutenberg won't add a class like .wp-block-your-block-name to the root element of your saved markup
		className: true,
		// Setting this to false suppress the ability to edit a block’s markup individually. We often set this to false in Jetpack blocks.
		html: true,
		// Passing false hides this block in Gutenberg's visual inserter.
		/*inserter: true,*/
		// When false, user will only be able to insert the block once per post.
		multiple: true,
		// When false, the block won't be available to be converted into a reusable block.
		reusable: false,
	},
	edit,
	save: attrs => {
		const blockProps = useBlockProps.save();
		return <div { ...blockProps }>{ attrs.attributes.content }</div>;
	},
	attributes,
	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/paragraph', {
						content,
					} );
				},
			},
		],
	},
	example: {
		attributes: {
			requestedPrompt: true,
			content: __( "I'm afraid I can't do that, Dave.", 'jetpack' ),
		},
	},
};
