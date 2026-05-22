/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';

/**
 * Widget type definition.
 */
export default {
	name: 'jetpack/latest-responses',
	title: __( 'Latest responses', 'jetpack-forms' ),
	icon: envelope,
};
