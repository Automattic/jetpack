/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import { disconnectSite } from 'state/connection';
import JetpackTerminationDialog from './dialog';
import Modal from 'components/modal';

// DEPRECATED in favor of <DisconnectDialog /> from the connection package.
class JetpackDisconnectModal extends Component {
	static propTypes = {
		show: PropTypes.bool,
		showSurvey: PropTypes.bool,
		toggleModal: PropTypes.func,
	};

	static defaultProps = {
		show: false,
		showSurvey: false,
		toggleModal: noop,
	};

	disconnectJetpack = () => {
		this.props.disconnectSite( true );
	};

	render() {
		const { show, showSurvey, toggleModal } = this.props;

		return (
			show && (
				<Modal className="jp-connection-settings__modal" onRequestClose={ toggleModal }>
					<JetpackTerminationDialog
						closeDialog={ toggleModal }
						location={ 'dashboard' }
						purpose={ 'disconnect' }
						showSurvey={ showSurvey }
						terminateJetpack={ this.disconnectJetpack }
					/>
				</Modal>
			)
		);
	}
}

export default connect( null, dispatch => {
	return {
		disconnectSite: () => {
			return dispatch( disconnectSite() );
		},
	};
} )( JetpackDisconnectModal );
