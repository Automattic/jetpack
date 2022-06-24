import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import {
	PLAN_JETPACK_SECURITY_T1_YEARLY,
	PLAN_JETPACK_VIDEOPRESS,
	PLAN_JETPACK_ANTI_SPAM,
} from 'lib/plans/constants';
import { getSiteAdminUrl, getSiteRawUrl, getStaticProductsForPurchase } from 'state/initial-state';
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

export const mapStateToSummaryResourceProps = ( state, resourceSlug ) => {
	switch ( resourceSlug ) {
		case 'security-plan':
			return {
				displayName: __( 'Site Security', 'jetpack' ),
				ctaLabel: __( 'Read More', 'jetpack' ),
				ctaLink: getRedirectUrl( 'jetpack-blog-wordpress-security-for-beginners' ),
			};
		case 'anti-spam':
			return {
				displayName: __( 'Spam Management', 'jetpack' ),
				ctaLabel: __( 'Read More', 'jetpack' ),
				ctaLink: getRedirectUrl( 'jetpack-blog-spam-comments' ),
			};
		default:
			throw `Unknown resource slug in mapStateToSummaryResourceProps() recommendations/feature-utils.js: ${ resourceSlug }`;
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
				illustration: 'assistant-creative-mail',
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
				illustration: 'assistant-downtime-monitoring',
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
		case 'security-plan':
			return {
				question: __( 'With more plugins comes more responsibility.', 'jetpack' ),
				description: __(
					'As you add plugins to your site, you have to start thinking about vulnerabilities, failed updates, and incompatible plugins. You should ensure that the plugins you install:',
					'jetpack'
				),
				descriptionList: [
					__( 'Have good user ratings', 'jetpack' ),
					__( 'Are compatible with the most recent version of WordPress', 'jetpack' ),
					__( 'Are developed by teams that respond to support requests promptly', 'jetpack' ),
				],
				descriptionSecondary: __(
					'Or let Jetpack handle your security and backups so you can focus on your business.',
					'jetpack'
				),
				ctaText: __( 'Read WordPress Security for Beginners', 'jetpack' ),
				ctaLink: getRedirectUrl( 'jetpack-blog-wordpress-security-for-beginners' ),
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
				progressValue: '33',
				question: __( 'Would you like WooCommerce to power your store?', 'jetpack' ),
				description: __(
					'We’re partnered with <strong>WooCommerce</strong> — a customizable, open-source eCommerce platform built for WordPress. It’s everything you need to start selling products today. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				descriptionLink: 'https://woocommerce.com/woocommerce-features/',
				ctaText: __( 'Install WooCommerce', 'jetpack' ),
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
			} else if ( stepSlug === 'security-plan' ) {
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
