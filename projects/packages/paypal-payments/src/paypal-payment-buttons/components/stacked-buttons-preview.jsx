/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — the stacked format's canvas preview.
 *
 * PayPal draws the whole card — name, price, buttons, logo row — from its own SDK.
 *
 * The canvas is a `blob:` document, where the SDK cannot work out its own origin, so
 * the SDK runs inside a nested iframe on a real same-origin URL that PHP serves from
 * admin-post.php.
 *
 * `HostedButtons()` has no teardown, so this boots once per mount; a format switch
 * unmounts and remounts it.
 *
 * @package
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { sanitizePayPalUrl } from '../utils/validation';

// Hoisted: the production build folds a ternary around __() and fails the i18n check.
const PENDING_LABEL = __( 'The buttons appear once the post is saved.', 'jetpack-paypal-payments' );

// Height of the usual three-button stack, so the preview stays put while the SDK loads.
const PENDING_HEIGHT = 306;

/**
 * The SDK URL the stacked preview boots from.
 *
 * The block's scriptSrc comes first, since the published page loads it. A payment gets a
 * scriptSrc in BUTTON mode, which a payment switched to stacked turns on at its next save,
 * so until then the preview uses the sdk_url from the block's read.
 * A BUTTON-mode payment uses scriptSrc alone: an empty one means the account lacks
 * stacked, and the published page shows a single button.
 *
 * @param {object} attributes - Block attributes.
 * @param {object} resource   - The payment from the block's last read, if any.
 * @return {string} The URL, or ''.
 */
export function getStackedSdkSrc( attributes = {}, resource ) {
	const { scriptSrc, integrationMode, resourceId } = attributes;
	const readSdkUrl =
		'BUTTON' !== integrationMode && resourceId && resource?.id === resourceId
			? resource.sdk_url
			: '';

	// scriptSrc comes straight from post content, and the frame is same-origin with
	// wp-admin, so only a PayPal URL is allowed through as a script src.
	return sanitizePayPalUrl( scriptSrc || readSdkUrl );
}

/**
 * The stacked buttons, drawn by PayPal's own SDK.
 *
 * @param {object}  props                      - Component props.
 * @param {object}  props.attributes           - Block attributes.
 * @param {object}  props.resource             - The payment from the block's last read, if any.
 * @param {string}  props.partnerAttributionId - PayPal partner attribution (BN) code.
 * @param {boolean} props.isSelected           - Whether the block is selected.
 * @return {Element} The SDK host frame, or a pending state until there is something to draw.
 */
export default function StackedButtonsPreview( {
	attributes = {},
	resource,
	partnerAttributionId,
	isSelected,
} ) {
	const { resourceId: hostedButtonId } = attributes;
	const frameRef = useRef( null );
	const bootedRef = useRef( false );
	const [ height, setHeight ] = useState( PENDING_HEIGHT );
	const [ interactive, setInteractive ] = useState( false );

	const sdkSrc = getStackedSdkSrc( attributes, resource );

	// A new block gets its payment on the first save, and its SDK URL once it reads the payment.
	const pending = ! sdkSrc || ! hostedButtonId;

	// Restore the overlay on deselect. Doing it on select would remove it at mousedown,
	// while the click is still in flight.
	useEffect( () => {
		if ( ! isSelected ) {
			setInteractive( false );
		}
	}, [ isSelected ] );

	// Once per mount: PayPalButtonPreview remounts this on a new SDK URL, payment or card revision.
	useEffect( () => {
		const frame = frameRef.current;
		const hostUrl = window.jetpackPayPalPayments?.sdkHostUrl;

		// Without the host URL from the editor script data there is nothing to draw, and
		// src would be set to the string "undefined" and fail quietly.
		if ( ! frame || ! hostUrl || frame.getAttribute( 'src' ) ) {
			return;
		}

		// Gutenberg's client-side media processing sets a Document-Isolation-Policy header on
		// the editor screen. A frame whose isolation differs from its parent's gets its own
		// agent cluster and contentDocument reads as null, either way round, so tell PHP which
		// side to match. Read it from the realm that owns the frame — that is the one whose
		// cluster has to match.
		const isolated = frame.ownerDocument.defaultView.crossOriginIsolated;

		frame.setAttribute( 'src', hostUrl + ( isolated ? '&isolated=1' : '' ) );
	}, [] );

	const boot = () => {
		const frame = frameRef.current;
		const win = frame?.contentWindow;
		const doc = frame?.contentDocument;
		// An iframe with no src fires load for about:blank first, which has no host
		// either, so wait for the real document.
		if ( ! win || ! doc || ! win.location.host || bootedRef.current ) {
			return;
		}
		bootedRef.current = true;

		// render_sdk_host() gives this div flow-root, so PayPal's card margins stay
		// inside what gets measured.
		const container = doc.createElement( 'div' );
		doc.body.appendChild( container );

		// Measure the container: PayPal sends a height only for the individual button frames,
		// and the document's scrollHeight has a viewport floor, so the frame would only grow.
		if ( win.ResizeObserver ) {
			new win.ResizeObserver( () => {
				// The first observation comes in before PayPal has painted, and a background tab
				// puts that off further. A 0 there means nothing is drawn yet, so keep the
				// height already on screen until the card shows up.
				const measured = container.offsetHeight;
				if ( measured > 0 ) {
					setHeight( measured );
				}
			} ).observe( container );
		}

		const script = doc.createElement( 'script' );
		script.src = sdkSrc;
		script.setAttribute( 'data-namespace', 'paypal_payment_buttons' );
		if ( partnerAttributionId ) {
			script.setAttribute( 'data-paypal-partner-attribution-id', partnerAttributionId );
		}
		script.addEventListener( 'load', () => {
			// Namespaced so another PayPal SDK on the page stays separate, with the same
			// fallback the frontend uses.
			( win.paypal_payment_buttons || win.paypal )
				?.HostedButtons( { hostedButtonId } )
				?.render( container );
		} );
		( doc.head || doc.documentElement ).appendChild( script );
	};

	if ( pending ) {
		return (
			<div
				className="jetpack-paypal-button-preview jetpack-paypal-button-preview--stacked jetpack-paypal-button-preview--stacked-pending"
				style={ { height: `${ PENDING_HEIGHT }px` } }
				role="img"
				aria-label={ PENDING_LABEL }
			/>
		);
	}

	/* eslint-disable jsx-a11y/no-static-element-interactions -- core's embed overlay has
	   no role either: it takes the first click so the block can be selected instead of
	   PayPal receiving it. */
	return (
		<div className="jetpack-paypal-button-preview jetpack-paypal-button-preview--stacked">
			<iframe
				ref={ frameRef }
				title={ __( 'PayPal buttons preview', 'jetpack-paypal-payments' ) }
				onLoad={ boot }
				style={ { height: `${ height }px` } }
			/>
			{ /* Live buttons with a live client-id, so a click in the editor would start a
			     real PayPal checkout. Like core's embed overlay, dismiss on onMouseUp, not
			     onClick, and not on isSelected, which flips at mousedown. */ }
			{ ! interactive && (
				<div
					className="jetpack-paypal-button-preview__interactive-overlay"
					onMouseUp={ () => setInteractive( true ) }
				/>
			) }
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}
