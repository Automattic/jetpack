/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const getFeatureCopy = featureSlug => {
	switch ( featureSlug ) {
		case 'creative-mail':
			return {
				configureButtonLabel: __( 'Set up', 'jetpack' ),
				displayName: __( 'Creative Mail', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Install', 'Jetpack' ),
			};
		case 'monitor':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Monitor', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'Jetpack' ),
			};
		case 'related-posts':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Related Posts', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'Jetpack' ),
			};
		case 'site-accelerator':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Site Accelerator', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'Jetpack' ),
			};
		case 'woocommerce':
			return {
				configureButtonLabel: __( 'Set up', 'jetpack' ),
				displayName: __( 'WooCommerce', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Install', 'Jetpack' ),
			};
		default:
			throw `Unknown feature slug in recommendations/feature-data.js: ${ featureSlug }`;
	}
};
