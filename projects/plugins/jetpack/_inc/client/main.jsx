import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreen, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
// The extension is required: esbuild does not complete package `exports` subpaths.
import ConnectScreenBody from '@automattic/jetpack-my-jetpack/components/connection-screen/body.tsx';
import { withDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import jQuery from 'jquery';
import { Component } from 'react';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';
import AdminNotices from 'components/admin-notices';
import Footer from 'components/footer';
import JetpackNotices from 'components/jetpack-notices';
import Masthead from 'components/masthead';
import NonAdminView from 'components/non-admin-view';
import SettingsAdminPage from 'components/settings-admin-page';
import SettingsNavTabs from 'components/settings-nav-tabs';
import Tracker from 'components/tracker';
import analytics from 'lib/analytics';
import SearchableSettings from 'settings/index.jsx';
import {
	getSiteConnectionStatus,
	isCurrentUserLinked,
	isSiteConnected,
	isConnectingUser,
	resetConnectUser,
	isReconnectingSite,
	getConnectingUserFeatureLabel,
	getConnectingUserFrom,
	getConnectionStatus,
	hasConnectedOwner,
	isOfflineMode,
} from 'state/connection';
import {
	setInitialState,
	getSiteRawUrl,
	getSiteId,
	getSiteAdminUrl,
	getApiNonce,
	getApiRootUrl,
	userCanManageModules,
	userCanConnectSite,
	getCurrentVersion,
	getTracksUserData,
	getPluginBaseUrl,
	userIsSubscriber,
} from 'state/initial-state';
import { getRewindStatus } from 'state/rewind';
import { getSearchTerm } from 'state/search';
import { areThereUnsavedSettings, clearUnsavedSettingsFlag } from 'state/settings';

const settingsRoutes = [
	'/settings',
	'/security',
	'/performance',
	'/writing',
	'/sharing',
	'/discussion',
	'/earn',
	'/reader',
	'/traffic',
	'/privacy',
];

class Main extends Component {
	UNSAFE_componentWillMount() {
		this.props.setInitialState();
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
		this.initializeAnalytics();

		// Handles refresh, closing and navigating away from Jetpack's Admin Page
		// beforeunload cannot handle confirm calls in most of the browsers, so just clean up the flag.
		window.addEventListener( 'beforeunload', this.props.clearUnsavedSettingsFlag );

		// Track initial page view
		this.props.isSiteConnected &&
			analytics.tracks.recordEvent( 'jetpack_wpa_page_view', {
				path: this.props.location.pathname,
				current_version: this.props.currentVersion,
			} );
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

		// eslint-disable-next-line no-alert -- Needs a blocking dialog.
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
			$items.find( 'a[href$="page=jetpack-settings"]' ).hide();
			$items.find( 'a[href$="admin.php?page=stats"]' ).hide();
			$items.find( 'a[href$="admin.php?page=jetpack-search"]' ).hide();
		}

		this.props.setConnectionStatus( this.props.connectionStatus );
	}

	renderMainContent = route => {
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
							/* translators: %s: a feature label (e.g. SEO, Notifications) */
							__( 'Unlock %s and more amazing features', 'jetpack' ),
							this.props.connectingUserFeatureLabel
						)
					}
					from={ ( searchParams && searchParams.get( 'from' ) ) || this.props.connectingUserFrom }
					redirectUri="admin.php?page=jetpack"
					apiRoot={ this.props.apiRoot }
					apiNonce={ this.props.apiNonce }
					registrationNonce=""
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
					registrationNonce=""
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
			case '/plans':
			case '/plans-prompt':
				window.location.href = getRedirectUrl( 'jetpack-plans', { site: this.props.siteRawUrl } );
				break;
			case '/newsletter':
				window.location.href = `${ this.props.siteAdminUrl }admin.php?page=jetpack-newsletter`;
				break;
			case '/settings':
			case '/security':
			case '/performance':
			case '/writing':
			case '/sharing':
			case '/discussion':
			case '/earn':
			case '/reader':
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
			default:
				this.props.navigate( '/settings', { replace: true } );
				break;
		}

		window.wpNavMenuClassChange();

		return (
			<div aria-live="assertive" className={ `${ this.shouldBlurMainContent() ? 'blur' : '' }` }>
				{ pageComponent }
			</div>
		);
	};

	shouldBlurMainContent() {
		return this.props.isReconnectingSite;
	}

	/**
	 * Checks if this is the main connection screen page.
	 *
	 * @return {boolean} Whether this is the main connection screen page.
	 */
	isMainConnectScreen() {
		return false === this.props.siteConnectionStatus && this.props.userCanConnectSite;
	}

	/**
	 * Checks if this is the user connection screen page.
	 *
	 * @return {boolean} Whether this is the user connection screen page.
	 */
	isUserConnectScreen() {
		return (
			'/connect-user' === this.props.location.pathname ||
			'/connect-user-setup' === this.props.location.pathname
		);
	}

	/**
	 * Check if the user connection has been triggered.
	 *
	 * @return {boolean} Whether the user connection has been triggered.
	 */
	shouldConnectUser() {
		return this.props.isConnectingUser;
	}

	/**
	 * Show the user connection page.
	 */
	connectUser() {
		this.props.resetConnectUser();
		this.props.navigate( '/connect-user', { replace: true } );
	}

	/**
	 * Check if the connection flow should get triggered automatically.
	 *
	 * @return {boolean} Whether to trigger the connection flow automatically.
	 */
	shouldAutoTriggerConnection() {
		return (
			this.props.location.pathname.startsWith( '/setup' ) ||
			this.props.location.pathname.startsWith( '/connect-user-setup' )
		);
	}

	isSettingsRoute() {
		return settingsRoutes.includes( this.props.location.pathname );
	}

	render() {
		const jpClasses = [ 'jp-lower' ];
		const isConnectScreen = this.isMainConnectScreen() || this.isUserConnectScreen();

		if ( this.isMainConnectScreen() ) {
			jpClasses.push( 'jp-main-connect-screen' );
		}

		if ( this.isUserConnectScreen() ) {
			jpClasses.push( 'jp-user-connect-screen' );
		}

		const pathname = this.props.location.pathname;

		// Settings routes use the shared AdminPage component for header and footer.
		if ( this.isSettingsRoute() ) {
			return (
				<div>
					<SettingsAdminPage tabs={ <SettingsNavTabs /> }>
						<div className={ jpClasses.join( ' ' ) }>
							<AdminNotices />
							<JetpackNotices />
							{ this.shouldConnectUser() && this.connectUser() }
							{ this.renderMainContent( pathname ) }
						</div>
					</SettingsAdminPage>
					<Tracker analytics={ analytics } />
				</div>
			);
		}

		return (
			<div>
				{ ! isConnectScreen && (
					<div className="jp-top">
						<Masthead location={ this.props.location } />
					</div>
				) }

				<div className={ jpClasses.join( ' ' ) }>
					<AdminNotices />
					<JetpackNotices />
					{ this.shouldConnectUser() && this.connectUser() }
					{ this.renderMainContent( pathname ) }
				</div>
				{ ! isConnectScreen && <Footer siteAdminUrl={ this.props.siteAdminUrl } /> }
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
			isLinked: isCurrentUserLinked( state ),
			isConnectingUser: isConnectingUser( state ),
			hasConnectedOwner: hasConnectedOwner( state ),
			siteRawUrl: getSiteRawUrl( state ),
			blogID: getSiteId( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			searchTerm: getSearchTerm( state ),
			apiRoot: getApiRootUrl( state ),
			apiNonce: getApiNonce( state ),
			tracksUserData: getTracksUserData( state ),
			areThereUnsavedSettings: areThereUnsavedSettings( state ),
			userCanManageModules: userCanManageModules( state ),
			userCanConnectSite: userCanConnectSite( state ),
			isSiteConnected: isSiteConnected( state ),
			isReconnectingSite: isReconnectingSite( state ),
			rewindStatus: getRewindStatus( state ),
			currentVersion: getCurrentVersion( state ),
			pluginBaseUrl: getPluginBaseUrl( state ),
			connectingUserFeatureLabel: getConnectingUserFeatureLabel( state ),
			connectingUserFrom: getConnectingUserFrom( state ),
			isSubscriber: userIsSubscriber( state ),
		};
	},
	dispatch => ( {
		setInitialState: () => {
			return dispatch( setInitialState() );
		},
		clearUnsavedSettingsFlag: () => {
			return dispatch( clearUnsavedSettingsFlag() );
		},
		resetConnectUser: () => {
			return dispatch( resetConnectUser() );
		},
	} )
)(
	withDispatch( dispatch => {
		return {
			setConnectionStatus: connectionStatus => {
				dispatch( CONNECTION_STORE_ID ).setConnectionStatus( connectionStatus );
			},
		};
	} )( props => <Main { ...props } location={ useLocation() } navigate={ useNavigate() } /> )
);

/**
 * Binds the Settings app's delegated click handlers; WordPress highlights its menu entry itself.
 */
window.wpNavMenuClassChange = function () {
	const $body = jQuery( 'body' );

	$body.on( 'click', 'a[href$="#/settings"]', function () {
		window.scrollTo( 0, 0 );
	} );

	$body.on( 'click', '.jetpack-js-stop-propagation', function ( e ) {
		e.stopPropagation();
	} );
};
