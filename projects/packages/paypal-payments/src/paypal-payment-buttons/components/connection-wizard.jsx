/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The connection wizard.
 *
 * @package
 */

import { Button, Notice, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ONBOARDING_SANDBOX } from '../utils/paypal-partner-sdk';
import { wizardLogo } from './wizard-logo';

const labelConnect = __( 'Connect', 'jetpack-paypal-payments' );
const labelConnecting = __( 'Connecting\u2026', 'jetpack-paypal-payments' );
const labelHide = __( 'Hide', 'jetpack-paypal-payments' );
const labelShow = __( 'Show', 'jetpack-paypal-payments' );
const labelHideSecret = __( 'Hide client secret', 'jetpack-paypal-payments' );
const labelShowSecret = __( 'Show client secret', 'jetpack-paypal-payments' );

/**
 * The guided PayPal connection wizard, shown when the site has no connection.
 *
 * @param {object}   props                           - Component props.
 * @param {Function} props.setIsConnected            - Setter for the connection state.
 * @param {string}   props.environment               - 'production' or 'sandbox'.
 * @param {Function} props.setEnvironment            - Setter for the environment.
 * @param {boolean}  props.showReconnect             - Whether the merchant asked to reconnect.
 * @param {Function} props.setShowReconnect          - Setter for the reconnect request.
 * @param {string}   props.signupUrl                 - Partner Referrals action URL, empty until fetched.
 * @param {Function} props.setOnboardingRequested    - Setter for the onboarding request.
 * @param {boolean}  props.isOverlayOpen             - Whether the onboarding overlay is up.
 * @param {boolean}  props.isOpeningPayPal           - Whether PayPal is being opened.
 * @param {Function} props.setFrameNode              - Ref callback for the onboarding frame.
 * @param {string}   props.clientId                  - The PayPal Client ID field value.
 * @param {string}   props.clientSecret              - The PayPal Client Secret field value.
 * @param {string}   props.connectError              - Connection error message, or null.
 * @param {Function} props.setConnectError           - Setter for the connection error.
 * @param {boolean}  props.connectErrorDismissed     - Whether the merchant dismissed that error.
 * @param {Function} props.setConnectErrorDismissed  - Setter for the dismissal.
 * @param {boolean}  props.isConnecting              - Whether the credentials are being submitted.
 * @param {boolean}  props.isCompletingOnboarding    - Whether onboarding is being finished.
 * @param {string}   props.wizardStep                - The current wizard step.
 * @param {Function} props.setWizardStep             - Setter for the wizard step.
 * @param {boolean}  props.showSecretField           - Whether the secret is shown in the clear.
 * @param {Function} props.setShowSecretField        - Setter for the secret visibility.
 * @param {boolean}  props.partnerReferralsAvailable - Whether Partner Referrals can be used.
 * @param {Function} props.handleClientIdChange      - Change handler for the Client ID field.
 * @param {Function} props.handleClientSecretChange  - Change handler for the Client Secret field.
 * @param {string}   props.clientIdWarning           - Client ID format warning, or null.
 * @param {Function} props.handleConnect             - Submit the manual credentials.
 * @param {Function} props.fetchSignupLink           - Fetch the Partner Referrals link.
 * @param {Function} props.cancelOnboarding          - Close the onboarding overlay.
 * @return {Element} The connection wizard.
 */
export default function ConnectionWizard( {
	setIsConnected,
	environment,
	setEnvironment,
	showReconnect,
	setShowReconnect,
	signupUrl,
	setOnboardingRequested,
	isOverlayOpen,
	isOpeningPayPal,
	setFrameNode,
	clientId,
	clientSecret,
	connectError,
	setConnectError,
	connectErrorDismissed,
	setConnectErrorDismissed,
	isConnecting,
	isCompletingOnboarding,
	wizardStep,
	setWizardStep,
	showSecretField,
	setShowSecretField,
	partnerReferralsAvailable,
	handleClientIdChange,
	handleClientSecretChange,
	clientIdWarning,
	handleConnect,
	fetchSignupLink,
	cancelOnboarding,
} ) {
	// Pre-compute "Connect with PayPal" button label to avoid nested ternary.
	const labelConnectWithPayPal = __( 'Connect with PayPal', 'jetpack-paypal-payments' );
	const labelCompletingSetup = __( 'Completing setup\u2026', 'jetpack-paypal-payments' );
	let connectWithPayPalLabel = labelConnectWithPayPal;
	if ( isOpeningPayPal ) {
		connectWithPayPalLabel = labelConnecting;
	} else if ( isCompletingOnboarding ) {
		connectWithPayPalLabel = labelCompletingSetup;
	}

	// The welcome step is all Partner Referrals, and wizardStep can still say
	// 'welcome' after a failed connection check or a disconnect.
	const visibleStep =
		wizardStep === 'welcome' && ! partnerReferralsAvailable ? 'dashboard' : wizardStep;

	/*
	 * No src: the frame keeps its initial document, which the effect above writes
	 * the link and SDK into. Pointing src at about:blank navigates over that
	 * write and leaves the frame empty.
	 */
	const onboardingFrame = signupUrl ? (
		<>
			{ /* Only while the overlay is up: the frame is mounted hidden long
			     before anyone clicks Connect, and a close button in the tab
			     order then has nothing to close. */ }
			{ isOverlayOpen && (
				<Button
					className="jetpack-paypal-onboarding-frame__close"
					variant="secondary"
					aria-label={ __( 'Close PayPal onboarding', 'jetpack-paypal-payments' ) }
					onClick={ cancelOnboarding }
				>
					{ __( 'Close', 'jetpack-paypal-payments' ) }
				</Button>
			) }
			<iframe
				ref={ setFrameNode }
				title={ __( 'PayPal onboarding', 'jetpack-paypal-payments' ) }
				sandbox={ ONBOARDING_SANDBOX }
				className={
					'jetpack-paypal-onboarding-frame' +
					( isOverlayOpen ? ' jetpack-paypal-onboarding-frame--active' : '' )
				}
			/>
		</>
	) : null;

	return (
		<>
			<div className="jetpack-paypal-payment-buttons__connect">
				{ /* Reconnecting from a block that still holds a button — let the
				     merchant back out to its preview without connecting. */ }
				{ showReconnect && (
					<div className="jetpack-paypal-payment-buttons__reconnect-header">
						<Button variant="tertiary" onClick={ () => setShowReconnect( false ) }>
							{ __( 'Cancel', 'jetpack-paypal-payments' ) }
						</Button>
					</div>
				) }

				{ /* Step indicator */ }
				{ visibleStep !== 'welcome' && visibleStep !== 'success' && (
					<div
						className="jetpack-paypal-wizard__step-indicator"
						role="list"
						aria-label={ __( 'Setup progress', 'jetpack-paypal-payments' ) }
					>
						<span
							role="listitem"
							aria-current={ visibleStep === 'dashboard' ? 'step' : undefined }
							className={ `jetpack-paypal-wizard__step ${
								visibleStep === 'dashboard' || visibleStep === 'credentials' ? 'is-active' : ''
							}` }
						>
							{ '1' }
						</span>
						<span className="jetpack-paypal-wizard__step-line" aria-hidden="true" />
						<span
							role="listitem"
							aria-current={ visibleStep === 'credentials' ? 'step' : undefined }
							className={ `jetpack-paypal-wizard__step ${
								visibleStep === 'credentials' ? 'is-active' : ''
							}` }
						>
							{ '2' }
						</span>
						<span className="jetpack-paypal-wizard__step-line" aria-hidden="true" />
						<span role="listitem" className="jetpack-paypal-wizard__step">
							{ '3' }
						</span>
					</div>
				) }

				{ /* Step 1: Welcome — Partner Referrals primary, manual credentials secondary */ }
				{ visibleStep === 'welcome' && (
					<div className="jetpack-paypal-wizard__welcome">
						{ wizardLogo }
						<h3>{ __( 'Connect PayPal', 'jetpack-paypal-payments' ) }</h3>
						<p>
							{ __(
								'Accept payments with PayPal by connecting your PayPal account.',
								'jetpack-paypal-payments'
							) }
						</p>
						<div className="jetpack-paypal-wizard__env-toggle">
							<ToggleControl
								label={ __( 'Use sandbox (testing)', 'jetpack-paypal-payments' ) }
								checked={ environment === 'sandbox' }
								onChange={ checked => setEnvironment( checked ? 'sandbox' : 'production' ) }
							/>
						</div>
						<div className="jetpack-paypal-wizard__actions">
							<Button
								variant="primary"
								onClick={ () => {
									// A frame built after the click misses that click's user
									// activation, so PayPal's window.open inside it is
									// popup-blocked. Fetch the referral and stop; that
									// builds the frame for the next click to activate.
									if ( ! signupUrl ) {
										fetchSignupLink();
										return;
									}

									setOnboardingRequested( true );
								} }
								isBusy={ isOpeningPayPal || isCompletingOnboarding }
								disabled={ isOpeningPayPal || isCompletingOnboarding }
							>
								{ connectWithPayPalLabel }
							</Button>
						</div>
						{ connectError && ! connectErrorDismissed && (
							<Notice
								status="error"
								isDismissible
								onDismiss={ () => setConnectErrorDismissed( true ) }
							>
								{ connectError }
							</Notice>
						) }
						<p className="jetpack-paypal-wizard__hint">
							<Button variant="link" onClick={ () => setWizardStep( 'dashboard' ) }>
								{ __( 'Or enter your API credentials manually', 'jetpack-paypal-payments' ) }
							</Button>
						</p>
					</div>
				) }

				{ /* Step 2: Open PayPal Dashboard */ }
				{ visibleStep === 'dashboard' && (
					<div className="jetpack-paypal-wizard__dashboard">
						<h3>{ __( 'Step 1 of 3: Get Your API Credentials', 'jetpack-paypal-payments' ) }</h3>
						<ol className="jetpack-paypal-wizard__instructions">
							<li>
								{ __(
									'Open the PayPal Developer Dashboard (opens in a new tab)',
									'jetpack-paypal-payments'
								) }
							</li>
							<li>
								{ __( 'Log in with your PayPal Business account', 'jetpack-paypal-payments' ) }
							</li>
							<li>{ __( 'Go to Apps & Credentials', 'jetpack-paypal-payments' ) }</li>
							<li>
								{ __(
									'Copy the Client ID and Client Secret from your app',
									'jetpack-paypal-payments'
								) }
							</li>
						</ol>
						<div className="jetpack-paypal-wizard__actions">
							<Button
								variant="primary"
								href={ `https://developer.paypal.com/dashboard/applications/${
									environment === 'sandbox' ? 'sandbox' : 'live'
								}` }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __( 'Open PayPal Dashboard ↗', 'jetpack-paypal-payments' ) }
							</Button>
						</div>
						<p className="jetpack-paypal-wizard__hint">
							{ __(
								'Once you have your Client ID and Secret, come back here and continue.',
								'jetpack-paypal-payments'
							) }
						</p>
						<div className="jetpack-paypal-wizard__actions">
							<Button variant="primary" onClick={ () => setWizardStep( 'credentials' ) }>
								{ __( 'I have my credentials — Next', 'jetpack-paypal-payments' ) }
							</Button>
						</div>
						{ partnerReferralsAvailable && (
							<div className="jetpack-paypal-wizard__nav">
								<Button variant="link" onClick={ () => setWizardStep( 'welcome' ) }>
									{ __( '← Back', 'jetpack-paypal-payments' ) }
								</Button>
							</div>
						) }
					</div>
				) }

				{ /* Step 3: Enter Credentials */ }
				{ visibleStep === 'credentials' && (
					<div className="jetpack-paypal-wizard__credentials">
						<h3>{ __( 'Step 2 of 3: Enter Credentials', 'jetpack-paypal-payments' ) }</h3>
						<p className="jetpack-paypal-wizard__subtitle">
							{ __(
								'Enter the API credentials from your PayPal account:',
								'jetpack-paypal-payments'
							) }
						</p>

						{ connectError && (
							<Notice status="error" isDismissible onDismiss={ () => setConnectError( null ) }>
								{ connectError }
							</Notice>
						) }

						{ environment === 'sandbox' && (
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Sandbox mode — buttons will use test credentials.',
									'jetpack-paypal-payments'
								) }
							</Notice>
						) }

						<TextControl
							label={ __( 'Client ID', 'jetpack-paypal-payments' ) }
							value={ clientId }
							onChange={ handleClientIdChange }
							help={
								clientIdWarning
									? undefined
									: __( 'Found under your app name in the dashboard.', 'jetpack-paypal-payments' )
							}
							className={
								clientIdWarning ? 'jetpack-paypal-payment-buttons__has-warning' : undefined
							}
							autoComplete="off"
						/>
						{ clientIdWarning && (
							<p className="jetpack-paypal-payment-buttons__field-warning">{ clientIdWarning }</p>
						) }

						<div className="jetpack-paypal-wizard__secret-field">
							<TextControl
								label={ __( 'Client Secret', 'jetpack-paypal-payments' ) }
								value={ clientSecret }
								onChange={ handleClientSecretChange }
								type={ showSecretField ? 'text' : 'password' }
								help={ __(
									'Click "Show" in PayPal to reveal it, then copy.',
									'jetpack-paypal-payments'
								) }
								autoComplete="off"
							/>
							<Button
								variant="tertiary"
								className="jetpack-paypal-wizard__toggle-secret"
								onClick={ () => setShowSecretField( ! showSecretField ) }
								aria-label={ showSecretField ? labelHideSecret : labelShowSecret }
							>
								{ showSecretField ? labelHide : labelShow }
							</Button>
						</div>

						<div className="jetpack-paypal-wizard__actions">
							<Button
								variant="primary"
								onClick={ handleConnect }
								isBusy={ isConnecting }
								disabled={ isConnecting || ! clientId || ! clientSecret }
							>
								{ isConnecting ? labelConnecting : labelConnect }
							</Button>
						</div>
						<div className="jetpack-paypal-wizard__nav">
							<Button
								variant="link"
								onClick={ () => setWizardStep( 'dashboard' ) }
								disabled={ isConnecting }
							>
								{ __( '← Back', 'jetpack-paypal-payments' ) }
							</Button>
						</div>

						<p className="jetpack-paypal-wizard__env-toggle">
							{ environment === 'production' ? (
								<Button variant="link" onClick={ () => setEnvironment( 'sandbox' ) }>
									{ __( 'Use Sandbox for testing', 'jetpack-paypal-payments' ) }
								</Button>
							) : (
								<>
									<Button variant="link" onClick={ () => setEnvironment( 'production' ) }>
										{ __( 'Switch to Production (Live)', 'jetpack-paypal-payments' ) }
									</Button>
									<br />
									<span className="jetpack-paypal-wizard__env-hint">
										{ __(
											'Sandbox creates test buttons that do not process real payments.',
											'jetpack-paypal-payments'
										) }
									</span>
								</>
							) }
						</p>
					</div>
				) }

				{ /* Step 4: Success */ }
				{ visibleStep === 'success' && (
					<div className="jetpack-paypal-wizard__success">
						<div className="jetpack-paypal-wizard__success-icon" aria-hidden="true">
							<span>&#10003;</span>
						</div>
						<h3>{ __( 'PayPal account connected!', 'jetpack-paypal-payments' ) }</h3>
						<p>
							{ __(
								"You're ready to create payment buttons and links. Fill in your product details and we'll create both an embeddable PayPal button and a shareable payment link.",
								'jetpack-paypal-payments'
							) }
						</p>
						<Button variant="primary" onClick={ () => setIsConnected( true ) }>
							{ __( 'Create Your First Button', 'jetpack-paypal-payments' ) }
						</Button>
					</div>
				) }
			</div>
			{ onboardingFrame }
		</>
	);
}
