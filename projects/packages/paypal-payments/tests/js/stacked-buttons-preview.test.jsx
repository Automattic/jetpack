/* eslint-disable testing-library/no-node-access */
/**
 * Tests for the stacked buttons preview: the placeholder, the host frame URL, the
 * SDK boot, the frame's height and the click overlay.
 *
 * @package
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import StackedButtonsPreview from '../../src/paypal-payment-buttons/components/stacked-buttons-preview';
import bootTheFrame from './boot-the-frame';

const SDK_HOST_URL = 'https://example.test/wp-admin/admin-post.php?action=jetpack_paypal_sdk_host';
const SCRIPT_SRC = 'https://www.paypal.com/sdk/js?client-id=abc';

// A read of PLB-1, with the SDK URL the REST endpoint builds for it.
const READ = {
	id: 'PLB-1',
	sdk_url:
		'https://www.sandbox.paypal.com/sdk/js?client-id=stored&components=hosted-buttons&enable-funding=venmo&currency=EUR',
};

const ready = {
	attributes: { scriptSrc: SCRIPT_SRC, resourceId: 'PLB-1' },
	isSelected: false,
};

const frame = () => screen.getByTitle( 'PayPal buttons preview' );

// The overlay has no role or label, same as core's embed overlay, so a selector is
// the only way to reach it.
const overlay = () =>
	document.querySelector( '.jetpack-paypal-button-preview__interactive-overlay' );

describe( 'StackedButtonsPreview', () => {
	beforeEach( () => {
		window.jetpackPayPalPayments = { sdkHostUrl: SDK_HOST_URL };
		window.crossOriginIsolated = false;
	} );

	afterEach( () => {
		delete window.jetpackPayPalPayments;
	} );

	it( 'draws the placeholder until the payment has been read back', () => {
		render( <StackedButtonsPreview { ...ready } attributes={ { resourceId: 'PLB-1' } } /> );

		expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
		expect( screen.queryByTitle( 'PayPal buttons preview' ) ).not.toBeInTheDocument();
	} );

	it( 'draws the placeholder for an SDK URL from another host', () => {
		// scriptSrc comes from post content, and the frame is same-origin with wp-admin,
		// so a URL on any other host stops at the placeholder.
		render(
			<StackedButtonsPreview
				{ ...ready }
				attributes={ { scriptSrc: 'https://evil.test/sdk/js?client-id=abc', resourceId: 'PLB-1' } }
			/>
		);

		expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
		expect( screen.queryByTitle( 'PayPal buttons preview' ) ).not.toBeInTheDocument();
	} );

	it( 'points the frame at the host page PHP serves', () => {
		render( <StackedButtonsPreview { ...ready } /> );

		expect( frame() ).toHaveAttribute( 'src', SDK_HOST_URL );
	} );

	// The frame has to match the editor's isolation, or it gets its own agent cluster
	// and the parent loses the document it injects the SDK into.
	it( 'tells the host page to isolate when the editor is isolated', () => {
		window.crossOriginIsolated = true;

		render( <StackedButtonsPreview { ...ready } /> );

		expect( frame() ).toHaveAttribute( 'src', `${ SDK_HOST_URL }&isolated=1` );
	} );

	// Reading it blind would set src to the string "undefined" and fail with nothing
	// in the console.
	it( 'leaves the frame unloaded when the editor script data is missing', () => {
		delete window.jetpackPayPalPayments;

		render( <StackedButtonsPreview { ...ready } /> );

		expect( frame() ).not.toHaveAttribute( 'src' );
	} );

	it( 'covers the live buttons until the block has been clicked once', () => {
		// The buttons run on a live client-id, so a click in the editor would start a
		// real PayPal checkout.
		render( <StackedButtonsPreview { ...ready } /> );

		expect( overlay() ).toBeInTheDocument();
	} );

	it( 'takes the overlay away on mouse up, and puts it back on deselect', () => {
		const { rerender } = render( <StackedButtonsPreview { ...ready } isSelected={ true } /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- user.click() sends mouseDown, mouseUp and click together, so it cannot tell the one the overlay listens for from the ones it must ignore.
		fireEvent.mouseUp( overlay() );
		expect( overlay() ).not.toBeInTheDocument();

		rerender( <StackedButtonsPreview { ...ready } isSelected={ false } /> );
		expect( overlay() ).toBeInTheDocument();
	} );

	// Core's embed overlay dismisses on mouse up alone, and this one follows it.
	it( 'keeps the overlay in place for a bare click', () => {
		render( <StackedButtonsPreview { ...ready } isSelected={ true } /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- a bare click is the whole point; user.click() would send mouseUp too and pass either way.
		fireEvent.click( overlay() );

		expect( overlay() ).toBeInTheDocument();
	} );

	it( 'draws the placeholder before the block has a payment', () => {
		render( <StackedButtonsPreview { ...ready } attributes={ {} } /> );

		expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
		expect( screen.queryByTitle( 'PayPal buttons preview' ) ).not.toBeInTheDocument();
	} );

	it( 'draws the placeholder when only scriptSrc is set', () => {
		render( <StackedButtonsPreview { ...ready } attributes={ { scriptSrc: SCRIPT_SRC } } /> );

		expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
		expect( screen.queryByTitle( 'PayPal buttons preview' ) ).not.toBeInTheDocument();
	} );

	// The published page draws a BUTTON-mode payment without a scriptSrc as a single button.
	it.each( [
		[ 'a read of a different payment', { resourceId: 'PLB-2' } ],
		[ 'a BUTTON-mode payment', { resourceId: 'PLB-1', integrationMode: 'BUTTON' } ],
		// The published page loads a scriptSrc only from PayPal.
		[
			'a scriptSrc from another host',
			{ resourceId: 'PLB-1', scriptSrc: 'https://evil.test/sdk/js?client-id=abc' },
		],
	] )( 'draws the placeholder for %s', ( _label, attributes ) => {
		render( <StackedButtonsPreview { ...ready } attributes={ attributes } resource={ READ } /> );

		expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
		expect( screen.queryByTitle( 'PayPal buttons preview' ) ).not.toBeInTheDocument();
	} );

	describe( 'booting the SDK into the frame', () => {
		it( 'injects the namespaced SDK script and a container for it', () => {
			render( <StackedButtonsPreview { ...ready } partnerAttributionId="BN123" /> );

			const { doc } = bootTheFrame();

			// The frame's document has no browsing context of its own, so jest-dom's
			// element matchers reject what comes out of it.
			const script = doc.querySelector( 'script' );
			expect( script.src ).toBe( SCRIPT_SRC );
			// Namespaced so the preview draws through its own SDK and no other.
			expect( script.dataset.namespace ).toBe( 'paypal_payment_buttons' );
			expect( script.dataset.paypalPartnerAttributionId ).toBe( 'BN123' );
			expect( doc.body.firstChild.tagName ).toBe( 'DIV' );
		} );

		// Stored, this reads as a PayPal host. Injected as it stands, the frame's own page
		// would resolve it back to the site, so the rebuilt URL goes in instead.
		it( 'injects the sanitized URL rather than the stored one', () => {
			render(
				<StackedButtonsPreview
					{ ...ready }
					attributes={ {
						scriptSrc: 'https:www.paypal.com/../../wp-content/uploads/x.txt',
						resourceId: 'PLB-1',
					} }
				/>
			);

			const { doc } = bootTheFrame( 'https://site.test/wp-admin/admin-post.php' );

			expect( doc.querySelector( 'script' ).src ).toBe(
				'https://www.paypal.com/wp-content/uploads/x.txt'
			);
		} );

		// A LINK-mode payment gets a scriptSrc when a save switches it to BUTTON.
		it( 'boots a LINK-mode payment from the read URL', () => {
			render(
				<StackedButtonsPreview
					{ ...ready }
					attributes={ { resourceId: 'PLB-1', integrationMode: 'LINK' } }
					resource={ READ }
				/>
			);

			const { doc } = bootTheFrame();

			expect( doc.querySelector( 'script' ).src ).toBe( READ.sdk_url );
		} );

		// The published page loads scriptSrc, so the preview does too.
		it( 'boots from scriptSrc ahead of the read URL', () => {
			render( <StackedButtonsPreview { ...ready } resource={ READ } /> );

			const { doc } = bootTheFrame();

			expect( doc.querySelector( 'script' ).src ).toBe( SCRIPT_SRC );
		} );

		// The document's scrollHeight is floored at the viewport, so measuring it would
		// only ever let the frame grow.
		it( 'sizes the frame from the container rather than the document', () => {
			render( <StackedButtonsPreview { ...ready } /> );

			const { doc, observed } = bootTheFrame();

			const container = doc.body.firstChild;
			expect( observed ).toHaveLength( 1 );
			expect( observed[ 0 ].node ).toBe( container );

			Object.defineProperty( container, 'offsetHeight', { value: 412, configurable: true } );
			act( () => observed[ 0 ].resize() );

			expect( frame() ).toHaveStyle( { height: '412px' } );
		} );

		// The container exists before PayPal paints into it, so the first observation
		// measures an empty box, and writing that through collapses the block to zero.
		it( 'keeps the placeholder height through an empty measurement', () => {
			render( <StackedButtonsPreview { ...ready } /> );

			const { doc, observed } = bootTheFrame();
			const container = doc.body.firstChild;

			Object.defineProperty( container, 'offsetHeight', { value: 0, configurable: true } );
			act( () => observed[ 0 ].resize() );
			expect( frame() ).toHaveStyle( { height: '306px' } );

			// And still takes the card's own height once PayPal has drawn it.
			Object.defineProperty( container, 'offsetHeight', { value: 271, configurable: true } );
			act( () => observed[ 0 ].resize() );
			expect( frame() ).toHaveStyle( { height: '271px' } );
		} );

		// The frontend falls back to the plain namespace the same way.
		it.each( [ 'paypal_payment_buttons', 'paypal' ] )(
			'draws the payment through window.%s once the SDK loads',
			namespace => {
				render( <StackedButtonsPreview { ...ready } /> );

				const { doc, win } = bootTheFrame();
				const drawInto = jest.fn();
				win[ namespace ] = { HostedButtons: jest.fn( () => ( { render: drawInto } ) ) };

				// boot() listens with addEventListener, and fireEvent wants a window the
				// frame's document lacks.
				doc.querySelector( 'script' ).dispatchEvent( new Event( 'load' ) );

				expect( win[ namespace ].HostedButtons ).toHaveBeenCalledWith( {
					hostedButtonId: 'PLB-1',
				} );
				expect( drawInto ).toHaveBeenCalledWith( doc.body.firstChild );
			}
		);

		// HostedButtons() has no teardown, so a second load has to be ignored.
		it( 'boots once per mount', () => {
			render( <StackedButtonsPreview { ...ready } /> );

			const { doc } = bootTheFrame();
			fireEvent.load( frame() );

			expect( doc.querySelectorAll( 'script' ) ).toHaveLength( 1 );
			expect( doc.body.children ).toHaveLength( 1 );
		} );
	} );
} );
