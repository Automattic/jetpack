/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import analytics from 'lib/analytics';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import {
	getSiteConnectionStatus as _getSiteConnectionStatus,
	isCurrentUserLinked as _isCurrentUserLinked,
} from 'state/connection';
import Modal from 'components/modal';
import { sendMobileLoginEmail } from 'state/mobile/actions';
import PlanGrid from '../../plans/plan-grid';

export class PlansModal extends React.Component {
	static displayName = 'PlansModal';

	state = {
		showModal: false,
	};

	handleOpenModal = e => {
		e.preventDefault();
		analytics.tracks.recordJetpackClick( 'login_to_mobile_app_modal' );
		this.toggleModalVisibility();
	};

	toggleModalVisibility = () => {
		this.setState( {
			showModal: ! this.state.showModal,
		} );
	};

	clickSendLoginEmail = e => {
		e.preventDefault();
		analytics.tracks.recordJetpackClick( 'login_to_mobile_send_link' );
		this.toggleModalVisibility();
		this.props.sendMobileLoginEmail();
	};

	render() {
		return (
			<Modal className="plans-modal__modal" onRequestClose={ this.toggleModalVisibility }>
				<PlanGrid />
			</Modal>
		);
	}
}

export default connect(
	state => {
		return {
			isSiteConnected: _getSiteConnectionStatus( state ),
			isLinked: _isCurrentUserLinked( state ),
		};
	},
	{
		sendMobileLoginEmail,
	}
)( PlansModal );
