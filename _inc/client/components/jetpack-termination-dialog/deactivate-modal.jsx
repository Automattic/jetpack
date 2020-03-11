/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import JetpackTerminationDialog from './dialog';

class JetpackDeactivateModal extends Component {
	deactivateJetpack = () => {
		if ( parent.deactivateJetpack ) {
			parent.deactivateJetpack();
		}
		// TODO: handle errors here
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

export default JetpackDeactivateModal;
