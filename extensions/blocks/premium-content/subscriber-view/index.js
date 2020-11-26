/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import deprecated from './deprecated/v1';
import icon from '../_inc/icon.js';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const name = 'premium-content/subscriber-view';
const settings = {
	attributes: {},
	/* translators: block name */
	title: __( 'Subscriber View', 'jetpack' ),
	/* translators: block description */
	description: __( 'Subscriber View.', 'jetpack' ),
	category: 'grow',
	parent: [ 'premium-content/container' ],
	supports: {
		// Hide this block from the inserter.
		inserter: false,
		html: false,
	},
	edit,
	icon,
	save,
	deprecated,
};

export { name, settings };
