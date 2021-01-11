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
	title: __( 'Subscriber View', 'jetpack' ),
	description: __( 'Subscriber View.', 'jetpack' ),
	icon,
	category: 'grow',
	attributes: {},
	edit,
	save,
	parent: [ 'premium-content/container' ],
	supports: {
		inserter: false,
		html: false,
	},
	deprecated,
};

export { name, settings };
