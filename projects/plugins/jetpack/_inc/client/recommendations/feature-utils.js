/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { getSiteAdminUrl, getSiteRawUrl } from 'state/initial-state';
import { updateSettings } from 'state/settings';
import { fetchPluginsData } from 'state/site/plugins';

export const mapStateToSummaryFeatureProps = ( state, featureSlug ) => {
	switch ( featureSlug ) {
		case 'creative-mail':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Creative Mail', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Install', 'jetpack' ),
				configLink: getSiteAdminUrl( state ) + 'admin.php?page=creativemail',
			};
		case 'monitor':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Downtime Monitoring', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'jetpack' ),
				configLink: '#/settings?term=monitor',
			};
		case 'related-posts':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Related Posts', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'jetpack' ),
				configLink: '#/settings?term=related%20posts',
			};
		case 'site-accelerator':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Site Accelerator', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'jetpack' ),
				configLink: '#/settings?term=cdn',
			};
		case 'publicize':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Social Media Sharing', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'jetpack' ),
				configLink: getRedirectUrl( 'calypso-marketing-connections', {
					site: getSiteRawUrl( state ),
				} ),
			};
		case 'woocommerce':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'WooCommerce', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Install', 'jetpack' ),
				configLink: getSiteAdminUrl( state ) + 'admin.php?page=wc-admin&path=%2Fsetup-wizard',
			};
		default:
			throw `Unknown feature slug in mapStateToSummaryFeatureProps() recommendations/feature-utils.js: ${ featureSlug }`;
	}
};

export const mapDispatchToProps = ( dispatch, featureSlug ) => {
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
					return dispatch(
						updateSettings( {
							photon: true,
							'photon-cdn': true,
							tiled_galleries: true,
							'tiled-gallery': true,
						} )
					);
				},
			};
		case 'publicize':
			return {
				activateFeature: () => {
					return dispatch( updateSettings( { publicize: true } ) );
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
			throw `Unknown feature slug in mapDispatchToProps recommendations/feature-utils.js: ${ featureSlug }`;
	}
};

export const getStepContent = stepSlug => {
	switch ( stepSlug ) {
		case 'creative-mail':
			return {
				progressValue: '83',
				question: __( 'Would you like to turn site visitors into subscribers?', 'jetpack' ),
				description: __(
					'The Jetpack Newsletter Form combined with Creative Mail by Constant Contact can help automatically gather subscribers and send them beautiful emails. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink:
					'https://jetpack.com/support/jetpack-blocks/form-block/newsletter-sign-up-form/',
				ctaText: __( 'Install Creative Mail', 'jetpack' ),
				illustrationPath: '/recommendations/creative-mail-illustration.svg',
			};
		case 'monitor':
			return {
				progressValue: '50',
				question: __(
					'Would you like Downtime Monitoring to notify you if your site goes offline?',
					'jetpack'
				),
				description: __(
					'If your site ever goes down, Downtime Monitoring will send you an email or push notitification to let you know. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: 'https://jetpack.com/support/monitor/',
				ctaText: __( 'Enable Downtime Monitoring', 'jetpack' ),
				illustrationPath: '/recommendations/monitor-illustration.svg',
			};
		case 'related-posts':
			return {
				progressValue: '67',
				question: __(
					'Would you like Related Posts to display at the bottom of your content?',
					'jetpack'
				),
				description: __(
					'Displaying Related Posts at the end of your content keeps visitors engaged and on your site. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: 'https://jetpack.com/support/related-posts/',
				ctaText: __( 'Enable Related Posts', 'jetpack' ),
				illustrationPath: '/recommendations/related-posts-illustration.jpg',
			};
		case 'site-accelerator':
			return {
				progressValue: '99',
				question: __( 'Would you like your site to load faster?', 'jetpack' ),
				description: __(
					'Faster sites get better ranking in search engines and help keep visitors on your site longer. Jetpack will automatically optimize and load your images and files from our global Content Delivery Network (CDN). <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: 'https://jetpack.com/support/site-accelerator/',
				ctaText: __( 'Enable Site Accelerator', 'jetpack' ),
				illustrationPath: '/recommendations/site-accelerator-illustration.svg',
			};
		case 'publicize':
			return {
				question: __(
					'Automatically share your posts to social media to grow your audience.',
					'jetpack'
				),
				description: __(
					'It’s easy to share your content to a wider audience by connecting your social media accounts to Jetpack. When you publish a post, it will automatically appear on all your favorite platforms. Best of all, it’s free. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: getRedirectUrl( 'jetpack-blog-social-sharing' ),
				ctaText: __( 'Enable Social Media Sharing', 'jetpack' ),
				illustrationPath: '/recommendations/general-illustration.png',
				rnaIllustration: true,
			};
		case 'woocommerce':
			return {
				progressValue: '33',
				question: __( 'Would you like WooCommerce to power your store?', 'jetpack' ),
				description: __(
					'We’re partnered with <strong>WooCommerce</strong> — a customizable, open-source eCommerce platform built for WordPress. It’s everything you need to start selling products today. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: 'https://woocommerce.com/woocommerce-features/',
				ctaText: __( 'Install WooCommerce', 'jetpack' ),
				illustrationPath: '/recommendations/woocommerce-illustration.jpg',
			};
		default:
			throw `Unknown step slug in recommendations/question: ${ stepSlug }`;
	}
};
