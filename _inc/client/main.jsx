/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import assign from 'lodash/assign';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import Masthead from 'components/masthead';
import Navigation from 'components/navigation';
import JetpackConnect from 'components/jetpack-connect';
import JumpStart from 'components/jumpstart';
import { getJumpStartStatus } from 'state/jumpstart';
import { getSiteConnectionStatus } from 'state/connection';
import { setInitialState } from 'state/initial-state';
import AtAGlance from 'at-a-glance/index.jsx';
import Engagement from 'engagement/index.jsx';
import Security from 'security/index.jsx';
import Health from 'site-health/index.jsx';
import GeneralSettings from 'general-settings/index.jsx';
import More from 'more/index.jsx';
import Footer from 'components/footer';
import SupportCard from 'components/support-card';
import NonAdminView from 'components/non-admin-view';
import JetpackNotices from 'components/jetpack-notices';

const Main = React.createClass( {
	componentWillMount: function() {
		this.props.setInitialState();
	},

	shouldComponentUpdate: function( nextProps ) {
		return nextProps.jetpack.connection.status !== this.props.jetpack.connection.status ||
			nextProps.jetpack.jumpstart.status.showJumpStart !== getJumpStartStatus( this.props ) ||
			nextProps.route.path !== this.props.route.path;
	},

	renderMainContent: function( route ) {
		const showJumpStart = getJumpStartStatus( this.props );
		const canManageModules = window.Initial_State.userData.currentUser.permissions.manage_modules;

		// On any route change/re-render, jump back to the top of the page
		window.scrollTo( 0, 0 );

		if ( ! canManageModules ) {
			return <NonAdminView { ...this.props } />
		}

		if ( showJumpStart ) {
			return <JumpStart { ...this.props } />
		}

		if ( ! getSiteConnectionStatus( this.props ) ) {
			return <JetpackConnect { ...this.props } />
		}

		let pageComponent;
		switch ( route ) {
			case '/dashboard':
				pageComponent = <AtAGlance { ...this.props } />;
				break;
			case '/engagement':
				pageComponent = <Engagement { ...this.props } />;
				break;
			case '/security':
				pageComponent = <Security { ...this.props } />;
				break;
			case '/health':
				pageComponent = <Health { ...this.props } />;
				break;
			case '/more':
				pageComponent = <More { ...this.props } />;
				break;
			case '/general':
				pageComponent = <GeneralSettings { ...this.props } />;
				break;

			default:
				pageComponent = <AtAGlance { ...this.props } />;
		}

		wpNavMenuClassChange();

		return (
			<div>
				<Navigation { ...this.props } />
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
							this.props.getJumpStartStatus ?
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
		return assign( {}, state, {
			getJumpStartStatus: getJumpStartStatus( state )
		} );
	},
	dispatch => bindActionCreators( { setInitialState }, dispatch )
)( Main );

/**
 * Hack for changing the sub-nav menu core classes for 'settings' and 'dashboard'
 */
function wpNavMenuClassChange() {
	let hash = window.location.hash;
	const settingRoutes = [
		'#/settings',
		'#/general',
		'#/engagement',
		'#/security',
		'#/appearance',
		'#/writing'
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
}
