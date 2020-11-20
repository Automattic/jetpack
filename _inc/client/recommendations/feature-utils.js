/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import restApi from 'rest-api';

/**
 * Internal dependencies
 */
import { getSiteAdminUrl } from 'state/initial-state';
import { updateSettings } from 'state/settings';
import { fetchPluginsData } from 'state/site/plugins';

export const getFeatureState = ( state, featureSlug ) => {
	switch ( featureSlug ) {
		case 'creative-mail':
			return {
				configureButtonLabel: __( 'Set up', 'jetpack' ),
				displayName: __( 'Creative Mail', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Install', 'Jetpack' ),
				configLink: getSiteAdminUrl( state ) + 'admin.php?page=creativemail',
			};
		case 'monitor':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Monitor', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'Jetpack' ),
				configLink: '#/settings?term=monitor',
			};
		case 'related-posts':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Related Posts', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'Jetpack' ),
				configLink: '#/settings?term=related%20posts',
			};
		case 'site-accelerator':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Site Accelerator', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'Jetpack' ),
				configLink: '#/settings?term=image%20optimize',
			};
		case 'woocommerce':
			return {
				configureButtonLabel: __( 'Set up', 'jetpack' ),
				displayName: __( 'WooCommerce', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Install', 'Jetpack' ),
				configLink: getSiteAdminUrl( state ) + 'admin.php?page=wc-admin&path=%2Fsetup-wizard',
			};
		default:
			throw `Unknown feature slug in getFeatureState() recommendations/feature-utils.js: ${ featureSlug }`;
	}
};

export const getFeatureDispatch = ( dispatch, featureSlug ) => {
	switch ( featureSlug ) {
		case 'creative-mail':
			return {
				activateFeature: () => {
					return restApi
						.installPlugin( 'creative-mail-by-constant-contact', 'recommendations' )
						.then( () => {
							dispatch( fetchPluginsData() );
						} );
				},
			};
		case 'monitor':
			return {
				activateFeature: () => {
					return dispatch( updateSettings( { monitor: true } ) );
				},
			};
		case 'related-posts':
			return {
				activateFeature: () => {
					return dispatch( updateSettings( { 'related-posts': true } ) );
				},
			};
		case 'site-accelerator':
			return {
				activateFeature: () => {
					return dispatch( updateSettings( { photon: true, 'photon-cdn': true } ) );
				},
			};
		case 'woocommerce':
			return {
				activateFeature: () => {
					return restApi.installPlugin( 'woocommerce', 'recommendations' ).then( () => {
						dispatch( fetchPluginsData() );
					} );
				},
			};
		default:
			throw `Unknown feature slug in getFeatureDispatch recommendations/feature-utils.js: ${ featureSlug }`;
	}
};
