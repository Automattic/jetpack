/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 */
export default {
	name: 'jetpack/latest-emails',
	title: __( 'Latest emails', 'jetpack-stats-admin' ),
	icon: chartBar,
};
