import { __, _x } from '@wordpress/i18n';
import Button from 'components/button';
import Card from 'components/card';
import Modal from 'components/modal';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import {
	getSiteConnectionStatus as _getSiteConnectionStatus,
	isCurrentUserLinked as _isCurrentUserLinked,
} from 'state/connection';
import { sendMobileLoginEmail } from 'state/mobile/actions';
import onKeyDownCallback from 'utils/onkeydown-callback';

export class MobileMagicLink extends React.Component {
	static displayName = 'MobileMagicLink';

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

	renderModal() {
		return (
			<Modal className="mobile-magic-link__modal" onRequestClose={ this.toggleModalVisibility }>
				<Card className="mobile-magic-link__modal__body">
					<h2>{ __( 'Email me a link to log in to the app', 'jetpack' ) }</h2>
					<h4>
						{ __(
							"Easily log in to the WordPress app by clicking the link we'll send to the email address on your account.",
							'jetpack'
						) }
					</h4>
					<div className="mobile-magic-link__modal-actions">
						<Button
							className="mobile-magic-link__modal-cancel"
							onClick={ this.toggleModalVisibility }
						>
							{ _x( 'Cancel', 'A caption for a button to cancel an action.', 'jetpack' ) }
						</Button>
						<Button onClick={ this.clickSendLoginEmail } primary>
							{ _x(
								'Send link',
								'A caption for a button to log in to the WordPress mobile app.',
								'jetpack'
							) }
						</Button>
					</div>
				</Card>
			</Modal>
		);
	}

	render() {
		const { showModal } = this.state;
		return (
			<div className="mobile-magic-link">
				<a
					className="mobile-magic-link__button"
					onClick={ this.handleOpenModal }
					onKeyDown={ onKeyDownCallback( this.handleOpenModal ) }
					role="button"
					tabIndex="0"
				>
					{ __( 'Log in to the WordPress mobile app', 'jetpack' ) }
				</a>
				{ showModal && this.renderModal() }
			</div>
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
)( MobileMagicLink );
