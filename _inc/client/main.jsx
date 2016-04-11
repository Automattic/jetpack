/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import Navigation from 'components/navigation';
import JetpackConnect from 'components/jetpack-connect';
import { getSiteConnectionStatus } from 'state/connection';
import { setInitialState } from 'state/initial-state';

const Main = React.createClass( {
	componentWillMount: function() {
		this.props.setInitialState();
	},

	shouldComponentUpdate: function( nextProps ) {
		if ( nextProps.jetpack.connection.status !== this.props.jetpack.connection.status ) {
			window.location.reload();
		}
	},

	renderMainContent: function() {
		const isSiteConnected = getSiteConnectionStatus( this.props );
		if ( isSiteConnected ) {
			return <Navigation { ...this.props } />
		}

		return <JetpackConnect { ...this.props } />
	},

	render: function() {
		return(
			<div>
				{ this.renderMainContent() }
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