import { imagePath } from 'constants/urls';
import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreen, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { ActivationScreen } from '@automattic/jetpack-licensing';
import ConnectScreenBody from '@automattic/jetpack-my-jetpack/components/connection-screen/body';
import { PartnerCouponRedeem } from '@automattic/jetpack-partner-coupon';
import { withDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import AtAGlance from 'at-a-glance/index.jsx';
import AdminNotices from 'components/admin-notices';
import AppsCard from 'components/apps-card';
import ContextualizedConnection from 'components/contextualized-connection';
import QueryRewindStatus from 'components/data/query-rewind-status';
import Footer from 'components/footer';
import JetpackNotices from 'components/jetpack-notices';
import Masthead from 'components/masthead';
import Navigation from 'components/navigation';
import NavigationSettings from 'components/navigation-settings';
import NonAdminView from 'components/non-admin-view';
import ReconnectModal from 'components/reconnect-modal';
import SupportCard from 'components/support-card';
import Tracker from 'components/tracker';
import jQuery from 'jquery';
import analytics from 'lib/analytics';
import MyPlan from 'my-plan/index.jsx';
import ProductDescriptions from 'product-descriptions';
import { productDescriptionRoutes } from 'product-descriptions/constants';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Prompt } from 'react-router-dom';
import { Recommendations } from 'recommendations';
import SearchableSettings from 'settings/index.jsx';
import {
	getSiteConnectionStatus,
	getConnectedWpComUser,
	isCurrentUserLinked,
	isSiteConnected,
	isConnectionOwner,
	isConnectingUser,
	resetConnectUser,
	isReconnectingSite,
	getConnectUrl,
	getConnectingUserFeatureLabel,
	getConnectingUserFrom,
	getConnectionStatus,
	hasConnectedOwner,
	getHasSeenWCConnectionModal,
	setHasSeenWCConnectionModal,
	isOfflineMode,
} from 'state/connection';
import {
	setInitialState,
	getSiteRawUrl,
	getSiteId,
	getSiteAdminUrl,
	getApiNonce,
	getApiRootUrl,
	getRegistrationNonce,
	userCanManageModules,
	userCanConnectSite,
	userCanViewStats,
	getCurrentVersion,
	getTracksUserData,
	showRecommendations,
	getInitialRecommendationsStep,
	getPluginBaseUrl,
	getPartnerCoupon,
	isAtomicSite,
	isWoASite,
	showMyJetpack,
	isWooCommerceActive,
	userIsSubscriber,
	getJetpackManageInfo,
} from 'state/initial-state';
import {
	updateLicensingActivationNoticeDismiss as updateLicensingActivationNoticeDismissAction,
	updateUserLicensesCounts as updateUserLicensesCountsAction,
} from 'state/licensing';
import { fetchModules as fetchModulesAction } from 'state/modules';
import { getRewindStatus } from 'state/rewind';
import { getSearchTerm } from 'state/search';
import {
	areThereUnsavedSettings,
	clearUnsavedSettingsFlag,
	fetchSettings as fetchSettingsAction,
} from 'state/settings';
import {
	fetchSiteData as fetchSiteDataAction,
	fetchSitePurchases as fetchSitePurchasesAction,
} from 'state/site';
import JetpackManageBanner from './components/jetpack-manage-banner';

const recommendationsRoutes = [
	'/recommendations',
	'/recommendations/site-type',
	'/recommendations/product-suggestions',
	'/recommendations/product-purchased',
	'/recommendations/agency',
	'/recommendations/woocommerce',
	'/recommendations/monitor',
	'/recommendations/newsletter',
	'/recommendations/related-posts',
	'/recommendations/creative-mail',
	'/recommendations/site-accelerator',
	'/recommendations/publicize',
	'/recommendations/protect',
	'/recommendations/anti-spam',
	'/recommendations/videopress',
	'/recommendations/backup-plan',
	'/recommendations/boost',
	'/recommendations/summary',
	'/recommendations/vaultpress-backup',
	'/recommendations/vaultpress-for-woocommerce',
	'/recommendations/welcome-backup',
	'/recommendations/welcome-complete',
	'/recommendations/welcome-security',
	'/recommendations/welcome-starter',
	'/recommendations/welcome-antispam',
	'/recommendations/welcome-videopress',
	'/recommendations/welcome-search',
	'/recommendations/welcome-scan',
	'/recommendations/welcome-social-basic',
	'/recommendations/welcome-social-advanced',
	'/recommendations/welcome-social-image-generator',
	'/recommendations/welcome-golden-token',
	'/recommendations/backup-activated',
	'/recommendations/scan-activated',
	'/recommendations/unlimited-sharing-activated',
	'/recommendations/social-advanced-activated',
	'/recommendations/antispam-activated',
	'/recommendations/videopress-activated',
	'/recommendations/search-activated',
	'/recommendations/server-credentials',
];

const myJetpackRoutes = [ 'my-jetpack ' ];
const dashboardRoutes = [ '/', '/dashboard', '/reconnect', '/my-plan', '/plans' ];
const settingsRoutes = [
	'/settings',
	'/security',
	'/performance',
	'/writing',
	'/sharing',
	'/discussion',
	'/earn',
	'/newsletter',
	'/traffic',
	'/privacy',
];

class Main extends React.Component {
	constructor( props ) {
		super( props );
		this.closeReconnectModal = this.closeReconnectModal.bind( this );
		this.onLicenseActivationSuccess = this.onLicenseActivationSuccess.bind( this );
	}

	UNSAFE_componentWillMount() {
		this.props.setInitialState();
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
		this.initializeAnalytics();

		// Handles refresh, closing and navigating away from Jetpack's Admin Page
		// beforeunload can not handle confirm calls in most of the browsers, so just clean up the flag.
		window.addEventListener( 'beforeunload', this.props.clearUnsavedSettingsFlag );

		// Track initial page view
		this.props.isSiteConnected &&
			analytics.tracks.recordEvent( 'jetpack_wpa_page_view', {
				path: this.props.location.pathname,
				current_version: this.props.currentVersion,
			} );
	}

	componentDidMount() {
		// If we have a div that's only found on the Jetpack dashboard when not connected,
		// let's move the connection banner inside that div, inside the React page.
		const connectReactContainer = jQuery( '.jp-jetpack-connect__container' );
		const fullScreenContainer = jQuery( '.jp-connect-full__container' );
		if ( connectReactContainer && fullScreenContainer.length > 0 ) {
			fullScreenContainer.prependTo( connectReactContainer );
		}

		/* Redirects the user to the Woo Connection/Welcome Screen if:
		 * 1. They have Woo installed and active AND
		 * 2. they have never seen this screen before AND
		 * 3. they have the right permissions.
		 */
		if (
			this.props.isWooCommerceActive &&
			! this.props.hasSeenWCConnectionModal &&
			this.props.userCanManageModules
		) {
			this.props.history.replace( {
				pathname: '/woo-setup',
				state: { previousPath: this.props.location.pathname },
			} );
		}
	}

	/*
	 * Shows a confirmation dialog if there are unsaved module settings.
	 *
	 * Return true or false according to the history.listenBefore specification which is part of react-router
	 */
	handleRouterWillLeave = () => {
		const question = __(
			'There are unsaved settings in this tab that will be lost if you leave it. Proceed?',
			'jetpack'
		);

		if ( confirm( question ) ) {
			window.setTimeout( this.props.clearUnsavedSettingsFlag, 10 );
			return true;
		}
		return false;
	};

	initializeAnalytics = () => {
		const tracksUser = this.props.tracksUserData;

		if ( tracksUser ) {
			analytics.initialize( tracksUser.userid, tracksUser.username, {
				blog_id: tracksUser.blogid,
			} );
		}
	};

	shouldComponentUpdate( nextProps ) {
		// If user triggers Skip to main content or Skip to toolbar with keyboard navigation, stay in the same tab.
		if ( [ '/wpbody-content', '/wp-toolbar' ].includes( nextProps.location.pathname ) ) {
			return false;
		}

		return (
			JSON.stringify( nextProps.connectionStatus ) !==
				JSON.stringify( this.props.connectionStatus ) ||
			nextProps.siteConnectionStatus !== this.props.siteConnectionStatus ||
			nextProps.isLinked !== this.props.isLinked ||
			nextProps.isConnectingUser !== this.props.isConnectingUser ||
			nextProps.location.pathname !== this.props.location.pathname ||
			nextProps.searchTerm !== this.props.searchTerm ||
			nextProps.rewindStatus !== this.props.rewindStatus ||
			nextProps.areThereUnsavedSettings !== this.props.areThereUnsavedSettings ||
			nextProps.isReconnectingSite !== this.props.isReconnectingSite
		);
	}

	componentDidUpdate( prevProps ) {
		// Track page view on change only
		prevProps.location.pathname !== this.props.location.pathname &&
			this.props.isSiteConnected &&
			analytics.tracks.recordEvent( 'jetpack_wpa_page_view', {
				path: this.props.location.pathname,
				current_version: this.props.currentVersion,
			} );

		// Not taking into account offline mode here because changing the connection
		// status without reloading is possible only by disconnecting a live site not
		// in offline mode.
		if ( prevProps.siteConnectionStatus !== this.props.siteConnectionStatus ) {
			const $items = jQuery( '#toplevel_page_jetpack' ).find( 'ul.wp-submenu li' );
			$items.find( 'a[href$="#/settings"]' ).hide();
			$items.find( 'a[href$="admin.php?page=stats"]' ).hide();
			$items.find( 'a[href$="admin.php?page=jetpack-search"]' ).hide();
		}

		this.props.setConnectionStatus( this.props.connectionStatus );
	}

	/**
	 * Render the main navigation bar.
	 *
	 * @param {string} route - The current page route.
	 * @returns {React.ReactElement|null} - The navigation component or `null` if not available.
	 */
	renderMainNav = route => {
		if ( this.shouldShowWooConnectionScreen() ) {
			return null;
		}

		if ( this.props.partnerCoupon ) {
			const forceShow = new URLSearchParams( window.location.search ).get( 'showCouponRedemption' );

			if ( ! this.props.isOfflineMode && ( ! this.props.isSiteConnected || forceShow ) ) {
				return null;
			}
		}

		if (
			this.isUserConnectScreen() &&
			( this.props.userCanManageModules || this.props.hasConnectedOwner )
		) {
			return null;
		}

		if ( ! this.props.userCanManageModules ) {
			if ( ! this.props.siteConnectionStatus ) {
				return null;
			}

			switch ( route ) {
				case '/settings':
				case '/writing':
				case '/sharing':
				case '/performance':
					if ( ! this.props.isSubscriber ) {
						return <NavigationSettings { ...this.props } />;
					}
			}

			return <Navigation { ...this.props } />;
		}

		if ( this.isMainConnectScreen() ) {
			return null;
		}

		switch ( route ) {
			case '/settings':
			case '/security':
			case '/performance':
			case '/writing':
			case '/sharing':
			case '/discussion':
			case '/earn':
			case '/newsletter':
			case '/traffic':
			case '/privacy':
				return (
					<NavigationSettings
						routeName={ this.props.routeName }
						siteRawUrl={ this.props.siteRawUrl }
						siteAdminUrl={ this.props.siteAdminUrl }
					/>
				);
			case '/license/activation':
				if ( this.props.isLinked && this.props.isConnectionOwner ) {
					return null;
				}
		}

		return <Navigation routeName={ this.props.routeName } blogID={ this.props.blogID } />;
	};

	renderMainContent = route => {
		if ( this.shouldShowWooConnectionScreen() ) {
			const previousPath = this.props.location.state?.previousPath;
			const redirectTo =
				previousPath && previousPath !== '/woo-setup' ? `#${ previousPath }` : '#/dashboard';

			return (
				<ContextualizedConnection
					apiNonce={ this.props.apiNonce }
					registrationNonce={ this.props.registrationNonce }
					apiRoot={ this.props.apiRoot }
					title={ __(
						'Welcome to Jetpack! Security, Growth, & Performance tools for WordPress businesses',
						'jetpack'
					) }
					logo={
						<img
							src={ imagePath + '/jetpack-woocommerce-logo.svg' }
							alt={ __( 'Jetpack and WooCommerce', 'jetpack' ) }
						/>
					}
					buttonLabel={ __( 'Set up Jetpack', 'jetpack' ) }
					redirectUri="admin.php?page=jetpack"
					redirectTo={ redirectTo }
					from={ this.props.location.pathname }
					isSiteConnected={ this.props.isSiteConnected }
					setHasSeenWCConnectionModal={ this.props.setHasSeenWCConnectionModal }
				>
					<p>
						{ __(
							'Jetpack is the perfect companion plugin for WooCommerce - made by WordPress experts to make your store faster, safer, and to help grow your business.',
							'jetpack'
						) }
					</p>
				</ContextualizedConnection>
			);
		}

		/*
		 * Show "Partner Coupon Redeem" screen instead of regular main content/pre-connection.
		 */
		if ( this.props.partnerCoupon ) {
			const forceShow = new URLSearchParams( window.location.search ).get( 'showCouponRedemption' );

			/*
			 * There are two conditions (groups of conditions, really) where we would want to
			 * show the partner coupon redeem screen:
			 *
			 * 1. The site is not yet connected to WPCOM, but has the jetpack_partner_coupon
			 * option set in the database (this.props.partnerCoupon in redux). This is likely a
			 * partner-user who has just arrived here from a CTA within a partner's dashboard
			 * or other ecosystem.
			 *
			 * 2. The site is already connected to WPCOM, but the jetpack_partner_coupon option
			 * is still set in the database. This means the user connected their site, but never
			 * redeemed the coupon. If this is the case, we don't want to override the dashboard
			 * or at a glance pages with the redemption screen. Instead, we'll catch a URL
			 * parameter that JITMs will set (showCouponRedemption=true), and show the screen only
			 * when the user came from a a JITM.
			 */
			if ( ! this.props.isOfflineMode && ( ! this.props.isSiteConnected || forceShow ) ) {
				return (
					<PartnerCouponRedeem
						apiNonce={ this.props.apiNonce }
						registrationNonce={ this.props.registrationNonce }
						apiRoot={ this.props.apiRoot }
						assetBaseUrl={ this.props.pluginBaseUrl }
						connectionStatus={ this.props.connectionStatus }
						partnerCoupon={ this.props.partnerCoupon }
						siteRawUrl={ this.props.siteRawUrl }
						tracksUserData={ !! this.props.tracksUserData }
						analytics={ analytics }
					/>
				);
			}
		}

		if (
			this.isUserConnectScreen() &&
			( this.props.userCanManageModules || this.props.hasConnectedOwner )
		) {
			const searchParams = new URLSearchParams( location.search.split( '?' )[ 1 ] );

			return (
				<ConnectScreenBody
					title={
						this.props.connectingUserFeatureLabel &&
						sprintf(
							/* translators: placeholder is a feature label (e.g. SEO, Notifications) */
							__( 'Unlock %s and more amazing features', 'jetpack' ),
							this.props.connectingUserFeatureLabel
						)
					}
					from={ ( searchParams && searchParams.get( 'from' ) ) || this.props.connectingUserFrom }
					redirectUri="admin.php?page=jetpack"
					apiRoot={ this.props.apiRoot }
					apiNonce={ this.props.apiNonce }
					registrationNonce={ this.props.registrationNonce }
					autoTrigger={ this.shouldAutoTriggerConnection() }
				/>
			);
		}

		if ( ! this.props.userCanManageModules ) {
			if ( ! this.props.siteConnectionStatus ) {
				return false;
			}
			return (
				<div aria-live="assertive">
					<NonAdminView { ...this.props } />
				</div>
			);
		}

		if ( this.isMainConnectScreen() ) {
			const searchParams = new URLSearchParams( location.search.split( '?' )[ 1 ] );

			return (
				<ConnectScreen
					apiNonce={ this.props.apiNonce }
					registrationNonce={ this.props.registrationNonce }
					apiRoot={ this.props.apiRoot }
					images={ [ '/images/connect-right.jpg' ] }
					assetBaseUrl={ this.props.pluginBaseUrl }
					autoTrigger={ this.shouldAutoTriggerConnection() }
					redirectUri="admin.php?page=jetpack"
					from={ searchParams && searchParams.get( 'from' ) }
				>
					<p>
						{ __(
							"Secure and speed up your site for free with Jetpack's powerful WordPress tools.",
							'jetpack'
						) }
					</p>

					{ /*
					Since the list style type is set to none, `role=list` is required for VoiceOver (on Safari) to announce the list.
					See: https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html
					*/ }
					<ul role="list">
						<li>{ __( 'Measure your impact with Jetpack Stats', 'jetpack' ) }</li>
						<li>{ __( 'Speed up your site with optimized images', 'jetpack' ) }</li>
						<li>{ __( 'Protect your site against bot attacks', 'jetpack' ) }</li>
						<li>{ __( 'Get notifications if your site goes offline', 'jetpack' ) }</li>
						<li>{ __( 'Enhance your site with dozens of other features', 'jetpack' ) }</li>
					</ul>
				</ConnectScreen>
			);
		}

		let pageComponent;

		switch ( route ) {
			case '/dashboard':
			case '/reconnect':
			case '/disconnect':
			case '/connect-user':
			case '/connect-user-setup':
			case '/woo-setup':
				pageComponent = (
					<AtAGlance
						siteRawUrl={ this.props.siteRawUrl }
						siteAdminUrl={ this.props.siteAdminUrl }
						rewindStatus={ this.props.rewindStatus }
					/>
				);
				break;
			case '/setup':
				if ( this.props.isSiteConnected ) {
					this.props.history.replace( '/dashboard' );
					pageComponent = this.getAtAGlance();
				}
				break;
			case '/my-plan':
				pageComponent = (
					<MyPlan
						siteRawUrl={ this.props.siteRawUrl }
						blogID={ this.props.blogID }
						siteAdminUrl={ this.props.siteAdminUrl }
						rewindStatus={ this.props.rewindStatus }
					/>
				);
				break;
			case '/plans':
				window.location.href = getRedirectUrl( 'jetpack-plans', { site: this.props.siteRawUrl } );
				break;
			case '/plans-prompt':
				window.location.href = getRedirectUrl( 'jetpack-plans', { site: this.props.siteRawUrl } );
				break;
			case '/settings':
			case '/security':
			case '/performance':
			case '/writing':
			case '/sharing':
			case '/discussion':
			case '/earn':
			case '/newsletter':
			case '/traffic':
			case '/privacy':
				pageComponent = (
					<SearchableSettings
						siteAdminUrl={ this.props.siteAdminUrl }
						siteRawUrl={ this.props.siteRawUrl }
						blogID={ this.props.blogID }
						searchTerm={ this.props.searchTerm }
						rewindStatus={ this.props.rewindStatus }
						userCanManageModules={ this.props.userCanManageModules }
					/>
				);
				break;
			case '/license/activation':
				if ( this.props.isLinked && this.props.isConnectionOwner ) {
					pageComponent = (
						<ActivationScreen
							siteRawUrl={ this.props.siteRawUrl }
							onActivationSuccess={ this.onLicenseActivationSuccess }
							siteAdminUrl={ this.props.siteAdminUrl }
							currentRecommendationsStep={ this.props.currentRecommendationsStep }
						/>
					);
				} else {
					this.props.history.replace( '/dashboard' );
					pageComponent = this.getAtAGlance();
				}
				break;
			case '/recommendations':
			case '/recommendations/site-type':
			case '/recommendations/product-suggestions':
			case '/recommendations/product-purchased':
			case '/recommendations/agency':
			case '/recommendations/woocommerce':
			case '/recommendations/monitor':
			case '/recommendations/newsletter':
			case '/recommendations/related-posts':
			case '/recommendations/creative-mail':
			case '/recommendations/site-accelerator':
			case '/recommendations/publicize':
			case '/recommendations/protect':
			case '/recommendations/anti-spam':
			case '/recommendations/videopress':
			case '/recommendations/backup-plan':
			case '/recommendations/boost':
			case '/recommendations/summary':
			case '/recommendations/vaultpress-backup':
			case '/recommendations/vaultpress-for-woocommerce':
			case '/recommendations/welcome-backup':
			case '/recommendations/welcome-complete':
			case '/recommendations/welcome-security':
			case '/recommendations/welcome-starter':
			case '/recommendations/welcome-antispam':
			case '/recommendations/welcome-videopress':
			case '/recommendations/welcome-search':
			case '/recommendations/welcome-scan':
			case '/recommendations/welcome-social-basic':
			case '/recommendations/welcome-social-advanced':
			case '/recommendations/welcome-golden-token':
			case '/recommendations/backup-activated':
			case '/recommendations/scan-activated':
			case '/recommendations/unlimited-sharing-activated':
			case '/recommendations/social-advanced-activated':
			case '/recommendations/welcome-social-image-generator':
			case '/recommendations/antispam-activated':
			case '/recommendations/videopress-activated':
			case '/recommendations/search-activated':
			case '/recommendations/server-credentials':
				if ( this.props.showRecommendations ) {
					pageComponent = <Recommendations />;
				} else {
					this.props.history.replace( '/dashboard' );
					pageComponent = this.getAtAGlance();
				}
				break;
			default:
				if ( productDescriptionRoutes.includes( route ) ) {
					pageComponent = <ProductDescriptions />;
					break;
				}

				this.props.history.replace( '/dashboard' );
				pageComponent = this.getAtAGlance();
				break;
		}

		if ( this.props.isWoaSite && ! this.props.showMyJetpack ) {
			window.wpNavMenuClassChange( { dashboard: 1, settings: 1 } );
		} else if ( ! this.props.isLinked && ! this.props.showMyJetpack ) {
			window.wpNavMenuClassChange( { dashboard: 1, settings: 2 } );
		} else if ( ! this.props.isLinked && this.props.showMyJetpack ) {
			window.wpNavMenuClassChange( { myJetpack: 1, dashboard: 2, settings: 3 } );
		} else if ( this.props.isLinked && ! this.props.showMyJetpack ) {
			window.wpNavMenuClassChange( { activityLog: 1, dashboard: 2, settings: 3 } );
		} else {
			window.wpNavMenuClassChange();
		}

		return (
			<div aria-live="assertive" className={ `${ this.shouldBlurMainContent() ? 'blur' : '' }` }>
				{ pageComponent }
			</div>
		);
	};

	getAtAGlance() {
		return (
			<AtAGlance
				siteRawUrl={ this.props.siteRawUrl }
				siteAdminUrl={ this.props.siteAdminUrl }
				rewindStatus={ this.props.rewindStatus }
			/>
		);
	}

	shouldShowAppsCard() {
		// Only show on the dashboard
		return (
			this.props.isSiteConnected &&
			! this.shouldShowWooConnectionScreen() &&
			this.props.userCanViewStats &&
			dashboardRoutes.includes( this.props.location.pathname )
		);
	}

	shouldShowJetpackManageBanner() {
		const { site_count } = this.props.connectedWpComUser;

		// Only show on dashboard when users are managing 2 or more sites
		return (
			this.props.userCanConnectSite &&
			site_count >= 2 &&
			this.props.isSiteConnected &&
			! this.props.isAtomicSite &&
			! this.shouldShowWooConnectionScreen() &&
			dashboardRoutes.includes( this.props.location.pathname )
		);
	}

	shouldShowSupportCard() {
		// Only show on the dashboard
		return (
			this.props.isSiteConnected &&
			! this.shouldShowWooConnectionScreen() &&
			this.props.userCanManageModules &&
			dashboardRoutes.includes( this.props.location.pathname )
		);
	}

	shouldShowRewindStatus() {
		// Only show on the dashboard
		return this.props.isSiteConnected && dashboardRoutes.includes( this.props.location.pathname );
	}

	shouldShowMasthead() {
		if ( this.isMainConnectScreen() ) {
			return false;
		}

		// Only show on the setup pages, dashboard, and settings page
		return [ ...dashboardRoutes, ...recommendationsRoutes, ...settingsRoutes ].includes(
			this.props.location.pathname
		);
	}

	shouldShowFooter() {
		// Only show on the dashboard, settings, and recommendations pages
		return [
			...dashboardRoutes,
			...settingsRoutes,
			...recommendationsRoutes,
			...productDescriptionRoutes,
		].includes( this.props.location.pathname );
	}

	shouldBlurMainContent() {
		return this.props.isReconnectingSite;
	}

	shouldShowReconnectModal() {
		return '/reconnect' === this.props.location.pathname;
	}

	closeReconnectModal() {
		this.props.history.replace( '/dashboard' );
	}

	/**
	 * Checks if this is the main connection screen page.
	 *
	 * @returns {boolean} Whether this is the main connection screen page.
	 */
	isMainConnectScreen() {
		return false === this.props.siteConnectionStatus && this.props.userCanConnectSite;
	}

	/**
	 * Checks if this is the user connection screen page.
	 *
	 * @returns {boolean} Whether this is the user connection screen page.
	 */
	isUserConnectScreen() {
		return (
			'/connect-user' === this.props.location.pathname ||
			'/connect-user-setup' === this.props.location.pathname
		);
	}

	/**
	 * Checks whether we should show the Woo Connection screen page.
	 *
	 * @returns {boolean} Whether we should show the Woo connection screen page.
	 */
	shouldShowWooConnectionScreen() {
		return '/woo-setup' === this.props.location.pathname;
	}

	/**
	 * Check if the user connection has been triggered.
	 *
	 * @returns {boolean} Whether the user connection has been triggered.
	 */
	shouldConnectUser() {
		return this.props.isConnectingUser;
	}

	/**
	 * Show the user connection page.
	 */
	connectUser() {
		this.props.resetConnectUser();
		this.props.history.replace( '/connect-user' );
	}

	/**
	 * Checks if this is a licensing screen page.
	 *
	 * @returns {boolean} Whether this is a licensing screen page.
	 */
	isLicensingScreen() {
		return this.props.location.pathname.startsWith( '/license' );
	}

	/**
	 * Check if the connection flow should get triggered automatically.
	 *
	 * @returns {boolean} Whether to trigger the connection flow automatically.
	 */
	shouldAutoTriggerConnection() {
		return (
			this.props.location.pathname.startsWith( '/setup' ) ||
			this.props.location.pathname.startsWith( '/connect-user-setup' )
		);
	}

	/**
	 * Fires after a user(not partner) product license key has been sucessfully activated.
	 */
	onLicenseActivationSuccess() {
		// First update state.jetpack.licensing.userCounts before dismissing the license activation notice.
		this.props.updateUserLicensesCounts().then( () => {
			// Manually dismiss the userLicenseActivationNotice.
			this.props.updateLicensingActivationNoticeDismiss();
		} );
		// Update site plan.
		this.props.fetchSiteData();
		// Update site products.
		this.props.fetchSitePurchases();
		// Update site modules (search, wordads, google-analytics, etc.)
		this.props.fetchModules();
		// Update site settings (i.e. search, instant search, etc.)
		this.props.fetchSettings();
	}

	render() {
		const jpClasses = [ 'jp-lower' ];

		if ( this.isMainConnectScreen() ) {
			jpClasses.push( 'jp-main-connect-screen' );
		}

		if ( this.isUserConnectScreen() ) {
			jpClasses.push( 'jp-user-connect-screen' );
		}

		if ( this.isLicensingScreen() ) {
			jpClasses.push( 'jp-licensing-screen' );
		}

		const mainNav = this.renderMainNav( this.props.location.pathname );
		const showHeader = mainNav || this.shouldShowMasthead() || this.shouldShowRewindStatus();

		return (
			<div>
				{ this.shouldShowReconnectModal() && (
					<ReconnectModal show={ true } onHide={ this.closeReconnectModal } />
				) }

				{ showHeader && (
					<div className="jp-top">
						<div className="jp-top-inside">
							{ this.shouldShowMasthead() && <Masthead location={ this.props.location } /> }
							{ this.shouldShowRewindStatus() && <QueryRewindStatus /> }
							{ mainNav }
						</div>
					</div>
				) }

				<div className={ jpClasses.join( ' ' ) }>
					<AdminNotices />
					<JetpackNotices />
					{ this.shouldConnectUser() && this.connectUser() }
					<Prompt
						when={ this.props.areThereUnsavedSettings }
						message={ this.handleRouterWillLeave }
					/>

					{ this.renderMainContent( this.props.location.pathname ) }
					{ this.shouldShowJetpackManageBanner() && (
						<JetpackManageBanner
							path={ this.props.location.pathname }
							isAgencyAccount={ this.props.jetpackManage.isAgencyAccount }
						/>
					) }
					{ this.shouldShowSupportCard() && <SupportCard path={ this.props.location.pathname } /> }
					{ this.shouldShowAppsCard() && <AppsCard /> }
				</div>
				{ this.shouldShowFooter() && <Footer siteAdminUrl={ this.props.siteAdminUrl } /> }
				<Tracker analytics={ analytics } />
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			isOfflineMode: isOfflineMode( state ),
			connectionStatus: getConnectionStatus( state ),
			siteConnectionStatus: getSiteConnectionStatus( state ),
			connectedWpComUser: getConnectedWpComUser( state ),
			isLinked: isCurrentUserLinked( state ),
			isConnectingUser: isConnectingUser( state ),
			hasConnectedOwner: hasConnectedOwner( state ),
			isConnectionOwner: isConnectionOwner( state ),
			siteRawUrl: getSiteRawUrl( state ),
			blogID: getSiteId( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			searchTerm: getSearchTerm( state ),
			apiRoot: getApiRootUrl( state ),
			apiNonce: getApiNonce( state ),
			registrationNonce: getRegistrationNonce( state ),
			tracksUserData: getTracksUserData( state ),
			areThereUnsavedSettings: areThereUnsavedSettings( state ),
			userCanManageModules: userCanManageModules( state ),
			userCanConnectSite: userCanConnectSite( state ),
			userCanViewStats: userCanViewStats( state ),
			isSiteConnected: isSiteConnected( state ),
			isReconnectingSite: isReconnectingSite( state ),
			rewindStatus: getRewindStatus( state ),
			currentVersion: getCurrentVersion( state ),
			showRecommendations: showRecommendations( state ),
			pluginBaseUrl: getPluginBaseUrl( state ),
			connectUrl: getConnectUrl( state ),
			connectingUserFeatureLabel: getConnectingUserFeatureLabel( state ),
			connectingUserFrom: getConnectingUserFrom( state ),
			isAtomicSite: isAtomicSite( state ),
			isWoaSite: isWoASite( state ),
			showMyJetpack: showMyJetpack( state ),
			isWooCommerceActive: isWooCommerceActive( state ),
			hasSeenWCConnectionModal: getHasSeenWCConnectionModal( state ),
			partnerCoupon: getPartnerCoupon( state ),
			currentRecommendationsStep: getInitialRecommendationsStep( state ),
			isSubscriber: userIsSubscriber( state ),
			jetpackManage: getJetpackManageInfo( state ),
		};
	},
	dispatch => ( {
		setInitialState: () => {
			return dispatch( setInitialState() );
		},
		clearUnsavedSettingsFlag: () => {
			return dispatch( clearUnsavedSettingsFlag() );
		},
		setHasSeenWCConnectionModal: () => {
			return dispatch( setHasSeenWCConnectionModal() );
		},
		resetConnectUser: () => {
			return dispatch( resetConnectUser() );
		},
		updateLicensingActivationNoticeDismiss: () => {
			return dispatch( updateLicensingActivationNoticeDismissAction() );
		},
		updateUserLicensesCounts: () => {
			return dispatch( updateUserLicensesCountsAction() );
		},
		fetchSiteData: () => {
			return dispatch( fetchSiteDataAction() );
		},
		fetchSitePurchases: () => {
			return dispatch( fetchSitePurchasesAction() );
		},
		fetchModules: () => {
			return dispatch( fetchModulesAction() );
		},
		fetchSettings: () => {
			return dispatch( fetchSettingsAction() );
		},
	} )
)(
	withDispatch( dispatch => {
		return {
			setConnectionStatus: connectionStatus => {
				dispatch( CONNECTION_STORE_ID ).setConnectionStatus( connectionStatus );
			},
		};
	} )( withRouter( Main ) )
);

/**
 * Manages changing the visuals of the sub-nav items on the left sidebar when the React app changes routes
 *
 * @param pageOrder
 */
window.wpNavMenuClassChange = function (
	pageOrder = { myJetpack: 1, activityLog: 2, dashboard: 3, settings: 4 }
) {
	let hash = window.location.hash;
	let page = new URLSearchParams( window.location.search );

	// Clear currently highlighted sub-nav item
	jQuery( '.current' ).each( function ( i, obj ) {
		jQuery( obj ).removeClass( 'current' );
	} );

	const getJetpackSubNavItem = subNavItemIndex => {
		return jQuery( '#toplevel_page_jetpack' )
			.find( 'li' )
			.filter( function ( index ) {
				return index === subNavItemIndex;
			} )[ 0 ];
	};

	// Set the current sub-nav item according to the current hash route
	hash = hash.split( '?' )[ 0 ].replace( /#/, '' );
	page = page.get( 'page' );

	if ( myJetpackRoutes.includes( page ) ) {
		getJetpackSubNavItem( pageOrder.myJetpack )?.classList.add( 'current' );
	} else if (
		dashboardRoutes.includes( hash ) ||
		recommendationsRoutes.includes( hash ) ||
		productDescriptionRoutes.includes( hash )
	) {
		getJetpackSubNavItem( pageOrder.dashboard )?.classList.add( 'current' );
	} else if ( settingsRoutes.includes( hash ) ) {
		getJetpackSubNavItem( pageOrder.settings )?.classList.add( 'current' );
	}

	const $body = jQuery( 'body' );

	$body.on(
		'click',
		'a[href$="#/dashboard"], a[href$="#/settings"], .jp-dash-section-header__settings[href="#/security"], .dops-button[href="#/my-plan"], .dops-button[href="#/plans"], .jp-dash-section-header__external-link[href="#/security"]',
		function () {
			window.scrollTo( 0, 0 );
		}
	);

	$body.on( 'click', '.jetpack-js-stop-propagation', function ( e ) {
		e.stopPropagation();
	} );
};
