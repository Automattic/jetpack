/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';

/**
 * Widget type definition.
 */
export default {
	name: 'jpa/hello-world',
	title: 'Hello World',
	icon: wordpress,
	presentation: 'full-bleed',
	attributes: [
		{
			id: 'message',
			label: 'Message',
			type: 'text',
		},
	],
	example: {
		attributes: {
			message: 'Hello World',
		},
	},
};
