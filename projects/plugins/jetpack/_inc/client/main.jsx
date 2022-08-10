import { imagePath } from 'constants/urls';
import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreen, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { ActivationScreen } from '@automattic/jetpack-licensing';
import { PartnerCouponRedeem } from '@automattic/jetpack-partner-coupon';
import { Dashicon } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
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
	reconnectSite,
	getConnectUrl,
	getConnectingUserFeatureLabel,
	getConnectionStatus,
	hasConnectedOwner,
	getHasSeenWCConnectionModal,
	setHasSeenWCConnectionModal,
	isOfflineMode,
} from 'state/connection';
import {
	setInitialState,
	getSiteRawUrl,
	getSiteAdminUrl,
	getApiNonce,
	getApiRootUrl,
	getRegistrationNonce,
	userCanManageModules,
	userCanConnectSite,
	getCurrentVersion,
	getTracksUserData,
	showRecommendations,
	getInitialRecommendationsStep,
	getPluginBaseUrl,
	getPartnerCoupon,
	isWoASite,
	isWooCommerceActive,
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
import AgenciesCard from './components/agencies-card';

const recommendationsRoutes = [
	'/recommendations',
	'/recommendations/site-type',
	'/recommendations/product-suggestions',
	'/recommendations/product-purchased',
	'/recommendations/woocommerce',
	'/recommendations/monitor',
	'/recommendations/related-posts',
	'/recommendations/creative-mail',
	'/recommendations/site-accelerator',
	'/recommendations/publicize',
	'/recommendations/security-plan',
	'/recommendations/anti-spam',
	'/recommendations/videopress',
	'/recommendations/boost',
	'/recommendations/summary',
];

const dashboardRoutes = [ '/', '/dashboard', '/reconnect', '/my-plan', '/plans' ];
const settingsRoutes = [
	'/settings',
	'/security',
	'/performance',
	'/writing',
	'/sharing',
	'/discussion',
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
			return (
				<ConnectScreen
					apiNonce={ this.props.apiNonce }
					registrationNonce={ this.props.registrationNonce }
					apiRoot={ this.props.apiRoot }
					images={ [ '/images/connect-right-secondary.png' ] }
					assetBaseUrl={ this.props.pluginBaseUrl }
					title={
						this.props.connectingUserFeatureLabel
							? sprintf(
									/* translators: placeholder is a feature label (e.g. SEO, Notifications) */
									__( 'Unlock %s and more amazing features', 'jetpack' ),
									this.props.connectingUserFeatureLabel
							  )
							: __( 'Unlock all the amazing features of Jetpack by connecting now', 'jetpack' )
					}
					buttonLabel={ __( 'Connect your user account', 'jetpack' ) }
					redirectUri="admin.php?page=jetpack"
				>
					<ul>
						<li>{ __( 'Receive instant downtime alerts', 'jetpack' ) }</li>
						<li>{ __( 'Automatically share your content on social media', 'jetpack' ) }</li>
						<li>{ __( 'Let your subscribers know when you post', 'jetpack' ) }</li>
						<li>{ __( 'Receive notifications about new likes and comments', 'jetpack' ) }</li>
						<li>{ __( 'Let visitors share your content on social media', 'jetpack' ) }</li>
						<li>
							{ createInterpolateElement(
								__( 'And more! <a>See all Jetpack features</a>', 'jetpack' ),
								{
									a: (
										<a
											href={ getRedirectUrl( 'jetpack-features' ) }
											target="_blank"
											rel="noreferrer"
										/>
									),
								}
							) }
							<a
								className="jp-connection-screen-icon"
								href={ getRedirectUrl( 'jetpack-features' ) }
								target="_blank"
								rel="noreferrer"
							>
								<Dashicon icon="external" />
							</a>
						</li>
					</ul>
				</ConnectScreen>
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
			return (
				<ConnectScreen
					apiNonce={ this.props.apiNonce }
					registrationNonce={ this.props.registrationNonce }
					apiRoot={ this.props.apiRoot }
					images={ [ '/images/connect-right.jpg' ] }
					assetBaseUrl={ this.props.pluginBaseUrl }
					autoTrigger={ this.shouldAutoTriggerConnection() }
					redirectUri="admin.php?page=jetpack"
				>
					<p>
						{ __(
							"Secure and speed up your site for free with Jetpack's powerful WordPress tools.",
							'jetpack'
						) }
					</p>

					<ul>
						<li>{ __( 'Measure your impact with beautiful stats', 'jetpack' ) }</li>
						<li>{ __( 'Speed up your site with optimized images', 'jetpack' ) }</li>
						<li>{ __( 'Protect your site against bot attacks', 'jetpack' ) }</li>
						<li>{ __( 'Get notifications if your site goes offline', 'jetpack' ) }</li>
						<li>{ __( 'Enhance your site with dozens of other features', 'jetpack' ) }</li>
					</ul>
				</ConnectScreen>
			);
		}

		const settingsNav = (
			<NavigationSettings
				routeName={ this.props.routeName }
				siteRawUrl={ this.props.siteRawUrl }
				siteAdminUrl={ this.props.siteAdminUrl }
			/>
		);
		let pageComponent,
			navComponent = <Navigation routeName={ this.props.routeName } />;

		switch ( route ) {
			case '/dashboard':
			case '/reconnect':
			case '/disconnect':
			case '/connect-user':
			case '/woo-setup':
			case '/setup':
				pageComponent = (
					<AtAGlance
						siteRawUrl={ this.props.siteRawUrl }
						siteAdminUrl={ this.props.siteAdminUrl }
						rewindStatus={ this.props.rewindStatus }
					/>
				);
				break;
			case '/my-plan':
				pageComponent = (
					<MyPlan
						siteRawUrl={ this.props.siteRawUrl }
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
			case '/traffic':
			case '/privacy':
				navComponent = settingsNav;
				pageComponent = (
					<SearchableSettings
						siteAdminUrl={ this.props.siteAdminUrl }
						siteRawUrl={ this.props.siteRawUrl }
						searchTerm={ this.props.searchTerm }
						rewindStatus={ this.props.rewindStatus }
						userCanManageModules={ this.props.userCanManageModules }
					/>
				);
				break;
			case '/license/activation':
				if ( this.props.isLinked && this.props.isConnectionOwner ) {
					navComponent = null;
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
			case '/recommendations/woocommerce':
			case '/recommendations/monitor':
			case '/recommendations/related-posts':
			case '/recommendations/creative-mail':
			case '/recommendations/site-accelerator':
			case '/recommendations/publicize':
			case '/recommendations/security-plan':
			case '/recommendations/anti-spam':
			case '/recommendations/videopress':
			case '/recommendations/boost':
			case '/recommendations/summary':
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

		if ( this.props.isWoaSite ) {
			window.wpNavMenuClassChange( { dashboard: 1, settings: 1 } );
		} else {
			window.wpNavMenuClassChange();
		}

		return (
			<div aria-live="assertive" className={ `${ this.shouldBlurMainContent() ? 'blur' : '' }` }>
				{ navComponent }
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
			dashboardRoutes.includes( this.props.location.pathname )
		);
	}

	shouldShowAgenciesCard() {
		const { site_count } = this.props.connectedWpComUser;

		// Only show on dashboard when users are managing 2 or more sites
		return (
			this.props.userCanConnectSite &&
			site_count >= 2 &&
			this.props.isSiteConnected &&
			! this.shouldShowWooConnectionScreen() &&
			dashboardRoutes.includes( this.props.location.pathname )
		);
	}

	shouldShowSupportCard() {
		// Only show on the dashboard
		return (
			this.props.isSiteConnected &&
			! this.shouldShowWooConnectionScreen() &&
			dashboardRoutes.includes( this.props.location.pathname )
		);
	}

	shouldShowRewindStatus() {
		// Only show on the dashboard
		return this.props.isSiteConnected && dashboardRoutes.includes( this.props.location.pathname );
	}

	shouldShowMasthead() {
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
		return '/connect-user' === this.props.location.pathname;
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
		return this.props.location.pathname.startsWith( '/setup' );
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

		return (
			<div>
				{ this.shouldShowReconnectModal() && (
					<ReconnectModal show={ true } onHide={ this.closeReconnectModal } />
				) }
				{ this.shouldShowMasthead() && <Masthead location={ this.props.location } /> }
				<div className={ jpClasses.join( ' ' ) }>
					{ this.shouldShowRewindStatus() && <QueryRewindStatus /> }
					<AdminNotices />
					<JetpackNotices />
					{ this.shouldConnectUser() && this.connectUser() }
					<Prompt
						when={ this.props.areThereUnsavedSettings }
						message={ this.handleRouterWillLeave }
					/>
					{ this.renderMainContent( this.props.location.pathname ) }
					{ this.shouldShowAgenciesCard() && (
						<AgenciesCard path={ this.props.location.pathname } discountPercentage={ 25 } />
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
			siteAdminUrl: getSiteAdminUrl( state ),
			searchTerm: getSearchTerm( state ),
			apiRoot: getApiRootUrl( state ),
			apiNonce: getApiNonce( state ),
			registrationNonce: getRegistrationNonce( state ),
			tracksUserData: getTracksUserData( state ),
			areThereUnsavedSettings: areThereUnsavedSettings( state ),
			userCanManageModules: userCanManageModules( state ),
			userCanConnectSite: userCanConnectSite( state ),
			isSiteConnected: isSiteConnected( state ),
			isReconnectingSite: isReconnectingSite( state ),
			rewindStatus: getRewindStatus( state ),
			currentVersion: getCurrentVersion( state ),
			showRecommendations: showRecommendations( state ),
			pluginBaseUrl: getPluginBaseUrl( state ),
			connectUrl: getConnectUrl( state ),
			connectingUserFeatureLabel: getConnectingUserFeatureLabel( state ),
			isWoaSite: isWoASite( state ),
			isWooCommerceActive: isWooCommerceActive( state ),
			hasSeenWCConnectionModal: getHasSeenWCConnectionModal( state ),
			partnerCoupon: getPartnerCoupon( state ),
			currentRecommendationsStep: getInitialRecommendationsStep( state ),
		};
	},
	dispatch => ( {
		setInitialState: () => {
			return dispatch( setInitialState() );
		},
		clearUnsavedSettingsFlag: () => {
			return dispatch( clearUnsavedSettingsFlag() );
		},
		reconnectSite: () => {
			return dispatch( reconnectSite() );
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
window.wpNavMenuClassChange = function ( pageOrder = { dashboard: 1, settings: 2 } ) {
	let hash = window.location.hash;

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
	if (
		dashboardRoutes.includes( hash ) ||
		recommendationsRoutes.includes( hash ) ||
		productDescriptionRoutes.includes( hash )
	) {
		getJetpackSubNavItem( pageOrder.dashboard ).classList.add( 'current' );
	} else if ( settingsRoutes.includes( hash ) ) {
		getJetpackSubNavItem( pageOrder.settings ).classList.add( 'current' );
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
