/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type HelloWorldAttributes = {
	message?: string;
};

/**
 * Widget type definition.
 */
export default {
	attributes: [
		{
			id: 'message',
			label: __( 'Message', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
		},
	] as WidgetAttributeField< HelloWorldAttributes >[],
	example: {
		attributes: {
			message: __( 'Hello World', 'jetpack-premium-analytics-pkg' ),
		},
	},
};
