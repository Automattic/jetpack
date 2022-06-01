import { compose, ifCondition } from '@wordpress/compose';
import { withSelect, select, subscribe } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { registerFormatType, unregisterFormatType } from '@wordpress/rich-text';
import icon from '../_inc/icon.js';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'premium-content/logged-out-view';
const settings = {
	title: __( 'Guest View', 'jetpack' ),
	description: __(
		'The container for all content shown to site visitors who are not subscribers.',
		'jetpack'
	),
	icon,
	category: 'grow',
	parent: [ 'premium-content/container' ],
	supports: {
		inserter: false,
		html: false,
	},
	edit,
	save,
	deprecated,
};

/**
 * Modify the rich text link button to not be enabled on the logged-in view (This is visible when the block is selected
 * (including when the buttons are selected).
 *
 * This gets wrapped in `subscribe` to return an unsubscribe function which we can call to unregister the function after
 * the rich text data is defined.
 */
// @ts-ignore
const unsubscribe = subscribe( () => {
	// Keep running until the 'core/link' format is defined
	const linkFormat = select( 'core/rich-text' ).getFormatType( 'core/link' );
	if ( ! linkFormat ) {
		return;
	}
	// It's defined so we can stop after this iteration...
	// @ts-ignore
	unsubscribe();

	unregisterFormatType( 'core/link' );

	// Use the existing link button functionality but limit it so that it doesn't run inside this view.
	const newLinkButton = compose(
		withSelect( composeSelect => {
			return {
				selectedBlock: composeSelect( 'core/block-editor' ).getSelectedBlock(),
			};
		} ),
		// @ts-ignore
		ifCondition( props => {
			// @ts-ignore
			return props.selectedBlock && props.selectedBlock.name !== name;
		} )
		// @ts-ignore
	)( linkFormat.edit );

	// Overwrite the previous 'core/link' so others can extend
	registerFormatType( 'core/link', {
		...linkFormat,
		// @ts-ignore
		edit: newLinkButton,
	} );
} );

export { name, settings };
