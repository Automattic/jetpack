import restApi from '@automattic/jetpack-api';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { isWoASite } from '@automattic/jetpack-script-data';
import { withDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import jQuery from 'jquery';
import { Component } from 'react';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';
import AdminNotices from 'components/admin-notices';
import Footer from 'components/footer';
import Masthead from 'components/masthead';
import Navigation from 'components/navigation';
import NavigationSettings from 'components/navigation-settings';
import NonAdminView from 'components/non-admin-view';
import Tracker from 'components/tracker';
import analytics from 'lib/analytics';
import { productDescriptionRoutes } from 'product-descriptions/constants';
import SearchableSettings from 'settings/index.jsx';
import * as _ from './utils/global-nav-menu';

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
	userCanManageModules,
	userCanConnectSite,
	userCanViewStats,
	getCurrentVersion,
	getTracksUserData,
	showRecommendations,
	getInitialRecommendationsStep,
	getPluginBaseUrl,
	getPartnerCoupon,
	showMyJetpack,
	userIsSubscriber,
	getJetpackManageInfo,
} from 'state/initial-state';
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

class Main extends Component {

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

		this.props.setConnectionStatus( this.props.connectionStatus );
	}

	/**
	 * Render the main navigation bar.
	 *
	 * @param {string} route - The current page route.
	 * @return {import('react').ReactElement|null} - The navigation component or `null` if not available.
	 */
	renderMainNav = route => {
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
		}

		return <Navigation routeName={ this.props.routeName } blogID={ this.props.blogID } />;
	};

	renderMainContent = route => {

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

		let pageComponent;

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
		}

		if ( isWoASite() && ! this.props.showMyJetpack ) {
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

	shouldShowMasthead() {
		// Only show on the setup pages, dashboard, and settings page
		return [ ...settingsRoutes ].includes(
			this.props.location.pathname
		);
	}

	shouldShowFooter() {
		// Only show on the dashboard, settings, and recommendations pages
		return [
			...settingsRoutes,
			...productDescriptionRoutes,
		].includes( this.props.location.pathname );
	}

	shouldBlurMainContent() {
		return this.props.isReconnectingSite;
	}

	render() {
		const jpClasses = [ 'jp-lower' ];

		const mainNav = this.renderMainNav( this.props.location.pathname );
		const showHeader = mainNav || this.shouldShowMasthead();

		return (
			<div>
				{ showHeader && (
					<div className="jp-top">
						<div className="jp-top-inside">
							{ this.shouldShowMasthead() && <Masthead location={ this.props.location } /> }
							{ mainNav }
						</div>
					</div>
				) }

				<div className={ jpClasses.join( ' ' ) }>
					<AdminNotices />

					{ this.renderMainContent( this.props.location.pathname ) }
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
			showMyJetpack: showMyJetpack( state ),
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
	} )( props => <Main { ...props } location={ useLocation() } navigate={ useNavigate() } /> )
);
