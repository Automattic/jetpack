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

class JetpackDisconnectModal extends Component {
	static propTypes = {
		show: PropTypes.bool,
		toggleModal: PropTypes.func,
	};

	static defaultProps = {
		show: false,
		toggleModal: noop,
	};

	constructor( props ) {
		super( props );

		this.disconnectJetpack = this.disconnectJetpack.bind( this );
	}

	disconnectJetpack() {
		this.props.disconnectSite( true );
	}

	render() {
		const { show } = this.props;

		return (
			show && (
				<Modal className="jp-connection-settings__modal" onRequestClose={ this.props.toggleModal }>
					<JetpackTerminationDialog
						closeDialog={ this.props.toggleModal }
						disconnectJetpack={ this.disconnectJetpack }
						location={ 'dashboard' }
						purpose={ 'disconnect' }
					/>
				</Modal>
			)
		);
	}
}

export default connect(
	null,
	dispatch => {
		return {
			disconnectSite: () => {
				return dispatch( disconnectSite( true ) );
			},
		};
	}
)( JetpackDisconnectModal );
