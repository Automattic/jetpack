/**
 * PayPal Payment Buttons — The site-wide PayPal connection.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { API_BASE } from './api-base';
import {
	ONBOARD_CALLBACK_NAME,
	ONBOARDING_FRAME_SHELL,
	loadPartnerScript,
	waitForAnchorBinding,
} from './paypal-partner-sdk';
import { getUserFriendlyError } from './validation';

/**
 * The PayPal connection is stored per-site, not per-block, so connecting or
 * disconnecting from one block changes the state of every other block in the
 * editor. Each instance only learns that from its own `/connection` fetch on
 * mount, so the block that made the change broadcasts it to its siblings.
 */
export const CONNECTION_CHANGED_EVENT = 'jetpack-paypal-payments-connection-changed';

/**
 * Tell the other blocks on this page that the site-wide PayPal connection
 * changed.
 *
 * @param {boolean} connected - The new connection state.
 */
export function broadcastConnectionChange( connected ) {
	window.dispatchEvent( new CustomEvent( CONNECTION_CHANGED_EVENT, { detail: { connected } } ) );
}

/**
 * The site-wide PayPal connection: its state, the onboarding wizard, and the
 * Partner Referrals flow that fills it in.
 *
 * @return {object} Connection state, its setters, and the wizard's handlers.
 */
export function usePayPalConnection() {
	// Connection state.
	const [ isConnected, setIsConnected ] = useState( false );
	const [ environment, setEnvironment ] = useState( 'production' );
	const [ connectionLoading, setConnectionLoading ] = useState( true );
	// PayPal partner attribution (BN) code, appended to links we hand out.
	const [ partnerAttributionId, setPartnerAttributionId ] = useState( '' );

	// Set when the merchant asks to reconnect from a block that still holds a
	// button — that block keeps its attributes, so the wizard has to be opened
	// explicitly rather than by the usual "no button yet" path.
	const [ showReconnect, setShowReconnect ] = useState( false );

	/*
	 * The referral link the SDK opens, and the frame it runs in. The link is
	 * fetched before the merchant clicks, so the URL lives in state.
	 */
	const [ signupUrl, setSignupUrl ] = useState( '' );
	const [ isGeneratingSignupLink, setIsGeneratingSignupLink ] = useState( false );
	const [ onboardingRequested, setOnboardingRequested ] = useState( false );
	const [ isSdkReady, setIsSdkReady ] = useState( false );

	// The overlay is PayPal's window. Showing it before the SDK has bound the
	// link puts a blank overlay over the post.
	const isOverlayOpen = onboardingRequested && isSdkReady;

	// Everything between the click and PayPal appearing: fetching the referral,
	// loading the script, waiting for it to bind the link. The button has to say
	// so, or the click looks ignored.
	const isOpeningPayPal = isGeneratingSignupLink || ( onboardingRequested && ! isSdkReady );

	// State, not a ref: the frame mounts and unmounts with the wizard branch, so
	// the effects that use it have to rerun when it changes.
	const [ frameNode, setFrameNode ] = useState( null );
	const onboardingLinkRef = useRef( null );

	// Connect form state.
	const [ clientId, setClientId ] = useState( '' );
	const [ clientSecret, setClientSecret ] = useState( '' );
	const [ connectError, setConnectError ] = useState( null );
	const [ connectErrorDismissed, setConnectErrorDismissed ] = useState( false );
	const [ isConnecting, setIsConnecting ] = useState( false );

	// Partner Referrals onboarding state.
	const [ isCompletingOnboarding, setIsCompletingOnboarding ] = useState( false );

	// Wizard step state: 'welcome' | 'dashboard' | 'credentials' | 'success'
	// Persisted in localStorage so navigating away and back doesn't reset the wizard.
	const [ wizardStep, setWizardStep ] = useState( () => {
		try {
			const saved = window.localStorage.getItem( 'jetpack-paypal-wizard-step' );
			if ( saved && [ 'welcome', 'dashboard', 'credentials', 'success' ].includes( saved ) ) {
				return saved;
			}
		} catch {
			// localStorage unavailable — use default.
		}
		return 'welcome';
	} );
	const [ showSecretField, setShowSecretField ] = useState( false );

	// Persist wizard step changes to localStorage.
	useEffect( () => {
		try {
			if ( wizardStep === 'success' || isConnected ) {
				window.localStorage.removeItem( 'jetpack-paypal-wizard-step' );
			} else {
				window.localStorage.setItem( 'jetpack-paypal-wizard-step', wizardStep );
			}
		} catch {
			// localStorage unavailable — ignore.
		}
	}, [ wizardStep, isConnected ] );

	// Drop any connect error when the user moves between wizard steps — it belongs
	// to the step that produced it.
	useEffect( () => {
		setConnectError( null );
		// Leaving the welcome step withdraws the request, or the overlay opens
		// over whatever step the merchant moved to.
		setOnboardingRequested( false );
	}, [ wizardStep ] );

	// Track whether Partner Referrals (Connect with PayPal button) is available.
	// Requires the site to be on WordPress.com or connected to it.
	const [ partnerReferralsAvailable, setPartnerReferralsAvailable ] = useState( false );

	/**
	 * Check PayPal connection status on mount.
	 */
	useEffect( () => {
		apiFetch( { path: `${ API_BASE }/connection` } )
			.then( response => {
				setIsConnected( response.connected );
				setEnvironment( response.environment );
				setPartnerReferralsAvailable( !! response.partner_referrals_available );
				setPartnerAttributionId( response.partner_attribution_id || '' );
				if ( ! response.connected && ! response.partner_referrals_available ) {
					setWizardStep( 'dashboard' );
				}
			} )
			.catch( () => {
				setIsConnected( false );
			} )
			.finally( () => {
				setConnectionLoading( false );
			} );
	}, [] );

	/**
	 * Follow the site-wide connection state when another block changes it.
	 *
	 * Block attributes are deliberately left alone: the payment links they hold
	 * keep working for buyers after a disconnect, they just can't be edited
	 * until the merchant reconnects.
	 */
	useEffect( () => {
		const handleConnectionChange = event => {
			setIsConnected( !! event.detail?.connected );
			if ( event.detail?.connected ) {
				setShowReconnect( false );
			}
		};

		window.addEventListener( CONNECTION_CHANGED_EVENT, handleConnectionChange );
		return () => window.removeEventListener( CONNECTION_CHANGED_EVENT, handleConnectionChange );
	}, [] );

	/**
	 * Handle Client ID paste — auto-trim whitespace.
	 *
	 * @param {string} value - Pasted or typed value.
	 */
	const handleClientIdChange = useCallback( value => {
		setClientId( value.trim() );
	}, [] );

	/**
	 * Handle Client Secret paste — auto-trim whitespace.
	 *
	 * @param {string} value - Pasted or typed value.
	 */
	const handleClientSecretChange = useCallback( value => {
		setClientSecret( value.trim() );
	}, [] );

	/**
	 * Validate Client ID format.
	 * PayPal Client IDs typically start with 'A' and are ~80 characters.
	 *
	 * @param {string} value - The Client ID.
	 * @return {string|null} Warning message or null.
	 */
	const clientIdWarning = useMemo( () => {
		if ( ! clientId ) {
			return null;
		}
		if ( clientId.length < 20 ) {
			return __(
				'This looks too short for a Client ID. Make sure you copied the full value.',
				'jetpack-paypal-payments'
			);
		}
		if ( ! /^A[A-Za-z0-9_-]+$/.test( clientId ) ) {
			return __(
				'PayPal Client IDs usually start with "A". Double-check you copied the Client ID, not the app name.',
				'jetpack-paypal-payments'
			);
		}
		return null;
	}, [ clientId ] );

	/**
	 * Handle PayPal OAuth connection.
	 */
	const handleConnect = useCallback( () => {
		setConnectError( null );
		setIsConnecting( true );

		apiFetch( {
			path: `${ API_BASE }/connect`,
			method: 'POST',
			data: {
				client_id: clientId,
				client_secret: clientSecret,
				environment,
			},
		} )
			.then( response => {
				setIsConnected( response.connected );
				setEnvironment( response.environment );
				setClientId( '' );
				setClientSecret( '' );
				setShowReconnect( false );
				setWizardStep( 'success' );
				broadcastConnectionChange( response.connected );
			} )
			.catch( err => {
				setConnectError( getUserFriendlyError( err ) );
				setConnectErrorDismissed( false );
			} )
			.finally( () => {
				setIsConnecting( false );
			} );
	}, [ clientId, clientSecret, environment ] );

	/**
	 * Hand PayPal's auth code to the server to exchange for seller credentials.
	 *
	 * Registered under the same name on the top window and on the frame's window,
	 * so both registrations finish onboarding the same way.
	 */
	const completeOnboarding = useCallback( ( authCode, sharedId, merchantIdInPayPal = '' ) => {
		setIsCompletingOnboarding( true );

		apiFetch( {
			path: `${ API_BASE }/onboarding/complete`,
			method: 'POST',
			data: {
				auth_code: authCode,
				shared_id: sharedId,
				// Optional: PayPal reports the merchant ID on the return URL,
				// which this flow never sees. The server falls back to the
				// payer_id that comes back with the credentials.
				merchant_id_in_paypal: merchantIdInPayPal || '',
			},
		} )
			.then( () => {
				setSignupUrl( '' );
				setOnboardingRequested( false );
				setIsConnected( true );
				setShowReconnect( false );
				setWizardStep( 'success' );
				broadcastConnectionChange( true );
			} )
			.catch( err => {
				// The referral has been through PayPal, so it cannot be reopened.
				// Drop it, or the next Connect click reuses a spent link.
				setOnboardingRequested( false );
				setSignupUrl( '' );
				setConnectError( getUserFriendlyError( err ) );
				setConnectErrorDismissed( false );
			} )
			.finally( () => {
				setIsCompletingOnboarding( false );
			} );
	}, [] );

	/**
	 * Expose the completion callback for PayPal's SDK to call by name.
	 */
	useEffect( () => {
		window[ ONBOARD_CALLBACK_NAME ] = ( authCode, sharedId ) =>
			completeOnboarding( authCode, sharedId );

		return () => {
			delete window[ ONBOARD_CALLBACK_NAME ];
		};
	}, [ completeOnboarding ] );

	/**
	 * Fetch the referral link.
	 *
	 * The SDK turns the link itself into its button, so the link has to exist
	 * before the merchant can open anything.
	 */
	const fetchSignupLink = useCallback( () => {
		setConnectError( null );
		setIsGeneratingSignupLink( true );

		apiFetch( {
			path: `${ API_BASE }/onboarding/signup-link`,
			method: 'POST',
			data: {
				return_url: window.location.href,
				environment,
			},
		} )
			.then( response => {
				// `displayMode=minibrowser` is what makes PayPal render the flow in
				// the SDK's lightbox and report the auth code back through the
				// callback, rather than treating this as a plain redirect.
				const url = new URL( response.action_url );
				url.searchParams.set( 'displayMode', 'minibrowser' );
				setSignupUrl( url.toString() );
			} )
			.catch( err => {
				// No referral, so there is nothing left to open.
				setOnboardingRequested( false );
				setConnectError( getUserFriendlyError( err ) );
				setConnectErrorDismissed( false );
			} )
			.finally( () => {
				setIsGeneratingSignupLink( false );
			} );
	}, [ environment ] );

	/**
	 * A different environment needs a different referral link.
	 */
	useEffect( () => {
		setSignupUrl( '' );
		// Withdraw the request as well, or the refetched referral opens PayPal
		// off the toggle rather than off a Connect click.
		setOnboardingRequested( false );
	}, [ environment ] );

	/**
	 * Prepare the referral link as soon as the welcome step is on screen.
	 *
	 * connectError is a bail condition because a failed request clears
	 * isGeneratingSignupLink on the way out, which runs this effect again.
	 * Without it a failing signup-link request repeats forever.
	 */
	useEffect( () => {
		if (
			connectionLoading ||
			isConnected ||
			! partnerReferralsAvailable ||
			wizardStep !== 'welcome' ||
			signupUrl ||
			connectError ||
			isGeneratingSignupLink
		) {
			return;
		}

		fetchSignupLink();
	}, [
		connectionLoading,
		isConnected,
		partnerReferralsAvailable,
		wizardStep,
		signupUrl,
		connectError,
		isGeneratingSignupLink,
		fetchSignupLink,
	] );

	/**
	 * Run PayPal's lightbox in a frame the editor cannot be navigated out of.
	 *
	 * The SDK redirects `window.top` to the return URL once the seller finishes,
	 * which from the editor's own document reloads the editor and loses an
	 * unsaved post. Inside this frame the sandbox denies that navigation, while
	 * the lightbox still paints over the editor at full size.
	 */
	useEffect( () => {
		if ( ! signupUrl ) {
			return;
		}

		const frameDocument = frameNode?.contentDocument;
		const frameWindow = frameNode?.contentWindow;
		if ( ! frameDocument || ! frameWindow ) {
			return;
		}

		let cancelled = false;
		let binding = null;

		frameDocument.open();
		frameDocument.write( ONBOARDING_FRAME_SHELL );
		frameDocument.close();

		// The SDK resolves the callback by name against whichever realm it runs in.
		frameWindow[ ONBOARD_CALLBACK_NAME ] = ( authCode, sharedId ) =>
			completeOnboarding( authCode, sharedId );

		/*
		 * Left visible on purpose: render() skips hidden elements, so a hidden
		 * anchor is never bound as a PayPal button and the click below does
		 * nothing. The lightbox covers it as soon as it opens.
		 */
		const link = frameDocument.createElement( 'a' );
		link.href = signupUrl;
		link.target = 'PPFrame';
		link.textContent = __( 'Continue to PayPal', 'jetpack-paypal-payments' );
		link.setAttribute( 'data-paypal-button', 'true' );
		link.setAttribute( 'data-paypal-onboard-complete', ONBOARD_CALLBACK_NAME );
		frameDocument.getElementById( 'link' ).appendChild( link );
		onboardingLinkRef.current = link;

		loadPartnerScript( environment, frameDocument )
			.then( () => {
				if ( cancelled ) {
					return;
				}

				// The tag can load without the SDK attaching — a proxy serving an
				// error page, a blocked script. The anchor is then an ordinary
				// link and clicking it opens a browser tab.
				const signup = frameWindow.PAYPAL?.apps?.Signup;
				if ( ! signup ) {
					throw new Error( 'PayPal onboarding SDK did not attach.' );
				}

				// partner.js binds the anchors it finds as it runs, so the rescan
				// has to happen after the link is in the document. It does not
				// finish before render() returns, so wait for the anchor itself.
				signup.render();

				binding = waitForAnchorBinding( link, frameWindow );

				return binding.promise;
			} )
			.then( () => {
				if ( cancelled ) {
					return;
				}

				setIsSdkReady( true );
			} )
			.catch( () => {
				if ( cancelled ) {
					return;
				}

				// Drop the referral too: the notice invites a retry, and without
				// this the frame is never rebuilt so the retry does nothing.
				setOnboardingRequested( false );
				setSignupUrl( '' );
				setConnectError(
					__(
						'Could not load PayPal’s onboarding window. Please try again, or enter your API credentials manually.',
						'jetpack-paypal-payments'
					)
				);
				setConnectErrorDismissed( false );
			} );

		return () => {
			cancelled = true;
			binding?.cancel();
			setIsSdkReady( false );
			onboardingLinkRef.current = null;
			delete frameWindow[ ONBOARD_CALLBACK_NAME ];
		};
	}, [ frameNode, signupUrl, environment, completeOnboarding ] );

	/**
	 * Open PayPal, once there is something to open.
	 *
	 * The click and PayPal's script can finish in either order, so the click
	 * handler cannot do this itself: with no referral there is no link, and an
	 * unbound link opens a browser tab. This waits for both.
	 */
	useEffect( () => {
		if ( ! isOverlayOpen ) {
			return;
		}

		onboardingLinkRef.current?.click();
	}, [ isOverlayOpen ] );

	/**
	 * Take the overlay down at the merchant's request.
	 *
	 * PayPal's lightbox has its own close control, but it tells us nothing, so
	 * the overlay needs an exit of ours as well. The referral goes with it, and
	 * clearing it makes the prefetch ask for a new one.
	 */
	const cancelOnboarding = useCallback( () => {
		setOnboardingRequested( false );
		setSignupUrl( '' );
	}, [] );

	/**
	 * Escape closes the overlay.
	 *
	 * Two documents: in a modern theme the canvas is an iframe, keydown does not
	 * cross that boundary, and focus is often on the editor chrome outside it.
	 * Capture phase, and the event stops here, so the editor's own Escape on the
	 * canvas body does not clear the block selection behind the overlay.
	 */
	useEffect( () => {
		if ( ! isOverlayOpen || ! frameNode ) {
			return;
		}

		const handleKeyDown = event => {
			if ( event.key !== 'Escape' ) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			cancelOnboarding();
		};

		const targets = new Set( [ frameNode.ownerDocument, document ] );
		targets.forEach( target => target.addEventListener( 'keydown', handleKeyDown, true ) );

		return () =>
			targets.forEach( target => target.removeEventListener( 'keydown', handleKeyDown, true ) );
	}, [ isOverlayOpen, frameNode, cancelOnboarding ] );

	return {
		isConnected,
		setIsConnected,
		environment,
		setEnvironment,
		connectionLoading,
		partnerAttributionId,
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
	};
}
