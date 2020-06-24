/**
 * External dependencies
 */
import { translate as __ } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getRedirectUrl from 'lib/jp-redirect';
import { getPlanClass } from 'lib/plans/constants';
import { getVaultPressData, isAkismetKeyValid } from 'state/at-a-glance';
import { getSiteRawUrl } from 'state/initial-state';
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

function getInfoString( productName ) {
	return __( 'Included with %(productName)s', { args: { productName } } );
}

const features = {
	ads: {
		mapStateToProps: state => {
			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = '#/plans';
			}

			let info;
			let configureLink;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
				configureLink = '#/settings?term=wordads';
			}

			return {
				feature: 'ads',
				title: __( 'Ads' ),
				details: __( 'Generate income with high-quality ads.' ),
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

			const inCurrentPlan = [ 'is-personal-plan', 'is-premium-plan', 'is-business-plan' ].includes(
				planClass
			);

			let optionsLink;
			let isOptionsLinkExternal = false;
			if ( inCurrentPlan ) {
				optionsLink = getRedirectUrl( 'jetpack-setup-wizard-anti-spam-get-started' );
				isOptionsLinkExternal = true;
			}

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = '#/plans';
			}

			let info;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
			}

			return {
				feature: 'anti-spam',
				title: __( 'Anti-spam' ),
				details: __( 'No more approving or vetting.' ),
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
				upgradeLink = '#/plans';
			}

			let info;
			if ( isBackupsPurchased ) {
				const backupsPurchase = getActiveBackupPurchase( state );
				const productName = backupsPurchase ? backupsPurchase.product_name : sitePlan.product_name;
				info = getInfoString( productName );
			}

			return {
				feature: 'backups',
				title: __( 'Daily or Real-time backups' ),
				details: __( 'Get time travel for your site with Jetpack Backup.' ),
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
				title: __( 'Beautiful math' ),
				details: __( 'Display math and formulas beautifully.' ),
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
				title: __( 'Brute force protection' ),
				details: __( 'Stop malicious login attempts.' ),
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
				title: __( 'Carousel' ),
				details: __(
					'Create full-screen carousel slideshows for the images in your posts and pages.'
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
				title: __( 'Comment Likes' ),
				details: __( 'Increase engagement with liking on comments.' ),
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
				title: __( 'Comments' ),
				details: __( 'An enhanced comments section with better verfiication.' ),
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
				title: __( 'Contact Form' ),
				details: __( 'Add contact forms using the block editor.' ),
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
				title: __( 'Copy Post' ),
				details: __( 'Simply duplicate content.' ),
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

	'custom-css': {
		mapStateToProps: state => {
			return {
				feature: 'custom-css',
				title: __( 'Custom CSS' ),
				details: __( 'Enable an enhanced CSS customization panel.' ),
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
				title: __( 'Enhanced Distribution' ),
				details: __( 'Increase reach and traffic.' ),
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
				title: __( 'Extra Sidebar Widgets' ),
				details: __( 'Add more widgets.' ),
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

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = '#/plans';
			}

			let info;
			let configureLink;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
				configureLink = '#/settings?term=google%20analytics';
			}

			return {
				feature: 'google-analytics',
				title: __( 'Google Analytics' ),
				details: __( 'Add your Google Analytics account.' ),
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
				title: __( 'Gravatar Hovercards' ),
				details: __( 'Give comments life.' ),
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
				title: __( 'Infinite Scroll' ),
				details: __(
					'Create a smooth, uninterrupted reading experience by loading more content as visitors scroll to the bottom of your archive pages.'
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
				title: __( 'JSON API' ),
				details: __( 'JSON API access for developers.' ),
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
				title: __( 'Lazy Loading Images' ),
				details: __( 'Further improve site speed and only load images visitors need.' ),
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
				title: __( 'Likes' ),
				details: __( 'Add a like button to your posts.' ),
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
				title: __( 'Markdown' ),
				details: __( 'Write faster rich-text.' ),
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
				title: __( 'WordPress.com Toolbar' ),
				details: __( 'The WordPress.com toolbar replaces the default WordPress admin toolbar.' ),
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
				title: __( 'Downtime Monitoring' ),
				details: __( 'Get an alert immediately if your site goes down.' ),
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
				title: __( 'Notifications' ),
				details: __( 'Stay up-to-date with your site.' ),
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
				title: __( 'Portfolio: Custom content types' ),
				details: __( 'Use portfolios on your site to showcase your best work.' ),
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
				title: __( 'Post by email' ),
				details: __(
					'Post by email is a quick way to publish new posts without visiting your site.'
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
				title: __( 'Publicize' ),
				details: __( 'Automaticaly share content on your favorite social media accounts.' ),
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
				title: __( 'Related posts' ),
				details: __(
					'Keep your visitors engaged with related content at the bottom of each post.'
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
			const isScanPurchased =
				hasActiveScanPurchase( state ) ||
				[ 'is-premium-plan', 'is-business-plan', 'is-scan-plan' ].includes( planClass );

			let optionsLink;
			if ( isScanPurchased ) {
				optionsLink = '#/settings?term=scan';
			}

			let upgradeLink;
			if ( ! isScanPurchased ) {
				upgradeLink = '#/plans';
			}

			let info;
			if ( isScanPurchased ) {
				const scanPurchase = getActiveScanPurchase( state );
				const productName = scanPurchase ? scanPurchase.product_name : sitePlan.product_name;
				info = getInfoString( productName );
			}

			return {
				feature: 'scan',
				title: __( 'Security scanning' ),
				details: __( 'Stop threats to keep your website safe.' ),
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
			if (
				'is-business-plan' !== getPlanClass( sitePlan.product_slug ) &&
				! hasActiveSearchPurchase( state )
			) {
				upgradeLink = '#/plans';
			} else {
				optionsLink = '#/settings?term=search';
			}

			return {
				feature: 'search',
				title: __( 'Search' ),
				details: __(
					'Incredibly powerful and customizable, Jetpack Search helps your visitors instantly find the right content – right when they need it.'
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
				title: __( 'Secure Sign On' ),
				details: __( 'Add an extra layer of security.' ),
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

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let configureLink;
			if ( inCurrentPlan ) {
				configureLink = '#/settings?term=seo';
			}

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = '#/plans';
			}

			return {
				feature: 'seo',
				title: __( 'SEO' ),
				details: __( 'Take control of the way search engines represent your site.' ),
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
				title: __( 'Sitemaps' ),
				details: __( 'Automatically generate sitemaps for all your content.' ),
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
				title: __( 'Sharing' ),
				details: __( 'Increase sharing of your posts and pages. ' ),
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
				title: __( 'Shortcode Embeds' ),
				details: __( 'Embed YouTube videos, and other content easily.' ),
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
				title: __( 'WP.me Shortlinks' ),
				details: __( 'Build quick links for sharing.' ),
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

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = '#/plans';
			}

			let info;
			let configureLink;
			let isButtonLinkExternal = false;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
				configureLink = getRedirectUrl( 'jetpack-setup-wizard-simple-payments-support' );
				isButtonLinkExternal = true;
			}

			return {
				feature: 'simple-payments-block',
				title: __( 'Pay with PayPal' ),
				details: __( 'A simple way to accept payments.' ),
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
				title: __( 'Site Accelerator' ),
				details: __( 'Enable for faster images and a faster site.' ),
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
				title: __( 'Site Stats' ),
				details: __( 'Track your site visitors and learn about your most popular content.' ),
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
				title: __( 'Site verification' ),
				details: __( 'Verify your site with Google, Bing, Yandex, and Pinterest.' ),
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
				title: __( 'Subscriptions' ),
				details: __( 'Send post notifications to your visitors.' ),
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
				title: __( 'Testimonial: Custom content types' ),
				details: __( 'Add testimonials to your website to attract new customers.' ),
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
				title: __( 'Tiled Galleries' ),
				details: 'Add beautifully laid out galleries using the block editor.',
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

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan' ].includes( planClass );

			let upgradeLink;
			if ( ! inCurrentPlan ) {
				upgradeLink = '#/plans';
			}

			let info;
			let optionsLink;
			if ( inCurrentPlan ) {
				info = getInfoString( sitePlan.product_name );
				optionsLink = '#/settings?term=video%20player';
			}

			return {
				feature: 'videopress',
				title: __( 'VideoPress' ),
				details: __( 'Host fast, high-quality, ad-free video.' ),
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
				title: __( 'Widget Visibility' ),
				details: __( 'Control your widgets at the post or page level.' ),
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
