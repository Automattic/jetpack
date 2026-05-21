/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 */
export default {
	name: 'jetpack/newsletter-subscribers',
	title: __( 'Newsletter subscribers', 'jetpack-stats-admin' ),
	icon: chartBar,
};
