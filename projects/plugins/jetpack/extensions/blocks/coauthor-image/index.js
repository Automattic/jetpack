import { useBlockProps } from '@wordpress/block-editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'coauthor-image';
export const title = __( 'Coauthor Image (Experimental)', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description: (
		<Fragment>
			<p>
				{ __( 'Automatically generate an illustration for your post, powered by AI.', 'jetpack' ) }
			</p>
		</Fragment>
	),
	icon: {
		src: 'welcome-write-blog',
		foreground: getIconColor(),
	},
	category: 'common',
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
	save: args => {
		const blockProps = useBlockProps.save();
		return <div { ...blockProps }>{ args.attributes.content }</div>;
	},
	attributes,
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
};
