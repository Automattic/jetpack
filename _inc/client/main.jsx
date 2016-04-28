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
	},

	renderMainContent: function() {
		const showJumpStart = getJumpStartStatus( this.props );

		if ( showJumpStart ) {
			return <JumpStart { ...this.props } />
		}

		if ( '' !== getSiteConnectionStatus( this.props ) ) {
			return <Navigation { ...this.props } />
		}

		return <JetpackConnect { ...this.props } />
	},

	render: function() {
		return (
			<div>
				<Masthead { ...this.props } />
					<div className="jp-lower">
						{ this.renderMainContent() }
						<SupportCard />
					</div>
				<Footer />
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