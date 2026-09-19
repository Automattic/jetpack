/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — the stacked format's canvas preview.
 *
 * PayPal draws the whole card from one container: product name, price, the
 * PayPal / Venmo / Checkout buttons and the payment-method logo row. So this
 * renders the real SDK and nothing of our own around it.
 *
 * Two things make that awkward in the editor, both measured rather than guessed.
 *
 * The canvas is a `blob:` document, so `location.host` is '' and the SDK's zoid
 * layer cannot work out its own origin. Putting the script in the top document
 * instead does not help either — the SDK resolves its container through the
 * document its own script tag lives in, so it never sees the canvas. The shape
 * that works is a nested iframe pointing at a real same-origin URL, with the
 * script injected into that frame. PHP serves that page from admin-post.php.
 *
 * There is also no teardown API: `HostedButtons()` returns an object whose only
 * own property is `render`. So this boots once per mount and never re-renders in
 * place. A format switch unmounts the component, which is a clean remount.
 *
 * @package
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';

// Hoisted: the production build folds a ternary around __() and fails the i18n
// check. qr-code-preview.jsx carries the same comment for the same reason.
const PENDING_LABEL = __( 'The buttons appear once the post is saved.', 'jetpack-paypal-payments' );

// The design's three-button stack, so the common case does not jump when the SDK
// lands. Measured: PayPal draws 306px at 800px wide, 332px at 289px.
const PENDING_HEIGHT = 306;

/**
 * The stacked buttons, drawn by PayPal's own SDK.
 *
 * @param {object}  props                      - Component props.
 * @param {string}  props.scriptSrc            - The PayPal SDK URL, read back from the payment. Empty until the first save.
 * @param {string}  props.hostedButtonId       - The block's resourceId, which is also the hosted button id.
 * @param {string}  props.partnerAttributionId - PayPal partner attribution (BN) code.
 * @param {boolean} props.isSelected           - Whether the block is selected.
 * @param {boolean} props.showPendingLabel     - Whether to name the pending state for screen readers. Off for a second copy, or it is announced twice.
 * @return {Element} The SDK host frame, or a placeholder until there is something to draw.
 */
export default function StackedButtonsPreview( {
	scriptSrc,
	hostedButtonId,
	partnerAttributionId,
	isSelected,
	showPendingLabel = true,
} ) {
	const frameRef = useRef( null );
	const bootedRef = useRef( false );
	const [ height, setHeight ] = useState( PENDING_HEIGHT );
	const [ interactive, setInteractive ] = useState( false );

	// Nothing to draw until the payment is in BUTTON mode and its snippet has been
	// read back, which happens on the first save.
	const pending = ! scriptSrc || ! hostedButtonId;

	// Re-arm on deselect only. Doing it as the block becomes selected would take
	// the overlay away on mousedown, before the click has landed.
	if ( ! isSelected && interactive ) {
		setInteractive( false );
	}

	useEffect( () => {
		// The editor's JS runs in the TOP realm even though it paints into the
		// canvas, so this resolves against wp-admin rather than the blob:.
		const frame = frameRef.current;
		if ( frame && ! frame.getAttribute( 'src' ) ) {
			// Gutenberg's client-side media processing puts a Document-Isolation-Policy
			// header on the editor screen, and a frame on the other side of that gets
			// its own agent cluster — contentDocument reads as null. Tell PHP which
			// side we are on so the host page can match; it breaks both ways round.
			frame.setAttribute(
				'src',
				window.jetpackPayPalPaymentsSdkHostUrl + ( window.crossOriginIsolated ? '&isolated=1' : '' )
			);
		}
	}, [ pending ] );

	const boot = () => {
		const frame = frameRef.current;
		const win = frame?.contentWindow;
		const doc = frame?.contentDocument;
		// An src-less iframe fires load for about:blank first, and about:blank has
		// no host either — so wait for the real document.
		if ( ! win || ! doc || ! win.location.host || bootedRef.current || pending ) {
			return;
		}
		bootedRef.current = true;

		const container = doc.createElement( 'div' );
		doc.body.appendChild( container );

		// Size the frame from the container, not from body: body carries its own
		// margins, and PayPal posts no card-level height message — the only two
		// messages that carry a height are the button frames reporting their own
		// 42px. A ResizeObserver tracks the late paint (0 → 272 → 306) and reflow.
		if ( win.ResizeObserver ) {
			new win.ResizeObserver( () => setHeight( container.offsetHeight ) ).observe( container );
		}

		const script = doc.createElement( 'script' );
		script.src = scriptSrc;
		script.setAttribute( 'data-namespace', 'paypal_payment_buttons' );
		if ( partnerAttributionId ) {
			script.setAttribute( 'data-paypal-partner-attribution-id', partnerAttributionId );
		}
		script.addEventListener( 'load', () => {
			// The SDK is namespaced, so another PayPal SDK on the page cannot be
			// picked up by mistake — but fall back the way the frontend does.
			( win.paypal_payment_buttons || win.paypal )
				?.HostedButtons( { hostedButtonId } )
				?.render( container );
		} );
		( doc.head || doc.documentElement ).appendChild( script );
	};

	if ( pending ) {
		return (
			<div
				className={ clsx(
					'jetpack-paypal-button-preview',
					'jetpack-paypal-button-preview--stacked',
					'jetpack-paypal-button-preview--stacked-pending'
				) }
				style={ { height: `${ PENDING_HEIGHT }px` } }
				role={ showPendingLabel ? 'img' : undefined }
				aria-label={ showPendingLabel ? PENDING_LABEL : undefined }
			/>
		);
	}

	/* eslint-disable jsx-a11y/no-static-element-interactions -- core's embed
	   overlay has no role either: it only swallows the first click so the block
	   can be selected without the click reaching PayPal. */
	return (
		<div className="jetpack-paypal-button-preview jetpack-paypal-button-preview--stacked">
			<iframe
				ref={ frameRef }
				title={ __( 'PayPal buttons preview', 'jetpack-paypal-payments' ) }
				onLoad={ boot }
				style={ { width: '100%', height: `${ height }px`, border: 0, display: 'block' } }
			/>
			{ /* These are live buttons with a live client-id, so a click in the
			     editor would start a real PayPal checkout. Core's embed overlay,
			     from @wordpress/block-library/src/embed/embed-preview.js: dismiss on
			     onMouseUp (never onClick, and never off isSelected, which fires on
			     mousedown), opacity 0 rather than hidden so it is still hit-tested,
			     and re-armed on deselect. Core ships no z-index and neither does
			     this — the overlay wins on document order alone. */ }
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
