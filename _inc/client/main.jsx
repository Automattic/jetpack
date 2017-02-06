/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import includes from 'lodash/includes';
import { createHistory } from 'history';
import { withRouter } from 'react-router';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Masthead from 'components/masthead';
import Navigation from 'components/navigation';
import NavigationSettings from 'components/navigation-settings';
import JetpackConnect from 'components/jetpack-connect';
import JumpStart from 'components/jumpstart';
import { getJumpStartStatus, isJumpstarting } from 'state/jumpstart';
import { getSiteConnectionStatus } from 'state/connection';
import {
	setInitialState,
	getSiteRawUrl,
	getSiteAdminUrl,
	getApiNonce,
	getApiRootUrl,
	userCanManageModules
} from 'state/initial-state';
import { areThereUnsavedModuleOptions, clearUnsavedOptionFlag } from 'state/modules';
import { areThereUnsavedSettings, clearUnsavedSettingsFlag } from 'state/settings';

import AtAGlance from 'at-a-glance/index.jsx';
import Engagement from 'engagement/index.jsx';
import Discussion from 'discussion';
import Security from 'security/index.jsx';
import Traffic from 'traffic';
import Appearance from 'appearance/index.jsx';
import GeneralSettings from 'general-settings/index.jsx';
import Writing from 'writing/index.jsx';
import Apps from 'apps/index.jsx';
import Plans from 'plans/index.jsx';
import Footer from 'components/footer';
import SupportCard from 'components/support-card';
import NonAdminView from 'components/non-admin-view';
import JetpackNotices from 'components/jetpack-notices';
import AdminNotices from 'components/admin-notices';
import SearchPage from 'search/index.jsx';
import analytics from 'lib/analytics';
import restApi from 'rest-api';
import { getTracksUserData } from 'state/initial-state';

const Main = React.createClass( {
	componentWillMount: function() {
		this.props.setInitialState();
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
		this.initializeAnalyitics();

		// Handles refresh, closing and navigating away from Jetpack's Admin Page
		window.addEventListener( 'beforeunload', this.onBeforeUnload );
		// Handles transition between routes handled by react-router
		this.props.router.listenBefore( this.routerWillLeave );
	},

	/*
	 * Returns a string if there are unsaved module settings thus showing a confirm dialog to the user
	 * according to the `beforeunload` event handling specification
	 */
	onBeforeUnload( e ) {
		const dialogText = __( 'There are unsaved settings in this tab that will be lost if you leave it. Proceed?' );
		if (
			this.props.areThereUnsavedModuleOptions
			|| this.props.areThereUnsavedSettings
		) {
			e.returnValue = dialogText;
			return dialogText;
		}
	},

	/*
 	 * Shows a confirmation dialog if there are unsaved module settings.
 	 *
 	 * Return true or false according to the history.listenBefore specification which is part of react-router
	 */
	routerWillLeave() {
		if (
			this.props.areThereUnsavedModuleOptions
			|| this.props.areThereUnsavedSettings
		) {
			const confirmLeave = confirm( __( 'There are unsaved settings in this tab that will be lost if you leave it. Proceed?' ) );
			if ( confirmLeave ) {
				this.props.clearUnsavedOptionFlag();
				this.props.clearUnsavedSettingsFlag();
			} else {
				return false;
			}
		}
	},

	initializeAnalyitics() {
		const tracksUser = this.props.tracksUserData;
		if ( tracksUser ) {
			analytics.initialize(
				tracksUser.userid,
				tracksUser.username
			);
		}
	},

	shouldComponentUpdate: function( nextProps ) {
		return nextProps.siteConnectionStatus !== this.props.siteConnectionStatus ||
			nextProps.jumpStartStatus !== this.props.jumpStartStatus ||
			nextProps.route.path !== this.props.route.path;
	},

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.jumpStartStatus !== this.props.jumpStartStatus ||
			nextProps.isJumpstarting !== this.props.isJumpstarting ) {
			this.handleJumpstart( nextProps );
		}
	},

	/**
	 *
	 * Takes care of redirection when
	 *  - jumpstarting ( resseting options )
	 * - the jumpstart is complete
	 * @param  {Object} nextProps The next props as received by componentWillReceiveProps
	 */
	handleJumpstart( nextProps ) {
		const history = createHistory();
		const willShowJumpStart = nextProps.jumpStartStatus;
		const willBeJumpstarting = nextProps.isJumpstarting;

		if ( ! this.props.jumpStartStatus && willShowJumpStart ) {
			window.location.hash = 'jumpstart';
			history.push( window.location.pathname + '?page=jetpack#/jumpstart' );
		}
		if ( ! this.props.jumpStartStatus && ! willShowJumpStart && ! willBeJumpstarting ) {
			history.push( window.location.pathname + '?page=jetpack#/dashboard' );
		}
	},

	renderMainContent: function( route ) {

		// Track page views
		analytics.tracks.recordEvent( 'jetpack_wpa_page_view', { path: route } );

		if ( ! this.props.userCanManageModules ) {
			return <NonAdminView { ...this.props } />
		}

		if ( ! this.props.siteConnectionStatus ) {
			return <JetpackConnect />
		}

		if ( this.props.jumpStartStatus ) {
			if ( '/' === route ) {
				const history = createHistory();
				history.push( window.location.pathname + '?page=jetpack#/jumpstart' );
			} else if ( '/jumpstart' === route ) {
				return <JumpStart />
			}
		}

		let pageComponent,
			navComponent = <Navigation route={ this.props.route }/>;
		switch ( route ) {
			case '/dashboard':
				pageComponent = <AtAGlance siteRawUrl={ this.props.siteRawUrl } siteAdminUrl={ this.props.siteAdminUrl } />;
				break;
			case '/apps':
				pageComponent = <Apps siteRawUrl={ this.props.siteRawUrl } />;
				break;
			case '/plans':
				pageComponent = <Plans siteRawUrl={ this.props.siteRawUrl } siteAdminUrl={ this.props.siteAdminUrl } />;
				break;
			case '/settings':
				navComponent = <NavigationSettings route={ this.props.route } />;
				pageComponent = <GeneralSettings route={ this.props.route } />;
				break;
			case '/general':
				navComponent = <NavigationSettings route={ this.props.route } />;
				pageComponent = <GeneralSettings route={ this.props.route } />;
				break;
			case '/engagement':
				navComponent = <NavigationSettings route={ this.props.route } />;
				pageComponent = <Engagement route={ this.props.route } />;
				break;
			case '/discussion':
				navComponent = <NavigationSettings route={ this.props.route } />;
				pageComponent = <Discussion route={ this.props.route } siteRawUrl={ this.props.siteRawUrl } />;
				break;
			case '/security':
				navComponent = <NavigationSettings route={ this.props.route } />;
				pageComponent = <Security route={ this.props.route } siteAdminUrl={ this.props.siteAdminUrl } />;
				break;
			case '/traffic':
				navComponent = <NavigationSettings route={ this.props.route } />;
				pageComponent = <Traffic route={ this.props.route } siteRawUrl={ this.props.siteRawUrl } siteAdminUrl={ this.props.siteAdminUrl } />;
				break;
			case '/appearance':
				navComponent = <NavigationSettings route={ this.props.route } />;
				pageComponent = <Appearance route={ this.props.route } />;
				break;
			case '/writing':
				navComponent = <NavigationSettings route={ this.props.route } />;
				pageComponent = <Writing route={ this.props.route } siteAdminUrl={ this.props.siteAdminUrl } />;
				break;
			case '/search':
				navComponent = <NavigationSettings route={ this.props.route } />;
				pageComponent = <SearchPage siteAdminUrl={ this.props.siteAdminUrl } />;
				break;

			default:
				pageComponent = <AtAGlance siteRawUrl={ this.props.siteRawUrl } siteAdminUrl={ this.props.siteAdminUrl } />;
		}

		window.wpNavMenuClassChange();

		return (
			<div>
				{ navComponent }
				{ pageComponent }
			</div>
		);
	},

	render: function() {
		return (
			<div>
				<Masthead/>
					<div className="jp-lower">
						<AdminNotices />
						<JetpackNotices />
						{ this.renderMainContent( this.props.route.path ) }
						{
							this.props.jumpStartStatus || '/apps' === this.props.route.path ?
							null :
							<SupportCard />
						}
					</div>
				<Footer siteAdminUrl={ this.props.siteAdminUrl } />
			</div>
		);
	}

} );

export default connect(
	state => {
		return  {
			jumpStartStatus: getJumpStartStatus( state ),
			isJumpstarting: isJumpstarting( state ),
			siteConnectionStatus: getSiteConnectionStatus( state ),
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			apiRoot: getApiRootUrl( state ),
			apiNonce: getApiNonce( state ),
			tracksUserData: getTracksUserData( state ),
			areThereUnsavedModuleOptions: areThereUnsavedModuleOptions( state ),
			areThereUnsavedSettings: areThereUnsavedSettings( state ),
			userCanManageModules: userCanManageModules( state )
		};
	},
	dispatch => bindActionCreators( { setInitialState, clearUnsavedOptionFlag, clearUnsavedSettingsFlag }, dispatch )
)( withRouter( Main ) );

/**
 * Hack for changing the sub-nav menu core classes for 'settings' and 'dashboard'
 */
window.wpNavMenuClassChange = function() {
	let hash = window.location.hash;
	const settingRoutes = [
		'#/settings',
		'#/general',
		'#/discussion',
		'#/security',
		'#/traffic',
		'#/writing',
		'#/search'
	],
	dashboardRoutes = [
		'#/',
		'#/dashboard',
		'#/apps',
		'#/plans'
	];

	// Clear currents
	jQuery( '.current' ).each( function( i, obj ) {
		jQuery( obj ).removeClass( 'current' );
	} );

	hash = hash.split( '?' )[0];
	if ( includes( dashboardRoutes, hash ) ) {
		let subNavItem = jQuery( '#toplevel_page_jetpack' ).find( 'li' ).filter( function( index ) {
			return index === 1;
		} );
		subNavItem[0].classList.add( 'current' );
	} else if ( includes( settingRoutes, hash ) ) {
		let subNavItem = jQuery( '#toplevel_page_jetpack' ).find( 'li' ).filter( function( index ) {
			return index === 2;
		} );
		subNavItem[0].classList.add( 'current' );
	}

	const $body = jQuery( 'body' );

	$body.on( 'click', 'a[href$="#/dashboard"], a[href$="#/settings"], .jp-dash-section-header__settings[href="#/security"], .dops-button[href="#/plans"]', function() {
		window.scrollTo( 0, 0 );
	} );

	$body.on( 'click', '.jetpack-js-stop-propagation', function( e ) {
		e.stopPropagation();
	} );
};
