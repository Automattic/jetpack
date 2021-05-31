/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
// import { disconnectSite } from 'state/connection';
import Modal from 'components/modal';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import ConnectButton from 'components/connect-button';
// import QueryConnectionStatus from 'components/data/query-connection-status';

class JetpackConnectModal extends Component {
	static propTypes = {
		show: PropTypes.bool,
		showSurvey: PropTypes.bool,
		closeModal: PropTypes.func,
	};

	static defaultProps = {
		show: false,
		showSurvey: false,
		closeModal: noop,
	};

	// disconnectJetpack = () => {
	// 	this.props.disconnectSite( true );
	// };

	handleDialogCloseClick = () => {
		// const { closeDialog, location, purpose } = this.props;
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_close_click', {
			location,
			purpose,
		} );
		closeDialog();
	};

	render() {
		const { show, showSurvey, toggleModal } = this.props;

		// const customConnect = useCallback( () => {
		// 	analytics.tracks.recordJetpackClick( {
		// 		target: 'connection-bar-click',
		// 		feature: props.feature,
		// 		is_user_wpcom_connected: 'no',
		// 		is_connection_owner: 'no',
		// 	} );

		// 	setShowConnect( true );
		// }, [ setShowConnect, props.feature ] );

		return (
			show && (
				<Modal className="jp-connect-dialog__modal" onRequestClose={ this.props.closeModal }>
					<Card>
						<div className="jp-connect-dialog__header">
							<h2>{ __( 'Connect Jetpack', 'jetpack' ) }</h2>
							<Gridicon
								icon="cross"
								className="jetpack-termination-dialog__close-icon"
								onClick={ this.props.closeModal }
							/>
						</div>
						<div className="jp-connect-dialog__button">
							{ /* <QueryConnectionStatus/> */ }
							<ConnectButton
								connectUser={ true }
								from="unlinked-user-connect"
								connectLegend={ __( 'Connect your WordPress.com account', 'jetpack' ) }
								connectInPlace={ false }
								connectInPopup={ true }
								// customConnect={ customConnect }
							/>
						</div>
					</Card>
				</Modal>
			)
		);
	}
}

export default connect( null, dispatch => {
	return {
		// disconnectSite: () => {
		// 	return dispatch( disconnectSite( true ) );
		// },
	};
} )( JetpackConnectModal );
