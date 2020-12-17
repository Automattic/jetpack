/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import { updateSettings } from 'state/settings';
import { fetchPluginsData } from 'state/site/plugins';

export const getStepContent = stepSlug => {
	switch ( stepSlug ) {
		case 'creative-mail':
			return {
				progressValue: '83',
				question: __(
					'Would you like to turn site visitors into subscribers with Creative Mail?',
					'jetpack'
				),
				description: __(
					'The Jetpack <strong>Newsletter Form</strong> combined with <strong>Creative Mail</strong> by Constant Contact can help automatically gather subscribers and send them beautiful emails. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink:
					'https://jetpack.com/support/jetpack-blocks/form-block/newsletter-sign-up-form/',
				ctaText: __( 'Install Creative Mail' ),
				illustrationPath: '/recommendations/creative-mail-illustration.svg',
			};
		case 'monitor':
			return {
				progressValue: '50',
				question: __(
					'Would you like Monitor to notify you if your site goes offline?',
					'jetpack'
				),
				description: __(
					'If your site ever goes down, <strong>Monitor</strong> will send you an email or push notitification to let you know. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: 'https://jetpack.com/support/monitor/',
				ctaText: __( 'Enable Monitor' ),
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
					'Displaying <strong>Related Posts</strong> at the end of your content keeps visitors engaged and on your site longer. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: 'https://jetpack.com/support/related-posts/',
				ctaText: __( 'Enable Related Posts' ),
				illustrationPath: '/recommendations/related-posts-illustration.png',
			};
		case 'site-accelerator':
			return {
				progressValue: '99',
				question: __( 'Would you like Site Accelerator to help your site load faster?', 'jetpack' ),
				description: __(
					'Faster sites get better ranking in search engines and help keep visitors on your site longer. <strong>Site Accerator</strong> will automatically optimize your image and files. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: 'https://jetpack.com/support/site-accelerator/',
				ctaText: __( 'Enable Site Accelerator' ),
				illustrationPath: '/recommendations/site-accelerator-illustration.svg',
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
				ctaText: __( 'Install WooCommerce' ),
				illustrationPath: '/recommendations/woocommerce-illustration.png',
			};
		default:
			throw `Unknown step slug in recommendations/question: ${ stepSlug }`;
	}
};

export const mapDispatchToProps = ( dispatch, stepSlug ) => {
	switch ( stepSlug ) {
		case 'creative-mail':
			return {
				enable: () => {
					restApi
						.installPlugin( 'creative-mail-by-constant-contact', 'recommendations' )
						.then( () => {
							dispatch( fetchPluginsData() );
						} );
				},
			};
		case 'monitor':
			return {
				enable: () => dispatch( updateSettings( { monitor: true } ) ),
			};
		case 'related-posts':
			return {
				enable: () => dispatch( updateSettings( { 'related-posts': true } ) ),
			};
		case 'site-accelerator':
			return {
				enable: () => dispatch( updateSettings( { photon: true, 'photon-cdn': true } ) ),
			};
		case 'woocommerce':
			return {
				enable: () => {
					restApi.installPlugin( 'woocommerce', 'recommendations' ).then( () => {
						dispatch( fetchPluginsData() );
					} );
				},
			};
		default:
			throw `Unknown step slug in recommendations/question: ${ stepSlug }`;
	}
};
