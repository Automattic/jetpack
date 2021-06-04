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
// import { PopUpConnection } from '@automattic/jetpack-connection';
import AuthIframe from 'components/auth-iframe';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
// import QueryConnectionStatus from 'components/data/query-connection-status';

class JetpackConnectModal extends Component {
	static propTypes = {
		showSurvey: PropTypes.bool,
		onAuthorized: PropTypes.func,
		onRequestClose: PropTypes.func,
	};

	static defaultProps = {
		showSurvey: false,
		onRequestClose: noop,
	};

	onAuthorized = () => {
		this.props.showAuthorizedNotice();
		this.props.onAuthorized();
		this.props.onRequestClose();
	};

	render() {
		return (
			<Modal className="jp-connect-dialog__modal" onRequestClose={ this.props.onRequestClose }>
				<Card>
					<div className="jp-connect-dialog__header">
						<h2>{ __( 'Connect Jetpack', 'jetpack' ) }</h2>
						<Gridicon
							icon="cross"
							className="jetpack-termination-dialog__close-icon"
							onClick={ this.props.onRequestClose }
						/>
					</div>
					<div className="jp-connect-dialog__button">
						{ this.props.children }
						<AuthIframe
							scrollTo={ false }
							title={ __( 'Connect to the WordPress.com cloud', 'jetpack' ) }
							location="connect-modal"
							onAuthorized={ this.onAuthorized }
						/>
					</div>
				</Card>
			</Modal>
		);
	}
}

export default connect( null, dispatch => {
	return {
		showAuthorizedNotice: () => {
			return dispatch(
				createNotice( 'is-info', __( 'Connected Successfully', 'jetpack' ), {
					id: 'NOTICE_CONNECTED',
				} )
			);
		},
	};
} )( JetpackConnectModal );
