import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const FirstTimeModal = ( { onClose } ) => {
	return (
		<Modal
			className="jetpack-donations-first-time-modal"
			onRequestClose={ onClose }
			title={ __( 'Accept Donations with Stripe', 'jetpack' ) }
		>
			<div className="jetpack-donations-first-time-modal__content">
				<p>
					{ __(
						"To accept donations on your site, you'll need to connect your Stripe account. Here's what you need to do:",
						'jetpack'
					) }{ ' ' }
					<a
						href="https://wordpress.com/support/wordpress-editor/blocks/donations/#about-donations"
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Learn more about donations.', 'jetpack' ) }
					</a>
				</p>
				<ol>
					<li>{ __( 'Connect your Stripe account to your WordPress.com account', 'jetpack' ) }</li>
					<li>{ __( 'Set up your business information in Stripe', 'jetpack' ) }</li>
					<li>{ __( 'Configure your payment settings and supported currencies', 'jetpack' ) }</li>
				</ol>
				<p>
					{ __(
						'Once connected, you can customize your donation form and start accepting payments.',
						'jetpack'
					) }
				</p>
				<p>
					{ __(
						'Please note that accepting donations has additional requirements from Stripe. Learn more about',
						'jetpack'
					) }
					&nbsp;
					<a
						href="https://support.stripe.com/questions/requirements-for-accepting-tips-or-donations"
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'requirements for accepting donations', 'jetpack' ) }
					</a>
					.
				</p>

				<div className="jetpack-donations-first-time-modal__actions">
					<Button variant="primary" onClick={ onClose }>
						{ __( 'Got it', 'jetpack' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default FirstTimeModal;
