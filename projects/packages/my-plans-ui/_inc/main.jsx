/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { getRedirectUrl, Masthead } from '@automattic/jetpack-components';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import {
	getSiteConnectionStatus,
	isCurrentUserLinked,
	isSiteConnected,
	isAuthorizingUserInPlace
} from '@automattic/jetpack-connection/state';

import { State as ModuleState } from '@automattic/jetpack-modules';
const {
	setInitialState,
	getSiteRawUrl,
	getSiteAdminUrl,
	getApiNonce,
	getApiRootUrl,
	userCanManageModules,
	userCanConnectSite,
	getCurrentVersion,
	getTracksUserData,
} = ModuleState;

import MyPlan from 'my-plan/index.jsx';
import Footer from 'components/footer';
import NonAdminView from 'components/non-admin-view';
import JetpackNotices from 'components/jetpack-notices';
import AdminNotices from 'components/admin-notices';
import Tracker from 'components/tracker';
import analytics from 'lib/analytics';

class Main extends React.Component {
	UNSAFE_componentWillMount() {
		this.props.setInitialState();
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
		this.initializeAnalytics();

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
			nextProps.siteConnectionStatus !== this.props.siteConnectionStatus ||
			nextProps.isLinked !== this.props.isLinked ||
			nextProps.location.pathname !== this.props.location.pathname
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
		}
	}

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

		if ( false === this.props.siteConnectionStatus && this.props.userCanConnectSite ) {
			return <div className="jp-jetpack-connect__container" aria-live="assertive" />;
		}

		let pageComponent;

		switch ( route ) {
			case '/my-plan':
				pageComponent = this.getMyPlan();
				break;
			case '/plans':
				window.location.href = getRedirectUrl( 'jetpack-plans', { site: this.props.siteRawUrl } );
				break;
			case '/plans-prompt':
				window.location.href = getRedirectUrl( 'jetpack-plans', { site: this.props.siteRawUrl } );
				break;
			default:
				this.props.history.replace( '/my-plan' );
				pageComponent = this.getMyPlan();
				break;
		}

		return <div aria-live="assertive">{ pageComponent }</div>;
	};

	getMyPlan() {
		return <MyPlan siteRawUrl={ this.props.siteRawUrl } siteAdminUrl={ this.props.siteAdminUrl } />;
	}

	render() {
		return (
			<div>
				<Masthead location={ this.props.location } />
				<div className="jp-lower">
					<AdminNotices />
					<JetpackNotices />
					{ this.renderMainContent( this.props.location.pathname ) }
				</div>
				<Footer siteAdminUrl={ this.props.siteAdminUrl } />
				<Tracker analytics={ analytics } />
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			siteConnectionStatus: getSiteConnectionStatus( state ),
			isLinked: isCurrentUserLinked( state ),
			isAuthorizingInPlace: isAuthorizingUserInPlace( state ),
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			apiRoot: getApiRootUrl( state ),
			apiNonce: getApiNonce( state ),
			tracksUserData: getTracksUserData( state ),
			userCanManageModules: userCanManageModules( state ),
			userCanConnectSite: userCanConnectSite( state ),
			isSiteConnected: isSiteConnected( state ),
			currentVersion: getCurrentVersion( state ),
		};
	},
	dispatch => ( {
		setInitialState: () => {
			return dispatch( setInitialState() );
		},
	} )
)( withRouter( Main ) );
