/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postAuthor } from '@wordpress/icons';

/**
 * Widget type definition.
 */
export default {
	name: 'jpa/authors',
	title: __( 'Authors', 'jetpack-premium-analytics' ),
	icon: postAuthor,
	attributes: [
		{
			id: 'max',
			label: __( 'Maximum authors', 'jetpack-premium-analytics' ),
			type: 'text',
		},
	],
	example: {
		attributes: {
			max: '7',
		},
	},
};
