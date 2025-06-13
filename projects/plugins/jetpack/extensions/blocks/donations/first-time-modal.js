import { getRedirectUrl } from '@automattic/jetpack-components';
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Modal, Button, ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const FirstTimeModal = ( { onClose } ) => {
	// Configure the redirect URLs in the Jetpack Redirects service (see the README in jetpack-redirects).
	const supportLinkSource =
		isSimpleSite() || isAtomicSite()
			? 'wpcom-support-donation-block'
			: 'jetpack-support-donation-block';
	return (
		<Modal
			className="jetpack-donations-first-time-modal"
			onRequestClose={ onClose }
			title={ __( 'Accept Donations with Stripe', 'jetpack' ) }
		>
			<div className="jetpack-donations-first-time-modal__content">
				<p>
					{ createInterpolateElement(
						__(
							"To accept donations on your site, you'll need to connect your Stripe account. Here's what you need to do: <docLink>Learn more about donations</docLink>.",
							'jetpack'
						),
						{
							docLink: <ExternalLink href={ getRedirectUrl( supportLinkSource ) } />,
						}
					) }
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
					{ createInterpolateElement(
						__(
							'Please note that accepting donations has additional requirements from Stripe. Learn more about <requirementsLink>requirements for accepting donations</requirementsLink>.',
							'jetpack'
						),
						{
							requirementsLink: (
								<ExternalLink
									href={ getRedirectUrl( 'jetpack-support-donation-block-stripe-reqs' ) }
								/>
							),
						}
					) }
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
