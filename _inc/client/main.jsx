/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

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
import { Page as AtAGlance } from 'at-a-glance';
import Engagement from 'engagement/Page.jsx';
import Security from 'security/Page.jsx';
import GeneralSettings from 'general-settings/index.jsx';
import More from 'more/Page.jsx';
import QueryModules from 'components/data/query-modules';
import { getModules } from 'state/modules';
import Footer from 'components/footer';
import SupportCard from 'components/support-card';

const Main = React.createClass( {
	componentWillMount: function() {
		this.props.setInitialState();
	},

	shouldComponentUpdate: function( nextProps ) {
		if ( nextProps.jetpack.connection.status !== this.props.jetpack.connection.status ) {
			window.location.reload();
		}

		if ( nextProps.jetpack.jumpstart.status.showJumpStart !== getJumpStartStatus( this.props ) ) {
			return true;
		}

		if ( nextProps.route.path !== this.props.route.path ) {
			return true;
		}
	},

	renderMainContent: function( route ) {
		switch( route ) {
			case '/dashboard':
				return <AtAGlance { ...this.props } />;
				break;
			case '/engagement':
				return <Engagement { ...this.props } />;
				break;
			case '/security':
				return <Security { ...this.props } />;
				break;
			case '/health':
				return 'This will be the health page';
				break;
			case '/more':
				return <More { ...this.props } />;
				break;
			case '/general':
				return <GeneralSettings { ...this.props } />;
				break;

			default:
				return <AtAGlance { ...this.props } />;
		}
	},

	render: function() {
		return (
			<div>
				<Masthead { ...this.props } />
					<div className="jp-lower">
						<Navigation { ...this.props } />
						{ this.renderMainContent( this.props.route.path ) }
						<SupportCard { ...this.props } />
					</div>
				<Footer { ...this.props } />
			</div>
		);
	}

} );

export default connect(
	state => {
		return state;
	},
	dispatch => bindActionCreators( { setInitialState }, dispatch )
)( Main );