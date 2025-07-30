import * as WPElement from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Simple admin page component.
 *
 * @return {object} The admin page component.
 */
const AdminPage = () => {
	return (
		<div className="wrap">
			<h1>{ __( 'PayPal Payment Buttons', 'paypal-payment-buttons' ) }</h1>
			<div className="card">
				<h2>{ __( 'Block Available', 'paypal-payment-buttons' ) }</h2>
				<p>
					{ __(
						'The PayPal Payment Buttons block is now available in your block editor. You can find it in the "Monetize" category when adding blocks to your posts and pages.',
						'paypal-payment-buttons'
					) }
				</p>
				<h3>{ __( 'How to use:', 'paypal-payment-buttons' ) }</h3>
				<ol>
					<li>{ __( 'Edit a post or page', 'paypal-payment-buttons' ) }</li>
					<li>{ __( 'Click the "+" button to add a new block', 'paypal-payment-buttons' ) }</li>
					<li>
						{ __(
							'Look for "PayPal Payment Buttons" in the Monetize category',
							'paypal-payment-buttons'
						) }
					</li>
					<li>{ __( 'Configure your PayPal button settings', 'paypal-payment-buttons' ) }</li>
				</ol>
			</div>
		</div>
	);
};

/**
 * Initial render function.
 */
function renderApp() {
	const container = document.getElementById( 'paypal-payment-buttons-root' );

	if ( null === container ) {
		return;
	}

	WPElement.createRoot( container ).render( <AdminPage /> );
}

renderApp();
