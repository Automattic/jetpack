/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { get, rest } from 'lodash';

/**
 * Internal dependencies
 */
import getRedirectUrl from 'lib/jp-redirect';
import { getPlanClass } from 'lib/plans/constants';
import restApi from 'rest-api';
import { getVaultPressData, isAkismetKeyValid } from 'state/at-a-glance';
import { getSiteRawUrl, getSiteAdminUrl } from 'state/initial-state';
import { getRewindStatus } from 'state/rewind';
import { getSetting, updateSettings } from 'state/settings';
import {
	getActiveBackupPurchase,
	getActiveScanPurchase,
	getSitePlan,
	hasActiveBackupPurchase,
	hasActiveScanPurchase,
	hasActiveSearchPurchase,
} from 'state/site';
import { fetchPluginsData, isPluginActive } from 'state/site/plugins';

function getInfoString( productName ) {
	return sprintf(
		/* translators: placeholder is a product name, such as Jetpack Backups. */
		__( 'Included with %s', 'jetpack' ),
		productName
	);
}

const features = {
	ads: {
		mapStateToProps: state => {
			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );
			const siteRawUrl = getSiteRawUrl( state );

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = getRedirectUrl( 'jetpack-setup-wizard-ads-upgrade', {
					site: siteRawUrl,
				} );
			}

			let info;
			let configureLink;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
				configureLink = '#/settings?term=wordads';
			}

			return {
				feature: 'ads',
				title: __( 'Ads', 'jetpack' ),
				details: __( 'Generate income with high-quality ads.', 'jetpack' ),
				checked: getSetting( state, 'wordads' ),
				isPaid: true,
				configureLink,
				upgradeLink,
				info,
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { wordads: ! currentCheckedValue } ) );
				},
			};
		},
	},

	'anti-spam': {
		mapStateToProps: state => {
			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );
			const siteRawUrl = getSiteRawUrl( state );

			const inCurrentPlan = [ 'is-personal-plan', 'is-premium-plan', 'is-business-plan' ].includes(
				planClass
			);

			let optionsLink;
			let isOptionsLinkExternal = false;
			if ( inCurrentPlan ) {
				optionsLink = getRedirectUrl( 'jetpack-setup-wizard-anti-spam-get-started', {
					site: siteRawUrl,
				} );
				isOptionsLinkExternal = true;
			}

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = getRedirectUrl( 'jetpack-setup-wizard-antispam-upgrade', {
					site: siteRawUrl,
				} );
			}

			let info;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
			}

			return {
				feature: 'anti-spam',
				title: __( 'Anti-spam', 'jetpack' ),
				details: __( 'No more approving or vetting.', 'jetpack' ),
				checked: true === isAkismetKeyValid( state ),
				isDisabled: inCurrentPlan,
				isPaid: true,
				optionsLink,
				isOptionsLinkExternal,
				upgradeLink,
				info,
			};
		},
	},

	backups: {
		mapStateToProps: state => {
			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );
			const siteRawUrl = getSiteRawUrl( state );
			const isBackupsPurchased =
				hasActiveBackupPurchase( state ) ||
				[
					'is-personal-plan',
					'is-premium-plan',
					'is-business-plan',
					'is-daily-backup-plan',
					'is-realtime-backup-plan',
				].includes( planClass );

			let optionsLink;
			if ( isBackupsPurchased ) {
				optionsLink = '#/settings?term=backup';
			}

			let upgradeLink;
			if ( ! isBackupsPurchased ) {
				upgradeLink = getRedirectUrl( 'jetpack-setup-wizard-backups-upgrade', {
					site: siteRawUrl,
				} );
			}

			let info;
			if ( isBackupsPurchased ) {
				const backupsPurchase = getActiveBackupPurchase( state );
				const productName = backupsPurchase ? backupsPurchase.product_name : sitePlan.product_name;
				info = getInfoString( productName );
			}

			return {
				feature: 'backups',
				title: __( 'Daily or Real-time backups', 'jetpack' ),
				details: __( 'Get time travel for your site with Jetpack Backup.', 'jetpack' ),
				checked: isBackupsPurchased,
				isDisabled: isBackupsPurchased,
				optionsLink,
				upgradeLink,
				info,
				isPaid: true,
			};
		},
	},

	'beautiful-math': {
		mapStateToProps: state => {
			return {
				feature: 'beautiful-math',
				title: __( 'Beautiful math', 'jetpack' ),
				details: __( 'Display math and formulas beautifully.', 'jetpack' ),
				checked: getSetting( state, 'latex' ),
				optionsLink: '#/settings?term=latex',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { latex: ! currentCheckedValue } ) );
				},
			};
		},
	},

	'brute-force-protect': {
		mapStateToProps: state => {
			return {
				feature: 'brute-force-protect',
				title: __( 'Brute force protection', 'jetpack' ),
				details: __( 'Stop malicious login attempts.', 'jetpack' ),
				checked: getSetting( state, 'protect' ),
				optionsLink: '#/settings?term=brute%20force',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { protect: ! currentCheckedValue } ) );
				},
			};
		},
	},

	carousel: {
		mapStateToProps: state => {
			return {
				feature: 'carousel',
				title: __( 'Carousel', 'jetpack' ),
				details: __(
					'Create full-screen carousel slideshows for the images in your posts and pages.',
					'jetpack'
				),
				checked: getSetting( state, 'carousel' ),
				optionsLink: '#/settings?term=carousel',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { carousel: ! currentCheckedValue } ) );
				},
			};
		},
	},

	'comment-likes': {
		mapStateToProps: state => {
			return {
				feature: 'comment-likes',
				title: __( 'Comment Likes', 'jetpack' ),
				details: __( 'Increase engagement with liking on comments.', 'jetpack' ),
				checked: getSetting( state, 'comment-likes' ),
				optionsLink: '#/settings?term=comment%20likes',
			};
		},

		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'comment-likes': ! currentCheckedValue } ) );
				},
			};
		},
	},

	comments: {
		mapStateToProps: state => {
			return {
				feature: 'comments',
				title: __( 'Comments', 'jetpack' ),
				details: __( 'An enhanced comments section with better verfiication.', 'jetpack' ),
				checked: getSetting( state, 'comments' ),
				optionsLink: '#/settings?term=comments',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { comments: ! currentCheckedValue } ) );
				},
			};
		},
	},

	'contact-form': {
		mapStateToProps: state => {
			return {
				feature: 'contact-form',
				title: __( 'Contact Form', 'jetpack' ),
				details: __( 'Add contact forms using the block editor.', 'jetpack' ),
				checked: getSetting( state, 'contact-form' ),
				optionsLink: '#/settings?term=contact%20form',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'contact-form': ! currentCheckedValue } ) );
				},
			};
		},
	},

	'copy-post': {
		mapStateToProps: state => {
			return {
				feature: 'copy-post',
				title: __( 'Copy Post', 'jetpack' ),
				details: __( 'Simply duplicate content.', 'jetpack' ),
				checked: getSetting( state, 'copy-post' ),
				optionsLink: '#/settings?term=copy%20post',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'copy-post': ! currentCheckedValue } ) );
				},
			};
		},
	},

	'creative-mail': {
		mapStateToProps: state => {
			const isCreativeMailActive = isPluginActive(
				state,
				'creative-mail-by-constant-contact/creative-mail-plugin.php'
			);
			const siteAdminUrl = getSiteAdminUrl( state );
			const creativeMailConfigureLink = siteAdminUrl + 'admin.php?page=creativemail';

			return {
				feature: 'creative-mail',
				title: __( 'Creative Mail by Constant Contact', 'jetpack' ),
				details: __( 'Turn visitors into subscribers with email marketing.', 'jetpack' ),
				checked: isCreativeMailActive,
				isDisabled: true,
				isPaid: true,
				configureLink: isCreativeMailActive ? creativeMailConfigureLink : null,
				learnMoreLink:
					'https://jetpack.com/support/jetpack-blocks/form-block/newsletter-sign-up-form/',
				isLearnMoreLinkExternal: true,
			};
		},
		mapDispatchToProps: dispatch => {
			const installAndRefreshPluginData = () => {
				return restApi
					.installPlugin( 'creative-mail-by-constant-contact', 'setup-wizard' )
					.then( () => {
						dispatch( fetchPluginsData() );
					} );
			};

			return {
				onInstallClick: () => installAndRefreshPluginData(),
			};
		},
	},

	'custom-css': {
		mapStateToProps: state => {
			return {
				feature: 'custom-css',
				title: __( 'Custom CSS', 'jetpack' ),
				details: __( 'Enable an enhanced CSS customization panel.', 'jetpack' ),
				checked: getSetting( state, 'custom-css' ),
				optionsLink: '#/settings?term=custom%20css',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'custom-css': ! currentCheckedValue } ) );
				},
			};
		},
	},

	'enhanced-distribution': {
		mapStateToProps: state => {
			return {
				feature: 'enhanced-distribution',
				title: __( 'Enhanced Distribution', 'jetpack' ),
				details: __( 'Increase reach and traffic.', 'jetpack' ),
				checked: getSetting( state, 'enhanced-distribution' ),
				optionsLink: '#/traffic?term=enhanced',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'enhanced-distribution': ! currentCheckedValue } ) );
				},
			};
		},
	},

	'extra-sidebar-widgets': {
		mapStateToProps: state => {
			return {
				feature: 'extra-sidebar-widgets',
				title: __( 'Extra Sidebar Widgets', 'jetpack' ),
				details: __( 'Add more widgets.', 'jetpack' ),
				checked: getSetting( state, 'widgets' ),
				optionsLink: '#/traffic?term=extra',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { widgets: ! currentCheckedValue } ) );
				},
			};
		},
	},

	'google-analytics': {
		mapStateToProps: state => {
			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );
			const siteRawUrl = getSiteRawUrl( state );

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = getRedirectUrl( 'jetpack-setup-wizard-google-analytics-upgrade', {
					site: siteRawUrl,
				} );
			}

			let info;
			let configureLink;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
				configureLink = '#/settings?term=google%20analytics';
			}

			return {
				feature: 'google-analytics',
				title: __( 'Google Analytics', 'jetpack' ),
				details: __( 'Add your Google Analytics account.', 'jetpack' ),
				checked: getSetting( state, 'google-analytics' ),
				isPaid: true,
				configureLink,
				upgradeLink,
				info,
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'google-analytics': ! currentCheckedValue } ) );
				},
			};
		},
	},

	'gravatar-hovercards': {
		mapStateToProps: state => {
			return {
				feature: 'gravatar-hovercards',
				title: __( 'Gravatar Hovercards', 'jetpack' ),
				details: __( 'Give comments life.', 'jetpack' ),
				checked: getSetting( state, 'gravatar-hovercards' ),
				optionsLink: '#/traffic?term=hovercards',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'gravatar-hovercards': ! currentCheckedValue } ) );
				},
			};
		},
	},

	'infinite-scroll': {
		mapStateToProps: state => {
			return {
				feature: 'infinite-scroll',
				title: __( 'Infinite Scroll', 'jetpack' ),
				details: __(
					'Create a smooth, uninterrupted reading experience by loading more content as visitors scroll to the bottom of your archive pages.',
					'jetpack'
				),
				checked: !! getSetting( state, 'infinite-scroll' ),
				optionsLink: '#/settings?term=infinite',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					if ( currentCheckedValue ) {
						return dispatch( updateSettings( { 'infinite-scroll': false } ) );
					}
					return dispatch( updateSettings( { 'infinite-scroll': true, infinite_scroll: true } ) );
				},
			};
		},
	},

	'json-api': {
		mapStateToProps: state => {
			return {
				feature: 'json-api',
				title: __( 'JSON API', 'jetpack' ),
				details: __( 'JSON API access for developers.', 'jetpack' ),
				checked: getSetting( state, 'json-api' ),
				optionsLink: '/wp-admin/admin.php?page=jetpack#/traffic?term=json',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'json-api': ! currentCheckedValue } ) );
				},
			};
		},
	},

	'lazy-images': {
		mapStateToProps: state => {
			return {
				feature: 'lazy-images',
				title: __( 'Lazy Loading Images', 'jetpack' ),
				details: __( 'Further improve site speed and only load images visitors need.', 'jetpack' ),
				checked: getSetting( state, 'lazy-images' ),
				optionsLink: '#/settings?term=lazy',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'lazy-images': ! currentCheckedValue } ) );
				},
			};
		},
	},

	likes: {
		mapStateToProps: state => {
			return {
				feature: 'likes',
				title: __( 'Likes', 'jetpack' ),
				details: __( 'Add a like button to your posts.', 'jetpack' ),
				checked: getSetting( state, 'likes' ),
				optionsLink: '#/settings?term=likes',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { likes: ! currentCheckedValue } ) );
				},
			};
		},
	},

	markdown: {
		mapStateToProps: state => {
			return {
				feature: 'markdown',
				title: __( 'Markdown', 'jetpack' ),
				details: __( 'Write faster rich-text.', 'jetpack' ),
				checked: getSetting( state, 'markdown' ),
				optionsLink: '#/traffic?term=markdown',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { markdown: ! currentCheckedValue } ) );
				},
			};
		},
	},

	masterbar: {
		mapStateToProps: state => {
			return {
				feature: 'masterbar',
				title: __( 'WordPress.com Toolbar', 'jetpack' ),
				details: __(
					'The WordPress.com toolbar replaces the default WordPress admin toolbar.',
					'jetpack'
				),
				checked: getSetting( state, 'masterbar' ),
				optionsLink: '#/settings?term=toolbar',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { masterbar: ! currentCheckedValue } ) );
				},
			};
		},
	},

	monitor: {
		mapStateToProps: state => {
			return {
				feature: 'monitor',
				title: __( 'Downtime Monitoring', 'jetpack' ),
				details: __( 'Get an alert immediately if your site goes down.', 'jetpack' ),
				checked: getSetting( state, 'monitor' ),
				optionsLink: '#/settings?term=monitor',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { monitor: ! currentCheckedValue } ) );
				},
			};
		},
	},

	notifications: {
		mapStateToProps: state => {
			return {
				feature: 'notifications',
				title: __( 'Notifications', 'jetpack' ),
				details: __( 'Stay up-to-date with your site.', 'jetpack' ),
				checked: getSetting( state, 'notes' ),
				optionsLink: '#/settings?term=push',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { notes: ! currentCheckedValue } ) );
				},
			};
		},
	},

	portfolio: {
		mapStateToProps: state => {
			return {
				feature: 'portfolio',
				title: __( 'Portfolio: Custom content types', 'jetpack' ),
				details: __( 'Use portfolios on your site to showcase your best work.', 'jetpack' ),
				checked: getSetting( state, 'jetpack_portfolio' ),
				optionsLink: '/wp-admin/admin.php?page=jetpack#/settings?term=portfolios',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( ( dispatchProp, getState ) => {
						const jetpack_portfolio = ! currentCheckedValue;
						const jetpack_testimonial = getSetting( getState(), 'jetpack_testimonial' );
						const customContentTypes = jetpack_portfolio || jetpack_testimonial;
						return dispatchProp(
							updateSettings( {
								jetpack_portfolio,
								'custom-content-types': customContentTypes,
							} )
						);
					} );
				},
			};
		},
	},

	'post-by-email': {
		mapStateToProps: state => {
			return {
				feature: 'post-by-email',
				title: __( 'Post by email', 'jetpack' ),
				details: __(
					'Post by email is a quick way to publish new posts without visiting your site.',
					'jetpack'
				),
				checked: getSetting( state, 'post-by-email' ),
				configureLink: '#/traffic?term=post%20by%20email',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'post-by-email': ! currentCheckedValue } ) );
				},
			};
		},
	},

	publicize: {
		mapStateToProps: state => {
			const siteRawUrl = getSiteRawUrl( state );

			return {
				feature: 'publicize',
				title: __( 'Publicize', 'jetpack' ),
				details: __(
					'Automaticaly share content on your favorite social media accounts.',
					'jetpack'
				),
				checked: getSetting( state, 'publicize' ),
				configureLink: getRedirectUrl( 'calypso-marketing-connections', { site: siteRawUrl } ),
				isButtonLinkExternal: true,
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { publicize: ! currentCheckedValue } ) );
				},
			};
		},
	},

	'related-posts': {
		mapStateToProps: state => {
			return {
				feature: 'related-posts',
				title: __( 'Related posts', 'jetpack' ),
				details: __(
					'Keep your visitors engaged with related content at the bottom of each post.',
					'jetpack'
				),
				checked: getSetting( state, 'related-posts' ),
				optionsLink: '#/settings?term=related%20posts',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'related-posts': ! currentCheckedValue } ) );
				},
			};
		},
	},

	scan: {
		mapStateToProps: state => {
			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );
			const siteRawUrl = getSiteRawUrl( state );
			const isScanPurchased =
				hasActiveScanPurchase( state ) ||
				[ 'is-premium-plan', 'is-business-plan', 'is-scan-plan' ].includes( planClass );

			let optionsLink;
			if ( isScanPurchased ) {
				optionsLink = '#/settings?term=scan';
			}

			let upgradeLink;
			if ( ! isScanPurchased ) {
				upgradeLink = getRedirectUrl( 'jetpack-setup-wizard-scan-upgrade', {
					site: siteRawUrl,
				} );
			}

			let info;
			if ( isScanPurchased ) {
				const scanPurchase = getActiveScanPurchase( state );
				const productName = scanPurchase ? scanPurchase.product_name : sitePlan.product_name;
				info = getInfoString( productName );
			}

			return {
				feature: 'scan',
				title: __( 'Security scanning', 'jetpack' ),
				details: __( 'Stop threats to keep your website safe.', 'jetpack' ),
				checked: isScanPurchased,
				isDisabled: isScanPurchased,
				isPaid: true,
				optionsLink,
				upgradeLink,
				info,
			};
		},
	},

	search: {
		mapStateToProps: state => {
			let upgradeLink;
			let optionsLink;
			const sitePlan = getSitePlan( state );
			const siteRawUrl = getSiteRawUrl( state );
			if (
				'is-business-plan' !== getPlanClass( sitePlan.product_slug ) &&
				! hasActiveSearchPurchase( state )
			) {
				upgradeLink = getRedirectUrl( 'jetpack-setup-wizard-search-upgrade', {
					site: siteRawUrl,
				} );
			} else {
				optionsLink = '#/settings?term=search';
			}

			return {
				feature: 'search',
				title: __( 'Search', 'jetpack' ),
				details: __(
					'Incredibly powerful and customizable, Jetpack Search helps your visitors instantly find the right content – right when they need it.',
					'jetpack'
				),
				checked: getSetting( state, 'search' ),
				isPaid: true,
				upgradeLink,
				optionsLink,
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { search: ! currentCheckedValue } ) );
				},
			};
		},
	},

	sso: {
		mapStateToProps: state => {
			return {
				feature: 'sso',
				title: __( 'Secure Sign On', 'jetpack' ),
				details: __( 'Add an extra layer of security.', 'jetpack' ),
				checked: getSetting( state, 'sso' ),
				optionsLink: '#/settings?term=secure%20sign%20on',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { sso: ! currentCheckedValue } ) );
				},
			};
		},
	},

	seo: {
		mapStateToProps: state => {
			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );
			const siteRawUrl = getSiteRawUrl( state );

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let configureLink;
			if ( inCurrentPlan ) {
				configureLink = '#/settings?term=seo';
			}

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = getRedirectUrl( 'jetpack-setup-wizard-seo-upgrade', {
					site: siteRawUrl,
				} );
			}

			return {
				feature: 'seo',
				title: __( 'SEO', 'jetpack' ),
				details: __( 'Take control of the way search engines represent your site.', 'jetpack' ),
				checked: getSetting( state, 'seo-tools' ),
				configureLink,
				upgradeLink,
				isPaid: true,
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'seo-tools': ! currentCheckedValue } ) );
				},
			};
		},
	},

	sitemaps: {
		mapStateToProps: state => {
			return {
				feature: 'sitemaps',
				title: __( 'Sitemaps', 'jetpack' ),
				details: __( 'Automatically generate sitemaps for all your content.', 'jetpack' ),
				checked: getSetting( state, 'sitemaps' ),
				optionsLink: '#/settings?term=sitemaps',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { sitemaps: ! currentCheckedValue } ) );
				},
			};
		},
	},

	sharing: {
		mapStateToProps: state => {
			return {
				feature: 'sharing',
				title: __( 'Sharing', 'jetpack' ),
				details: __( 'Increase sharing of your posts and pages.', 'jetpack' ),
				checked: getSetting( state, 'sharedaddy' ),
				optionsLink: '#/settings?term=sharedaddy',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { sharedaddy: ! currentCheckedValue } ) );
				},
			};
		},
	},

	shortcodes: {
		mapStateToProps: state => {
			return {
				feature: 'shortcodes',
				title: __( 'Shortcode Embeds', 'jetpack' ),
				details: __( 'Embed YouTube videos, and other content easily.', 'jetpack' ),
				checked: getSetting( state, 'shortcodes' ),
				optionsLink: '#/traffic?term=embeds',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { shortcodes: ! currentCheckedValue } ) );
				},
			};
		},
	},

	shortlinks: {
		mapStateToProps: state => {
			return {
				feature: 'shortlinks',
				title: __( 'WP.me Shortlinks', 'jetpack' ),
				details: __( 'Build quick links for sharing.', 'jetpack' ),
				checked: getSetting( state, 'shortlinks' ),
				optionsLink: '#/settings?term=shortlink',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { shortlinks: ! currentCheckedValue } ) );
				},
			};
		},
	},

	'simple-payments-block': {
		mapStateToProps: state => {
			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );
			const siteRawUrl = getSiteRawUrl( state );

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = getRedirectUrl( 'jetpack-setup-wizard-simple-payments-block-upgrade', {
					site: siteRawUrl,
				} );
			}

			let info;
			let configureLink;
			let isButtonLinkExternal = false;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
				configureLink = getRedirectUrl( 'jetpack-setup-wizard-simple-payments-support', {
					site: siteRawUrl,
				} );
				isButtonLinkExternal = true;
			}

			return {
				feature: 'simple-payments-block',
				title: __( 'Pay with PayPal', 'jetpack' ),
				details: __( 'A simple way to accept payments.', 'jetpack' ),
				checked: inCurrentPlan,
				isDisabled: inCurrentPlan,
				isPaid: true,
				configureLink,
				upgradeLink,
				info,
				isButtonLinkExternal,
			};
		},
	},

	'site-accelerator': {
		mapStateToProps: state => {
			return {
				feature: 'site-accelerator',
				title: __( 'Site Accelerator', 'jetpack' ),
				details: __( 'Enable for faster images and a faster site.', 'jetpack' ),
				checked: getSetting( state, 'photon' ) && getSetting( state, 'photon-cdn' ),
				optionsLink: '#/settings?term=image%20optimize',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch(
						updateSettings( { photon: ! currentCheckedValue, 'photon-cdn': ! currentCheckedValue } )
					);
				},
			};
		},
	},

	'site-stats': {
		mapStateToProps: state => {
			return {
				feature: 'site-stats',
				title: __( 'Site Stats', 'jetpack' ),
				details: __(
					'Track your site visitors and learn about your most popular content.',
					'jetpack'
				),
				checked: getSetting( state, 'stats' ),
				optionsLink: '#/settings?term=site%20stats',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { stats: ! currentCheckedValue } ) );
				},
			};
		},
	},

	'site-verification': {
		mapStateToProps: state => {
			return {
				feature: 'site-verification',
				title: __( 'Site verification', 'jetpack' ),
				details: __( 'Verify your site with Google, Bing, Yandex, and Pinterest.', 'jetpack' ),
				checked: getSetting( state, 'verification-tools' ),
				configureLink: '#/settings?term=verify',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'verification-tools': ! currentCheckedValue } ) );
				},
			};
		},
	},

	subscriptions: {
		mapStateToProps: state => {
			return {
				feature: 'subscriptions',
				title: __( 'Subscriptions', 'jetpack' ),
				details: __( 'Send post notifications to your visitors.', 'jetpack' ),
				checked: getSetting( state, 'subscriptions' ),
				optionsLink: '#/settings?term=subscriptions',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { subscriptions: ! currentCheckedValue } ) );
				},
			};
		},
	},

	testimonials: {
		mapStateToProps: state => {
			return {
				feature: 'testimonials',
				title: __( 'Testimonial: Custom content types', 'jetpack' ),
				details: __( 'Add testimonials to your website to attract new customers.', 'jetpack' ),
				checked: getSetting( state, 'jetpack_testimonial' ),
				optionsLink: '#/settings?term=testimonials',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( ( dispatchProp, getState ) => {
						const jetpack_portfolio = getSetting( getState(), 'jetpack_portfolio' );
						const jetpack_testimonial = ! currentCheckedValue;
						const customContentTypes = jetpack_portfolio || jetpack_testimonial;

						return dispatchProp(
							updateSettings( {
								jetpack_testimonial,
								'custom-content-types': customContentTypes,
							} )
						);
					} );
				},
			};
		},
	},

	'tiled-galleries': {
		mapStateToProps: state => {
			return {
				feature: 'tiled-galleries',
				title: __( 'Tiled Galleries', 'jetpack' ),
				details: __( 'Add beautifully laid out galleries using the block editor.', 'jetpack' ),
				checked: getSetting( state, 'tiled-gallery' ),
				optionsLink: 'https://jetpack.com/support/jetpack-blocks/tiled-gallery-block/',
				isOptionsLinkExternal: true,
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'tiled-gallery': ! currentCheckedValue } ) );
				},
			};
		},
	},

	videopress: {
		mapStateToProps: state => {
			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );
			const siteRawUrl = getSiteRawUrl( state );

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = getRedirectUrl( 'jetpack-setup-wizard-videopress-upgrade', {
					site: siteRawUrl,
				} );
			}

			let info;
			let optionsLink;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
				optionsLink = '#/settings?term=video%20player';
			}

			return {
				feature: 'videopress',
				title: __( 'VideoPress', 'jetpack' ),
				details: __( 'Host fast, high-quality, ad-free video.', 'jetpack' ),
				checked: getSetting( state, 'videopress' ),
				isPaid: true,
				optionsLink,
				upgradeLink,
				info,
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { videopress: ! currentCheckedValue } ) );
				},
			};
		},
	},

	'widget-visibility': {
		mapStateToProps: state => {
			return {
				feature: 'widget-visibility',
				title: __( 'Widget Visibility', 'jetpack' ),
				details: __( 'Control your widgets at the post or page level.', 'jetpack' ),
				checked: getSetting( state, 'widget-visibility' ),
				optionsLink: '#/settings?term=visibility',
			};
		},
		mapDispatchToProps: dispatch => {
			return {
				onToggleChange: currentCheckedValue => {
					return dispatch( updateSettings( { 'widget-visibility': ! currentCheckedValue } ) );
				},
			};
		},
	},
};

export const mapStateToFeatureToggleProps = ( state, feature ) => {
	if ( ! Object.keys( features ).includes( feature ) ) {
		throw `Feature not found: ${ feature }`;
	}

	const mapStateToProps = features[ feature ].mapStateToProps;

	return 'function' === typeof features[ feature ].mapStateToProps ? mapStateToProps( state ) : {};
};

export const mapDispatchToFeatureToggleProps = ( dispatch, feature ) => {
	if ( ! Object.keys( features ).includes( feature ) ) {
		throw `Feature not found: ${ feature }`;
	}

	const mapDispatchToProps = features[ feature ].mapDispatchToProps;

	return 'function' === typeof mapDispatchToProps ? mapDispatchToProps( dispatch ) : {};
};
