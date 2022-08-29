import { __, _x } from '@wordpress/i18n';
import Button from 'components/button';
import Card from 'components/card';
import Modal from 'components/modal';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { isSiteConnected, isReconnectingSite, reconnectSite } from 'state/connection';

import './style.scss';

export class ReconnectModal extends React.Component {
	static displayName = 'ReconnectModal';

	static propTypes = {
		show: PropTypes.bool,
		onHide: PropTypes.func,
	};

	static defaultProps = {
		show: false,
	};

	shouldShowModal = () => {
		const { show } = this.props;

		return show && this.props.isSiteConnected && ! this.props.isReconnectingSite;
	};

	closeModal = () => {
		this.props.onHide();
	};

	clickReconnectSite = e => {
		e.preventDefault();
		analytics.tracks.recordJetpackClick( 'confirm_reconnect_modal' );
		this.props.reconnectSite();
		this.closeModal();
	};

	render() {
		return (
			this.shouldShowModal() && (
				<Modal className="reconnect__modal" onRequestClose={ this.closeModal }>
					<Card className="reconnect__modal__body">
						<h2>{ __( 'Reconnect Jetpack', 'jetpack' ) }</h2>
						<h4>
							{ __( 'You’ve clicked a link to restore your Jetpack connection.', 'jetpack' ) }
						</h4>
						<h4>
							<strong>
								{ __(
									'You should only do this if advised by Site Health tests or Jetpack Support.',
									'jetpack'
								) }
							</strong>
						</h4>
						<h4>{ __( 'Click below to reconnect Jetpack', 'jetpack' ) }</h4>
						<div className="reconnect__modal-actions">
							<Button className="reconnect__modal-cancel" onClick={ this.closeModal }>
								{ _x( 'Cancel', 'A caption for a button to cancel an action.', 'jetpack' ) }
							</Button>
							<Button
								className="reconnect__modal-reconnect"
								onClick={ this.clickReconnectSite }
								primary
							>
								{ _x(
									'Reconnect Jetpack',
									'A caption for a button to reconnect Jetpack.',
									'jetpack'
								) }
							</Button>
						</div>
					</Card>
				</Modal>
			)
		);
	}
}

export default connect(
	state => {
		return {
			isSiteConnected: isSiteConnected( state ),
			isReconnectingSite: isReconnectingSite( state ),
		};
	},
	dispatch => ( {
		reconnectSite: () => {
			return dispatch( reconnectSite() );
		},
	} )
)( ReconnectModal );
