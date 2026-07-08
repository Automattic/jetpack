/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';

/**
 * Widget attributes shape.
 */
export type HelloWorldAttributes = {
	message?: string;
};

/**
 * Widget type definition.
 */
export default {
	name: 'jpa/hello-world',
	title: __( 'Hello World', 'jetpack-premium-analytics' ),
	icon: wordpress,
	attributes: [
		{
			id: 'message',
			label: __( 'Message', 'jetpack-premium-analytics' ),
			type: 'text',
		},
	],
	example: {
		attributes: {
			message: __( 'Hello World', 'jetpack-premium-analytics' ),
		},
	},
};
