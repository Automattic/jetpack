/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import assign from 'lodash/assign';
import includes from 'lodash/includes';
import { createHistory } from 'history';

/**
 * Internal dependencies
 */
import Masthead from 'components/masthead';
import Navigation from 'components/navigation';
import NavigationSettings from 'components/navigation-settings';
import JetpackConnect from 'components/jetpack-connect';
import JumpStart from 'components/jumpstart';
import { getJumpStartStatus } from 'state/jumpstart';
import { getSiteConnectionStatus } from 'state/connection';
import { setInitialState, getSiteRawUrl, getSiteAdminUrl } from 'state/initial-state';
import AtAGlance from 'at-a-glance/index.jsx';
import Engagement from 'engagement/index.jsx';
import Security from 'security/index.jsx';
import Appearance from 'appearance/index.jsx';
import GeneralSettings from 'general-settings/index.jsx';
import Writing from 'writing/index.jsx';
import Apps from 'apps/index.jsx';
import Plans from 'plans/index.jsx';
import Footer from 'components/footer';
import SupportCard from 'components/support-card';
import NonAdminView from 'components/non-admin-view';
import JetpackNotices from 'components/jetpack-notices';
import SearchPage from 'search/index.jsx';
import analytics from 'lib/analytics';

const Main = React.createClass( {
	componentWillMount: function() {
		this.props.setInitialState();
	},

	shouldComponentUpdate: function( nextProps ) {
		return nextProps.jetpack.connection.status !== this.props.jetpack.connection.status ||
			nextProps.jetpack.jumpstart.status.showJumpStart !== getJumpStartStatus( this.props ) ||
			nextProps.route.path !== this.props.route.path;
	},

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.jetpack.jumpstart.status.showJumpStart !== this.props.jetpack.jumpstart.status.showJumpStart ||
			nextProps.jetpack.jumpstart.status.isJumpstarting !== this.props.jetpack.jumpstart.status.isJumpstarting ) {
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
		const willShowJumpStart = nextProps.jetpack.jumpstart.status.showJumpStart;
		const willBeJumpstarting = nextProps.jetpack.jumpstart.status.isJumpstarting;

		if ( ! this.props.showJumpStart && willShowJumpStart ) {
			window.location.hash = 'jumpstart';
			history.push( window.location.pathname + '?page=jetpack#/jumpstart' );
		}
		if ( ! this.props.jetpack.jumpstart.showJumpStart && ! willShowJumpStart && ! willBeJumpstarting ) {
			history.push( window.location.pathname + '?page=jetpack#/dashboard' );
		}
	},

	renderMainContent: function( route ) {
		const showJumpStart = getJumpStartStatus( this.props );
		const canManageModules = window.Initial_State.userData.currentUser.permissions.manage_modules;

		// Track page views
		analytics.tracks.recordEvent( 'jetpack_wpa_page_view', { path: route } );

		// On any route change/re-render, jump back to the top of the page
		window.scrollTo( 0, 0 );

		if ( ! canManageModules ) {
			return <NonAdminView { ...this.props } />
		}

		if ( ! getSiteConnectionStatus( this.props ) ) {
			return <JetpackConnect { ...this.props } />
		}

		if ( showJumpStart ) {
			if ( '/' === route ) {
				const history = createHistory();
				history.push( window.location.pathname + '?page=jetpack#/jumpstart' );
			} else if ( '/jumpstart' === route ) {
				return <JumpStart { ...this.props } />
			}
		}

		let pageComponent,
			navComponent = <Navigation { ...this.props } />;
		switch ( route ) {
			case '/dashboard':
				pageComponent = <AtAGlance { ...this.props } />;
				break;
			case '/apps':
				pageComponent = <Apps siteRawUrl={ this.props.siteRawUrl } { ...this.props } />;
				break;
			case '/professional':
				pageComponent = <Plans siteRawUrl={ this.props.siteRawUrl } siteAdminUrl={ this.props.siteAdminUrl } { ...this.props } />;
				break;
			case '/settings':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <GeneralSettings { ...this.props } />;
				break;
			case '/general':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <GeneralSettings { ...this.props } />;
				break;
			case '/engagement':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <Engagement { ...this.props } />;
				break;
			case '/security':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <Security { ...this.props } />;
				break;
			case '/appearance':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <Appearance { ...this.props } />;
				break;
			case '/writing':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <Writing { ...this.props } />;
				break;
			case '/search':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <SearchPage { ...this.props } />;
				break;

			default:
				pageComponent = <AtAGlance { ...this.props } />;
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
				<Masthead { ...this.props } />
					<div className="jp-lower">
						<JetpackNotices { ...this.props } />
						{ this.renderMainContent( this.props.route.path ) }
						{
							this.props.getJumpStartStatus || '/apps' === this.props.route.path ?
							null :
							<SupportCard { ...this.props } />
						}
					</div>
				<Footer { ...this.props } />
			</div>
		);
	}

} );

export default connect(
	state => {
		// This is tricky. We're passing the whole state as props of the main component
		return assign( {}, state, {
			getJumpStartStatus: getJumpStartStatus( state ),
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state )
		} );
	},
	dispatch => bindActionCreators( { setInitialState }, dispatch )
)( Main );

/**
 * Hack for changing the sub-nav menu core classes for 'settings' and 'dashboard'
 */
window.wpNavMenuClassChange = function() {
	let hash = window.location.hash;
	const settingRoutes = [
		'#/settings',
		'#/general',
		'#/engagement',
		'#/security',
		'#/appearance',
		'#/writing',
		'#/search'
	],
	dashboardRoutes = [
		'#/',
		'#/dashboard',
		'#/apps',
		'#/professional'
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

	jQuery( 'body' ).on( 'click', '.jetpack-js-stop-propagation', function( e ) {
		e.stopPropagation();
	} );
};
