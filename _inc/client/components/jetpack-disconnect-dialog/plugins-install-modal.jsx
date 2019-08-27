/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import JetpackDisconnectDialog from './dialog';

class JetpackDisconnectDialogPluginsInstallModal extends Component {
	constructor( props ) {
		super( props );

		this.disconnectJetpack = this.disconnectJetpack.bind( this );
		this.closeDialog = this.closeDialog.bind( this );
	}

	disconnectJetpack() {
		if ( parent.deactivateJetpack ) {
			parent.deactivateJetpack();
		}
	}

	closeDialog() {
		if ( parent.tb_remove ) {
			parent.tb_remove();
		}
	}

	render() {
		return (
			<JetpackDisconnectDialog
				disconnectJetpack={ this.disconnectJetpack }
				closeDialog={ this.closeDialog }
				location={ 'plugins' }
			/>
		);
	}
}

export default JetpackDisconnectDialogPluginsInstallModal;
