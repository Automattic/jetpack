/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import Modal from 'components/modal';
import { noop } from 'lodash';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import JetpackDisconnect from './jetpack-disconnect';

export class JetpackDisconnectDialog extends React.Component {
	static propTypes = {
		show: PropTypes.bool,
		toggleModal: PropTypes.func,
	};

	static defaultProps = {
		show: false,
		toggleModal: noop,
	};

	closeModal = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'manage_site_connection',
			button: 'stay-connected',
		} );

		this.props.toggleModal();
	};

	render() {
		return (
			this.props.show && (
				<Modal className="jp-connection-settings__modal" onRequestClose={ this.props.toggleModal }>
					<JetpackDisconnect onStayConnectedClick={ this.closeModal } />
				</Modal>
			)
		);
	}
}

export default JetpackDisconnectDialog;
