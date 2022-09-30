import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import {
	PLAN_JETPACK_SECURITY_T1_YEARLY,
	PLAN_JETPACK_VIDEOPRESS,
	PLAN_JETPACK_ANTI_SPAM,
	PLAN_JETPACK_BACKUP_T1_YEARLY,
} from 'lib/plans/constants';
import { getSiteAdminUrl, getSiteRawUrl, getStaticProductsForPurchase } from 'state/initial-state';
import { updateSettings } from 'state/settings';
import { fetchPluginsData } from 'state/site/plugins';

export const mapStateToSummaryFeatureProps = ( state, featureSlug ) => {
	switch ( featureSlug ) {
		case 'boost':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Jetpack Boost', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Install', 'jetpack' ),
				configLink: getSiteAdminUrl( state ) + 'admin.php?page=jetpack-boost',
			};
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
		case 'protect':
			return {
				configureButtonLabel: __( 'Settings', 'jetpack' ),
				displayName: __( 'Jetpack Protect', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Install', 'jetpack' ),
				configLink: getSiteAdminUrl( state ) + 'admin.php?page=jetpack-protect',
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
		case 'videopress':
			return {
				configureButtonLabel: __( 'How To', 'jetpack' ),
				displayName: __( 'VideoPress', 'jetpack' ),
				summaryActivateButtonLabel: __( 'Enable', 'jetpack' ),
				configLink: getRedirectUrl( 'jetpack-support-videopress-block-editor' ),
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

export const getSummaryResourceProps = resourceSlug => {
	switch ( resourceSlug ) {
		case 'agency':
			return {
				displayName: __( 'Jetpack for Agencies', 'jetpack' ),
				ctaLabel: __( 'Sign Up', 'jetpack' ),
				ctaLink: getRedirectUrl( 'jetpack-for-agencies-signup-assistant-recommendation' ),
			};
		case 'backup-plan':
			return {
				displayName: __( 'Site Backups', 'jetpack' ),
				ctaLabel: __( 'Read More', 'jetpack' ),
				ctaLink: getRedirectUrl( 'jetpack-blog-backups-101' ),
			};
		case 'anti-spam':
			return {
				displayName: __( 'Spam Management', 'jetpack' ),
				ctaLabel: __( 'Read More', 'jetpack' ),
				ctaLink: getRedirectUrl( 'jetpack-blog-spam-comments' ),
			};
		default:
			throw `Unknown resource slug in getSummaryResourceProps() recommendations/feature-utils.js: ${ resourceSlug }`;
	}
};

export const mapDispatchToProps = ( dispatch, featureSlug ) => {
	switch ( featureSlug ) {
		case 'boost':
			return {
				activateFeature: () => {
					return restApi.installPlugin( 'jetpack-boost', 'recommendations' ).then( () => {
						return dispatch( fetchPluginsData() );
					} );
				},
			};
		case 'creative-mail':
			return {
				activateFeature: () => {
					return restApi
						.installPlugin( 'creative-mail-by-constant-contact', 'recommendations' )
						.then( () => {
							return dispatch( fetchPluginsData() );
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
		case 'protect':
			return {
				activateFeature: () => {
					return restApi.installPlugin( 'jetpack-protect', 'recommendations' ).then( () => {
						return dispatch( fetchPluginsData() );
					} );
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
		case 'videopress':
			return {
				activateFeature: () => {
					return dispatch( updateSettings( { videopress: true } ) );
				},
			};
		case 'woocommerce':
			return {
				activateFeature: () => {
					return restApi.installPlugin( 'woocommerce', 'recommendations' ).then( () => {
						return dispatch( fetchPluginsData() );
					} );
				},
			};
		default:
			throw `Unknown feature slug in mapDispatchToProps recommendations/feature-utils.js: ${ featureSlug }`;
	}
};

export const getStepContent = stepSlug => {
	switch ( stepSlug ) {
		case 'agency':
			return {
				progressValue: '28',
				question: __( 'Manage your clients’ sites with ease', 'jetpack' ),
				// eslint-disable-next-line @wordpress/i18n-translator-comments
				description: __(
					'Jetpack’s world-class security features are now easier to manage for anyone with at least five WordPress websites.<br/><br/>Purchase and manage licenses, and get a 60% discount with our licensing platform.<br/><br/><ExternalLink>Learn More</ExternalLink>',
					'jetpack'
				),
				descriptionLink: getRedirectUrl( 'jetpack-for-agencies-assistant-recommendation' ),
				ctaText: __( 'Get Jetpack for Agencies', 'jetpack' ),
				ctaLink: getRedirectUrl( 'jetpack-for-agencies-signup-assistant-recommendation' ),
				illustration: 'assistant-agency',
			};
		case 'backup-plan':
			return {
				question: __( 'Be prepared for auto-updates.', 'jetpack' ),
				description: __(
					'We noticed that you’ve recently enabled auto-updates for one of your plugins. Nice work, keeping plugins updated is vital for a healthy site!<br/><br/>Sometimes auto-updating plugins can cause unexpected changes on your site. Finding an older version of the plugin or learning how to install it to revert the changes can be challenging.<br/><br/>Here at Jetpack, we recommend regular backups of your site so you can go back in time with the click of a button.',
					'jetpack'
				),
				ctaText: __( 'Learn More About Site Backups', 'jetpack' ),
				ctaLink: getRedirectUrl( 'jetpack-blog-backups-101' ),
			};
		case 'boost':
			return {
				question: __( 'Get more views for your new page.', 'jetpack' ),
				description: __(
					'Fast websites mean more page visits and conversions. Even a one-second delay in loading times can reduce conversion rates by 20%.<br/><br/> Make your site blazing fast with <ExternalLink>Jetpack Boost’s</ExternalLink> simple dashboard and acceleration tool:',
					'jetpack'
				),
				descriptionList: [
					__( 'Optimize CSS loading', 'jetpack' ),
					__( 'Defer non-essential Javascript', 'jetpack' ),
					__( 'Lazy image loading and site performance scores', 'jetpack' ),
				],
				descriptionLink: getRedirectUrl( 'jetpack-plugin-boost-recommendation' ),
				ctaText: __( 'Install Jetpack Boost for free', 'jetpack' ),
			};
		case 'creative-mail':
			return {
				progressValue: '86',
				question: __( 'Would you like to turn site visitors into subscribers?', 'jetpack' ),
				description: __(
					'The Jetpack Newsletter Form combined with Creative Mail by Constant Contact can help automatically gather subscribers and send them beautiful emails. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink:
					'https://jetpack.com/support/jetpack-blocks/form-block/newsletter-sign-up-form/',
				ctaText: __( 'Install Creative Mail', 'jetpack' ),
				illustration: 'assistant-creative-mail',
			};
		case 'monitor':
			return {
				progressValue: '57',
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
				illustration: 'assistant-downtime-monitoring',
			};
		case 'related-posts':
			return {
				progressValue: '71',
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
				illustration: 'assistant-related-post',
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
				illustration: 'assistant-site-accelerator',
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
			};
		case 'protect':
			return {
				question: __( 'With more plugins comes more responsibility.', 'jetpack' ),
				description: __(
					'As you add plugins to your site, you have to start thinking about vulnerabilities.<br /><br /><strong>Jetpack Protect</strong> is a free security solution for WordPress that runs automated scans on your site and warns you about vulnerabilities.<br /><br />Focus on running your business while we protect your site with Jetpack Protect. <ExternalLink>Learn More</ExternalLink>.',
					'jetpack'
				),
				descriptionLink: getRedirectUrl( 'jetpack-protect-assistant-recommendation' ),
				ctaText: __( 'Install Protect for Free', 'jetpack' ),
			};
		case 'anti-spam':
			return {
				question: __( 'It’s time to block spam comments.', 'jetpack' ),
				description: __(
					'Congratulations! Your content is getting traction and receiving comments. The more popular your content is, the more likely it is you will be a target for spam comments. To ensure a great experience for your readers, we recommend manually moderating spam or using an automated product like Jetpack Anti-spam.',
					'jetpack'
				),
				ctaText: __( 'Learn how to block spam', 'jetpack' ),
				ctaLink: getRedirectUrl( 'jetpack-blog-spam-comments' ),
			};
		case 'videopress':
			return {
				question: __(
					'Share videos on your site to increase engagement and purchases.',
					'jetpack'
				),
				description: __(
					'No matter your business, adding videos to your site is essential for success. Jetpack VideoPress offers HD, ad-free video hosting, so you can keep the focus on your content. Try it for free or upgrade for more space. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: getRedirectUrl( 'jetpack-videopress' ),
				ctaText: __( 'Try VideoPress for free', 'jetpack' ),
			};
		case 'woocommerce':
			return {
				progressValue: '43',
				question: __( 'Would you like WooCommerce to power your store?', 'jetpack' ),
				description: __(
					'We’re partnered with <strong>WooCommerce</strong> — a customizable, open-source eCommerce platform built for WordPress. It’s everything you need to start selling products today. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: 'https://woocommerce.com/woocommerce-features/',
				ctaText: __( 'Install WooCommerce', 'jetpack' ),
				illustration: 'assistant-woo-commerce',
			};
		default:
			throw `Unknown step slug in recommendations/question: ${ stepSlug }`;
	}
};

// Gets data for the product suggestion card that can show on a recommendation step.
export const getProductCardData = ( state, productSlug ) => {
	const siteRawUrl = getSiteRawUrl( state );
	const products = getStaticProductsForPurchase( state );

	switch ( productSlug ) {
		// Security Plan
		case PLAN_JETPACK_SECURITY_T1_YEARLY:
			return {
				productCardTitle: __( 'Increase your site security!', 'jetpack' ),
				productCardCtaLink: getRedirectUrl( 'jetpack-recommendations-product-checkout', {
					site: siteRawUrl,
					path: productSlug,
				} ),
				productCardCtaText: __( 'Get Jetpack Security', 'jetpack' ),
				productCardList: products.security ? products.security.features : [],
				productCardIcon: '/recommendations/cloud-icon.svg',
			};
		case PLAN_JETPACK_ANTI_SPAM:
			return {
				productCardTitle: __( 'Block spam automatically with Jetpack Anti-spam', 'jetpack' ),
				productCardCtaLink: getRedirectUrl( 'jetpack-recommendations-product-checkout', {
					site: siteRawUrl,
					path: productSlug,
				} ),
				productCardCtaText: __( 'Get Anti-spam', 'jetpack' ),
				productCardList: products.akismet ? products.akismet.features : [],
				productCardIcon: '/recommendations/bug-icon.svg',
			};
		case PLAN_JETPACK_VIDEOPRESS:
			return {
				productCardTitle: __( 'Upgrade for more videos and storage', 'jetpack' ),
				productCardCtaLink: getRedirectUrl( 'jetpack-recommendations-product-checkout', {
					site: siteRawUrl,
					path: productSlug,
				} ),
				productCardCtaText: __( 'Get VideoPress', 'jetpack' ),
				productCardList: products.videopress ? products.videopress.features : [],
				productCardIcon: '/recommendations/video-icon.svg',
			};
		case PLAN_JETPACK_BACKUP_T1_YEARLY:
			return {
				productCardTitle: __( 'Go back in time with one click', 'jetpack' ),
				productCardCtaLink: getRedirectUrl( 'jetpack-recommendations-product-checkout', {
					site: siteRawUrl,
					path: productSlug,
				} ),
				productCardCtaText: __( 'Get Jetpack Backup', 'jetpack' ),
				productCardList: products.backup ? products.backup.features : [],
				productCardIcon: '/recommendations/cloud-icon.svg',
				productCardDisclaimer: products.backup ? products.backup.disclaimer : '',
			};
		default:
			throw `Unknown product slug for getProductCardData: ${ productSlug }`;
	}
};

// Sets step-specific props for when products are shown on different recommendation steps
// Important that this be called after getProductCardData when setting up props
export const getProductCardDataStepOverrides = ( state, productSlug, stepSlug ) => {
	switch ( productSlug ) {
		case PLAN_JETPACK_SECURITY_T1_YEARLY:
			if ( stepSlug === 'publicize' ) {
				return {
					productCardTitle: __( 'Your site is growing. It’s time for a security plan.', 'jetpack' ),
				};
			} else if ( stepSlug === 'protect' ) {
				return {
					productCardTitle: __(
						'Jetpack Security gives you complete site protection and backups.',
						'jetpack'
					),
				};
			}
			break;
	}

	return {};
};
