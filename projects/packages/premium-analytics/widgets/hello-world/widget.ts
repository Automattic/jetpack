/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export type HelloWorldAttributes = {
	message?: string;
};

/**
 * Widget type definition.
 */
export default {
	example: {
		attributes: {
			message: __( 'Hello World', 'jetpack-premium-analytics-pkg' ),
		},
	},
};
