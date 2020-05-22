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
import { getSitePlan, hasActiveSearchPurchase } from 'state/site';

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
			const vaultPressData = getVaultPressData( state );
			const isVaultPressEnabled = get( vaultPressData, [ 'data', 'features', 'backups' ], false );

			const rewindStatus = getRewindStatus( state );
			const rewindState = get( rewindStatus, 'state', false );

			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );

			const backupsActive = true === isVaultPressEnabled || 'active' === rewindState;

			const inCurrentPlan = [
				'is-personal-plan',
				'is-premium-plan',
				'is-business-plan',
				'is-daily-backup-plan',
				'is-realtime-backup-plan',
			].includes( planClass );

			let optionsLink;
			if ( inCurrentPlan ) {
				optionsLink = '#/settings?term=backup';
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
				title: __( 'Daily or Real-time backups' ),
				details: __( 'Get time travel for your site with Jetpack Backup.' ),
				checked: backupsActive,
				isDisabled: inCurrentPlan,
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
				title: __( 'Contact Form' ),
				details: __( 'Gutenberg ready forms!' ),
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
			const vaultPressData = getVaultPressData( state );
			const isScanEnabled =
				true === get( vaultPressData, [ 'data', 'features', 'security' ], false );

			const sitePlan = getSitePlan( state );
			const planClass = getPlanClass( sitePlan.product_slug );

			const inCurrentPlan = [ 'is-premium-plan', 'is-business-plan', 'is-scan-plan' ].includes(
				planClass
			);

			let optionsLink;
			if ( inCurrentPlan ) {
				optionsLink = '#/settings?term=scan';
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
				title: __( 'Security scanning' ),
				details: __( 'Stop threats to keep your website safe.' ),
				checked: isScanEnabled,
				isDisabled: inCurrentPlan,
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
				title: __( 'Simple Payments Block' ),
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
				title: __( 'Testimonial: Custom content type' ),
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
				title: __( 'Tiled Galleries' ),
				details: 'Add beautifully laid out galleries as a Gutenberg block',
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
