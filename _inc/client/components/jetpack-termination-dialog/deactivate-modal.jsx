/**
 * External dependencies
 */
import { connect } from 'react-redux';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import {
	getApiNonce,
	getApiRootUrl,
	getTracksUserData,
	setInitialState,
} from 'state/initial-state';
import analytics from 'lib/analytics';
import JetpackTerminationDialog from './dialog';
import restApi from 'rest-api';

class JetpackDeactivateModal extends Component {
	UNSAFE_componentWillMount() {
		this.props.setInitialState();
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
		this.initializeAnalytics();
	}

	initializeAnalytics = () => {
		const tracksUser = this.props.tracksUserData;

		if ( tracksUser ) {
			analytics.initialize( tracksUser.userid, tracksUser.username, {
				blog_id: tracksUser.blogid,
			} );
		}
	};

	deactivateJetpack = () => {
		if ( parent.deactivateJetpack ) {
			parent.deactivateJetpack();
		}
	};

	closeDialog = () => {
		if ( parent.tb_remove ) {
			parent.tb_remove();
		}
	};

	render() {
		return (
			<JetpackTerminationDialog
				closeDialog={ this.closeDialog }
				location={ 'plugins' }
				purpose={ 'deactivate' }
				terminateJetpack={ this.deactivateJetpack }
			/>
		);
	}
}

export default connect(
	state => ( {
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
		tracksUserData: getTracksUserData( state ),
	} ),
	dispatch => ( {
		setInitialState: () => {
			return dispatch( setInitialState() );
		},
	} )
)( JetpackDeactivateModal );
