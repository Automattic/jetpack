/* eslint-disable react/jsx-no-bind */
/**
 * Tests for the PayPal Payment Buttons V2 edit component.
 *
 * Tests the API-driven block editor UI including connection checking,
 * connection form, product creation form, and preview states.
 *
 * @package
 */

import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	validateVariants,
	VARIANT_ERROR_FIELDS,
} from '../../../src/paypal-payment-buttons/components/variant-builder';
import Edit from '../../../src/paypal-payment-buttons/edit';
import {
	ADVISORY_ERROR_KEYS,
	getValidationErrors,
} from '../../../src/paypal-payment-buttons/utils/validation';
// apiFetch mock — controls what the component receives from the REST API.
const apiFetch = require( '@wordpress/api-fetch' );
// Used by the ToggleControl mock below to id each toggle.
const mockReact = require( 'react' );

// The API-managed editor only renders while the feature flag is on.
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: () => true,
} ) );

// The paste-code editor has its own suite; keep its imports out of this one.
jest.mock( '../../../src/paypal-payment-buttons/edit-paste-code', () => () => null );

// Mock WordPress element with real React hooks.
jest.mock( '@wordpress/element', () => {
	const React = require( 'react' );
	return {
		createElement: React.createElement,
		Fragment: React.Fragment,
		useState: React.useState,
		useEffect: React.useEffect,
		useCallback: React.useCallback,
		useMemo: React.useMemo,
		useRef: React.useRef,
		createInterpolateElement: text => text,
	};
} );

// Mock WordPress i18n.
jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	_x: text => text,
	sprintf: ( format, ...args ) => {
		let i = 0;
		return format.replace( /%[ds]/g, () => args[ i++ ] );
	},
} ) );

const mockMarkNotPersistent = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { __unstableMarkNextChangeAsNotPersistent: mockMarkNotPersistent } ),
} ) );

// What the media library hands back. jsdom has none, so the MediaUpload mock
// passes this to onSelect.
const mockSelectedMedia = { url: 'https://example.com/chosen.png', id: 42 };

// Mock WordPress block-editor.
jest.mock( '@wordpress/block-editor', () => ( {
	store: { name: 'core/block-editor' },
	useBlockProps: () => ( { className: 'wp-block-paypal-payment-buttons' } ),
	BlockControls: ( { children } ) => <div data-testid="block-controls">{ children }</div>,
	InspectorControls: ( { children } ) => <div data-testid="inspector-controls">{ children }</div>,
	// open() calls onSelect straight away so the block's handler runs.
	MediaUpload: ( { onSelect, render: renderProp } ) =>
		renderProp( { open: () => onSelect( mockSelectedMedia ) } ),
	MediaUploadCheck: ( { children } ) => <>{ children }</>,
	// Like TextControl, className and help sit on the BaseControl wrapper rather than
	// the input. URLInput has no onBlur - the form catches that on a wrapper of its
	// own. The testid deliberately differs from `control-` so a test can tell this
	// apart from the TextControl it replaced.
	URLInput: ( { label, value, onChange, help, className, ...rest } ) => (
		<div data-testid={ `url-input-${ label }` } className={ className }>
			<label htmlFor={ `field-${ label }` }>{ label }</label>
			<input
				id={ `field-${ label }` }
				aria-label={ label }
				value={ value || '' }
				onChange={ e => onChange( e.target.value ) }
				type="text"
				{ ...rest }
			/>
			{ help && <span className="help-text">{ help }</span> }
		</div>
	),
} ) );

// Mock WordPress components with simple HTML equivalents.
jest.mock( '@wordpress/components', () => ( {
	BaseControl: {
		VisualLabel: ( { children } ) => (
			<span className="components-base-control__label">{ children }</span>
		),
	},
	Button: ( { children, onClick, disabled, variant, isBusy, ...rest } ) => (
		<button
			onClick={ onClick }
			disabled={ disabled }
			data-variant={ variant }
			data-busy={ isBusy }
			{ ...rest }
		>
			{ children }
		</button>
	),
	ButtonGroup: ( { children } ) => <div data-testid="button-group">{ children }</div>,
	__experimentalConfirmDialog: ( { children, title, confirmButtonText, onConfirm, onCancel } ) => (
		<div data-testid="confirm-dialog" role="dialog" aria-label={ title }>
			<div>{ children }</div>
			<button data-testid="confirm-dialog-confirm" onClick={ onConfirm }>
				{ confirmButtonText || 'OK' }
			</button>
			<button data-testid="confirm-dialog-cancel" onClick={ onCancel }>
				Cancel
			</button>
		</div>
	),
	Notice: ( { children, status, isDismissible, onDismiss, actions } ) => (
		<div data-testid="notice" data-status={ status }>
			{ children }
			{ actions?.map( action => (
				<button key={ action.label } onClick={ action.onClick }>
					{ action.label }
				</button>
			) ) }
			{ isDismissible && onDismiss && (
				<button data-testid="dismiss-notice" onClick={ onDismiss }>
					Dismiss
				</button>
			) }
		</div>
	),
	// The real PanelBody renders nothing when closed, so initialOpen decides whether an
	// error inside it is on screen at all. The mock always renders, and exposes the prop.
	PanelBody: ( { children, title, initialOpen } ) => (
		<div data-testid="panel-body" data-title={ title } data-initial-open={ !! initialOpen }>
			{ children }
		</div>
	),
	// Like TextControl, the real SelectControl hands className and help to the
	// BaseControl wrapper rather than the <select>.
	SelectControl: ( { label, value, options, onChange, help, className } ) => (
		<div data-testid={ `control-${ label }` } className={ className }>
			<select aria-label={ label } value={ value } onChange={ e => onChange( e.target.value ) }>
				{ options &&
					options.map( opt => (
						<option key={ opt.value } value={ opt.value }>
							{ opt.label }
						</option>
					) ) }
			</select>
			{ help && <span className="help-text">{ help }</span> }
		</div>
	),
	Spinner: () => <div data-testid="spinner">Loading...</div>,
	CheckboxControl: ( { label, checked, onChange, help, disabled } ) => {
		const id = `checkbox-${ label }`;
		return (
			<div>
				<input
					id={ id }
					type="checkbox"
					checked={ checked }
					onChange={ () => onChange( ! checked ) }
					disabled={ disabled }
				/>
				<label htmlFor={ id }>{ label }</label>
				{ help && <span>{ help }</span> }
			</div>
		);
	},
	// One id per instance, the way the real control ids itself. Custom checkout
	// fields repeat the same 'Required' label, and a shared id would point every
	// one of those labels at the first field's input.
	ToggleControl: ( { label, checked, onChange, help, disabled } ) => {
		const id = `toggle-${ mockReact.useId() }`;
		return (
			<div>
				<input
					id={ id }
					type="checkbox"
					checked={ checked }
					onChange={ () => onChange( ! checked ) }
					disabled={ disabled }
				/>
				<label htmlFor={ id }>{ label }</label>
				{ help && <span>{ help }</span> }
			</div>
		);
	},
	// Real TextControl puts className and help on the BaseControl wrapper, not the input,
	// which is what editor.scss's `.jetpack-paypal-payment-buttons__has-error .components-text-control__input` expects.
	TextControl: ( { label, value, onChange, onBlur, type, help, className, ...rest } ) => (
		<div data-testid={ `control-${ label }` } className={ className }>
			<label htmlFor={ `field-${ label }` }>{ label }</label>
			<input
				id={ `field-${ label }` }
				aria-label={ label }
				value={ value || '' }
				onChange={ e => onChange( e.target.value ) }
				onBlur={ onBlur }
				type={ type || 'text' }
				{ ...rest }
			/>
			{ help && <span className="help-text">{ help }</span> }
		</div>
	),
	TextareaControl: ( { label, value, onChange, onBlur, help, className } ) => (
		<div data-testid={ `control-${ label }` } className={ className }>
			<label htmlFor={ `field-${ label }` }>{ label }</label>
			<textarea
				id={ `field-${ label }` }
				aria-label={ label }
				value={ value || '' }
				onChange={ e => onChange( e.target.value ) }
				onBlur={ onBlur }
			/>
			{ help && <span className="help-text">{ help }</span> }
		</div>
	),
	ToolbarButton: ( { label, onClick, isPressed } ) => (
		<button data-testid={ `toolbar-${ label }` } onClick={ onClick } data-pressed={ isPressed }>
			{ label }
		</button>
	),
	ToolbarGroup: ( { children } ) => <div data-testid="toolbar-group">{ children }</div>,
} ) );

// Mock PayPal button preview component.
jest.mock( '../../../src/paypal-payment-buttons/components/paypal-button-preview', () => {
	return function MockPayPalButtonPreview( props ) {
		return (
			<div data-testid="paypal-button-preview" data-product-name={ props.productName }>
				Preview: { props.productName } - { props.price } { props.currencyCode }
			</div>
		);
	};
} );

describe( 'PayPalPaymentButtonsEdit (V2)', () => {
	const setAttributes = jest.fn();

	/**
	 * An inspector panel by title. The mock renders closed panels too, so read
	 * initialOpen off it rather than trusting that an error inside is visible.
	 *
	 * @param {string} title - The panel's title.
	 * @return {Element} The panel element.
	 */
	const panel = title =>
		screen
			.getAllByTestId( 'panel-body' )
			.find( body => body.getAttribute( 'data-title' ) === title );

	/**
	 * The control a message has to appear inside for the fix to mean anything.
	 *
	 * @param {string} label - The control's label.
	 * @return {object} Queries scoped to that control.
	 */
	const control = label => within( screen.getByTestId( `control-${ label }` ) );

	/**
	 * Focus a control and leave it, which is what marks the field touched.
	 *
	 * @param {object} user  - userEvent instance.
	 * @param {object} field - The control to visit.
	 */
	const visit = async ( user, field ) => {
		await user.click( field );
		await user.tab();
	};

	/**
	 * Render the form for a product that is ready to save, overridden as needed.
	 *
	 * @param {object} attributes - Attributes to set on top of that product.
	 * @return {object} Testing Library render result.
	 */
	const renderForm = attributes =>
		render(
			<Edit
				attributes={ {
					productName: 'Test Widget',
					price: '29.99',
					currencyCode: 'USD',
					...attributes,
				} }
				setAttributes={ setAttributes }
			/>
		);

	/**
	 * Open the block's edit form and press Save.
	 *
	 * @param {object} user - The userEvent instance driving the clicks.
	 */
	async function saveFromEditForm( user ) {
		await expect( screen.findByTestId( 'toolbar-Edit' ) ).resolves.toBeInTheDocument();
		await user.click( screen.getByTestId( 'toolbar-Edit' ) );
		await user.click( screen.getByText( 'Save' ) );
	}

	beforeEach( () => {
		jest.clearAllMocks();
		// Clear persisted wizard step to ensure tests start from 'welcome'.
		window.localStorage.removeItem( 'jetpack-paypal-wizard-step' );
		// Default: connection check returns not connected.
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( { connected: false, environment: 'sandbox' } );
	} );

	describe( 'Loading State', () => {
		it( 'shows a spinner while checking connection', () => {
			// Make apiFetch hang (never resolve) to keep loading state.
			apiFetch.mockReturnValue( new Promise( () => {} ) );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();
			expect( screen.getByText( /Checking PayPal connection/ ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Connection Form (not connected)', () => {
		/**
		 * Navigate the connection wizard to the manual credentials step.
		 *
		 * The welcome step leads with the Partner Referrals "Connect with
		 * PayPal" flow (WOOPTP-267), but it only renders when the connection
		 * response reports partner_referrals_available. The default mock does
		 * not, which is standalone mode — the component skips welcome and
		 * opens on the dashboard step, leaving one click to credentials.
		 *
		 * @param {object} user - userEvent instance.
		 */
		async function navigateToCredentialsStep( user ) {
			// Present only in platform mode; click it when the welcome step rendered.
			const manualLink = screen.queryByRole( 'button', {
				name: /enter your API credentials manually/i,
			} );
			if ( manualLink ) {
				await user.click( manualLink );
			}
			await user.click( await screen.findByRole( 'button', { name: /I have my credentials/i } ) );
		}

		it( 'shows the connection form when PayPal is not connected', async () => {
			const user = userEvent.setup();
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await navigateToCredentialsStep( user );

			expect( screen.getByLabelText( 'Client ID' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( 'Client Secret' ) ).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: /Use Sandbox for testing|Switch to Production/i } )
			).toBeInTheDocument();
		} );

		it( 'disables connect button when credentials are empty', async () => {
			const user = userEvent.setup();
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await navigateToCredentialsStep( user );

			expect( screen.getByRole( 'button', { name: /^Connect$/i } ) ).toBeDisabled();
		} );
	} );

	describe( 'Connect with PayPal (Partner Referrals)', () => {
		/**
		 * Reply to the connection check with platform mode, so the welcome step
		 * with the "Connect with PayPal" flow renders.
		 *
		 * @param {object} signupResponse - What the signup-link route returns, or { reject } to fail it.
		 */
		function mockPlatformMode( signupResponse ) {
			apiFetch.mockImplementation( ( { path } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( {
						connected: false,
						environment: 'sandbox',
						partner_referrals_available: true,
					} );
				}
				if ( path.endsWith( '/onboarding/signup-link' ) ) {
					return signupResponse?.reject
						? Promise.reject( signupResponse.reject )
						: Promise.resolve( signupResponse );
				}
				return Promise.resolve( {} );
			} );
		}

		/**
		 * Get onto the welcome step and open the onboarding frame.
		 *
		 * @return {Promise<HTMLIFrameElement>} The frame PayPal's SDK runs in.
		 */
		async function openOnboardingFrame() {
			const user = userEvent.setup();
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await user.click( await screen.findByRole( 'button', { name: /Connect with PayPal/i } ) );
			return screen.findByTitle( 'PayPal onboarding' );
		}

		/**
		 * The connect anchor, once the effect has written it into the frame.
		 *
		 * @param {HTMLIFrameElement} frame - The frame PayPal's SDK runs in.
		 * @return {Promise<HTMLAnchorElement>} PayPal's connect anchor.
		 */
		async function findConnectLink( frame ) {
			// The link is built for PayPal's SDK inside another document, so the
			// query has to be scoped to that document rather than the screen.
			return within( frame.contentDocument.body ).findByRole( 'link', {
				name: 'Continue to PayPal',
			} );
		}

		/**
		 * Fire partner.js's load event, with the SDK attached the way it attaches.
		 *
		 * jsdom never fetches the tag, so its load event has to be fired by hand.
		 *
		 * @param {HTMLIFrameElement} frame          - The frame PayPal's SDK runs in.
		 * @param {object}            options        - Options.
		 * @param {string}            options.result - 'load' or 'error'.
		 * @param {boolean}           options.sdk    - Whether the SDK attaches.
		 * @param {boolean}           options.binds  - Whether it binds the anchor.
		 * @param {boolean}           options.sync   - Bind during render() rather than after it.
		 * @return {Promise<jest.Mock>} The SDK's render(), which binds the anchor.
		 */
		async function settlePartnerScript(
			frame,
			{ result = 'load', sdk = true, binds = true, sync = false } = {}
		) {
			/* eslint-disable testing-library/no-node-access -- The tag is injected
			   into the frame's document, out of reach of screen queries. */
			await waitFor( () =>
				expect(
					frame.contentDocument.querySelector( 'script[data-paypal-partner-js]' )
				).not.toBeNull()
			);
			const script = frame.contentDocument.querySelector( 'script[data-paypal-partner-js]' );
			/* eslint-enable testing-library/no-node-access */

			// PayPal marks an anchor bound by taking its target away, and it does
			// that after render() has already returned.
			const renderSpy = jest.fn( () => {
				if ( ! binds ) {
					return;
				}
				if ( sync ) {
					/* eslint-disable testing-library/no-node-access -- The anchor is
					   in the frame's document, out of reach of screen queries, and
					   this branch has to be synchronous. */
					frame.contentDocument
						.querySelector( 'a[data-paypal-button]' )
						.removeAttribute( 'target' );
					/* eslint-enable testing-library/no-node-access */
					return;
				}
				within( frame.contentDocument.body )
					.findByRole( 'link', { name: 'Continue to PayPal' } )
					.then( link => link.removeAttribute( 'target' ) );
			} );

			if ( sdk ) {
				frame.contentWindow.PAYPAL = { apps: { Signup: { render: renderSpy } } };
			} else {
				delete frame.contentWindow.PAYPAL;
			}

			await act( async () => {
				script.dispatchEvent( new Event( result ) );
			} );

			// Only the load-with-SDK path calls render(), so it is the only one
			// where the target comes off.
			if ( binds && sdk && 'load' === result ) {
				/* eslint-disable testing-library/no-node-access -- The anchor is in
				   the frame's document, out of reach of screen queries. */
				await waitFor( () =>
					expect(
						frame.contentDocument.querySelector( 'a[data-paypal-button]' )
					).not.toHaveAttribute( 'target' )
				);
				/* eslint-enable testing-library/no-node-access */
			}

			return renderSpy;
		}

		/**
		 * Open the overlay, and check it opened.
		 *
		 * A closed-overlay assertion means nothing unless the overlay was open
		 * first, so this checks it was down, then up. Waiting for the referral
		 * first takes the cached branch every time; 'buys the referral on a click
		 * that has none' covers the other one.
		 *
		 * @return {Promise<HTMLIFrameElement>} The frame, with the overlay up.
		 */
		async function openActiveOverlay() {
			const user = userEvent.setup();
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await settlePartnerScript( frame );
			const click = jest.spyOn( await findConnectLink( frame ), 'click' );

			expect( frame ).not.toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			// The class is the overlay's chrome; the click is what opens PayPal
			// inside it, which is the half a merchant would notice missing.
			expect( frame ).toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
			expect( click ).toHaveBeenCalled();

			return frame;
		}

		/**
		 * Watch every click on the connect anchor, from before it exists.
		 *
		 * The effect builds a new anchor every time the frame remounts, so a spy
		 * taken off one anchor stops seeing clicks after the next remount.
		 * Patching the frame realm's prototype through the contentWindow getter
		 * covers every anchor the effect builds, in every frame.
		 *
		 * Watches link.click(), which is how the source clicks it, rather than a
		 * dispatched MouseEvent.
		 *
		 * @return {jest.Mock} Called whenever the connect anchor is clicked.
		 */
		function watchAnchorClicks() {
			const click = jest.fn();
			const realGetter = Object.getOwnPropertyDescriptor(
				window.HTMLIFrameElement.prototype,
				'contentWindow'
			).get;

			jest
				.spyOn( window.HTMLIFrameElement.prototype, 'contentWindow', 'get' )
				.mockImplementation( function () {
					const frameWindow = realGetter.call( this );
					if ( frameWindow ) {
						frameWindow.HTMLAnchorElement.prototype.click = click;
					}
					return frameWindow;
				} );

			return click;
		}

		/**
		 * Every signup-link request the block has sent.
		 *
		 * @return {Array} The matching apiFetch calls.
		 */
		function signupLinkCalls() {
			return apiFetch.mock.calls.filter( ( [ { path } ] ) =>
				path.endsWith( '/onboarding/signup-link' )
			);
		}

		const keyListeners = [];

		/**
		 * Watch keydown for the length of one test.
		 *
		 * Torn down by afterEach rather than inline, so a failed assertion cannot
		 * leave a listener behind for every test after it.
		 *
		 * @param {Node}     target  - What to listen on.
		 * @param {Function} handler - The listener.
		 * @param {boolean}  capture - Capture phase.
		 */
		function watchKeys( target, handler, capture = false ) {
			target.addEventListener( 'keydown', handler, capture );
			keyListeners.push( [ target, handler, capture ] );
		}

		afterEach( () => {
			// clearAllMocks does not undo a spy, so one failure before a manual
			// restore would leave window.open stubbed, or the contentWindow getter
			// patched, for every later test.
			jest.restoreAllMocks();
			delete window.PAYPAL;
			delete window.jetpackPayPalOnboardComplete;
			keyListeners
				.splice( 0 )
				.forEach( ( [ target, handler, capture ] ) =>
					target.removeEventListener( 'keydown', handler, capture )
				);
		} );

		it( 'denies the onboarding frame the top navigation that would reload the editor', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			const frame = await openOnboardingFrame();

			/*
			 * The whole set, not a subset: sandbox tokens overlap as substrings,
			 * so a looser check lets a real permission through —
			 * 'allow-top-navigation-by-user-activation' permits the redirect this
			 * test blocks. PayPal's SDK sends window.top to the return URL when
			 * the seller finishes, which would take the editor and the unsaved
			 * post with it.
			 */
			const grants = [
				...new Set(
					( frame.getAttribute( 'sandbox' ) || '' ).toLowerCase().split( /\s+/ ).filter( Boolean )
				),
			].sort();

			expect( grants ).toEqual(
				[
					// The effect writes the frame document.
					'allow-same-origin',
					// The SDK's lightbox opens in a named window.
					'allow-popups',
					'allow-popups-to-escape-sandbox',
					'allow-forms',
					'allow-scripts',
				].sort()
			);
		} );

		it( 'renders PayPal’s onboarding link in minibrowser mode', async () => {
			mockPlatformMode( {
				action_url:
					'https://www.sandbox.paypal.com/merchantsignup/partner/onboardingentry?token=abc',
			} );

			const frame = await openOnboardingFrame();

			/* eslint-disable testing-library/no-node-access -- The link is built
			   for PayPal's SDK inside another document, which Testing Library's
			   screen queries cannot reach. */
			await waitFor( () =>
				expect( frame.contentDocument.querySelector( 'a[data-paypal-button]' ) ).not.toBeNull()
			);
			const link = frame.contentDocument.querySelector( 'a[data-paypal-button]' );
			/* eslint-enable testing-library/no-node-access */

			/*
			 * PayPal hands over the auth code only through the SDK's callback,
			 * and only when the link opts into the minibrowser display mode.
			 * Both are what make onboarding completable at all.
			 */
			expect( link ).toHaveAttribute(
				'data-paypal-onboard-complete',
				'jetpackPayPalOnboardComplete'
			);
			// Values, not substrings: displayMode=minibrowserANYTHING contains the
			// string and means nothing to PayPal.
			const href = new URL( link.href );

			expect( href.searchParams.get( 'displayMode' ) ).toBe( 'minibrowser' );
			expect( href.searchParams.get( 'token' ) ).toBe( 'abc' );
		} );

		it( 'leaves the connect link visible so the SDK will bind it', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			const frame = await openOnboardingFrame();

			const link = await findConnectLink( frame );

			// render() skips hidden elements, so a hidden anchor is never bound as
			// a PayPal button and the click that opens the lightbox does nothing.
			// display does not inherit, so the anchor alone is not enough to look
			// at — a container set to none hides it while it still computes inline.
			expect( link.hidden ).toBe( false );
			expect( frame.contentWindow.getComputedStyle( link ).visibility ).not.toBe( 'hidden' );

			/* eslint-disable testing-library/no-node-access -- walking the anchor's
			   ancestors is the point; screen queries cannot reach that document. */
			for ( let node = link; node; node = node.parentElement ) {
				expect( frame.contentWindow.getComputedStyle( node ).display ).not.toBe( 'none' );
			}
			/* eslint-enable testing-library/no-node-access */
		} );

		it( 'loads the SDK into the onboarding frame, not the editor', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			const frame = await openOnboardingFrame();

			/* eslint-disable testing-library/no-node-access -- Asserting *which*
			   document each node lands in is the point of this test; Testing
			   Library's queries are scoped to one and cannot express it. */
			await waitFor( () =>
				expect(
					frame.contentDocument.querySelector( 'script[data-paypal-partner-js]' )
				).not.toBeNull()
			);

			// In the editor's document the SDK's redirect would take the editor
			// with it, which is the reload this frame exists to prevent.
			expect( document.querySelector( 'script[data-paypal-partner-js]' ) ).toBeNull();
			/* eslint-enable testing-library/no-node-access */

			// The SDK resolves the callback against the realm it runs in.
			expect( typeof frame.contentWindow.jetpackPayPalOnboardComplete ).toBe( 'function' );
		} );

		it( 'never sends the merchant to a browser window of their own', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );
			const open = jest.spyOn( window, 'open' ).mockReturnValue( null );

			// Open the overlay: the click that opens PayPal is where a popup
			// would come from.
			await openActiveOverlay();

			// The whole point of the frame: no popup, no new window, nothing for
			// the merchant to lose track of behind the editor.
			expect( open ).not.toHaveBeenCalled();
		} );

		it( 'points the connect link at the frame rather than a new tab', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			const frame = await openOnboardingFrame();
			const link = await findConnectLink( frame );

			// PPFrame is the window PayPal's SDK opens its lightbox in. Without
			// the target the same click loads PayPal over the frame document.
			expect( link ).toHaveAttribute( 'target', 'PPFrame' );
		} );

		it( 'buys the referral on a click that has none, and opens on the next click', async () => {
			const user = userEvent.setup();
			// Before render: the watcher patches each frame realm as the frame
			// mounts, and this path remounts the frame after the failed fetch.
			const click = watchAnchorClicks();
			let attempt = 0;
			apiFetch.mockImplementation( ( { path } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( {
						connected: false,
						environment: 'sandbox',
						partner_referrals_available: true,
					} );
				}
				if ( path.endsWith( '/onboarding/signup-link' ) ) {
					attempt += 1;
					// The first attempt fails, which is one way the merchant
					// reaches an enabled Connect button with no referral in hand.
					return 1 === attempt
						? Promise.reject( new Error( 'Could not create a PayPal onboarding link.' ) )
						: Promise.resolve( {
								action_url: 'https://www.sandbox.paypal.com/merchantsignup/x',
						  } );
				}
				return Promise.resolve( {} );
			} );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await expect(
				screen.findByText( /Could not create a PayPal onboarding link/ )
			).resolves.toBeInTheDocument();

			// No referral means no frame either, and PayPal's window.open from a
			// frame built after the click is popup-blocked. So this click buys
			// the referral and stops.
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await settlePartnerScript( frame );

			expect( signupLinkCalls() ).toHaveLength( 2 );
			expect( click ).not.toHaveBeenCalled();
			expect( frame ).not.toHaveClass( 'jetpack-paypal-onboarding-frame--active' );

			// The frame is there now, so it is in the set of same-origin frames
			// this click stamps its user activation on.
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			expect( click ).toHaveBeenCalledTimes( 1 );
			expect( frame ).toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
		} );

		it( 'does not open PayPal when the script loads without the SDK', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			// The tag loads but PAYPAL never attaches, so the anchor stays an
			// ordinary link. Clicking it would open a browser tab.
			await settlePartnerScript( frame, { sdk: false } );

			expect( click ).not.toHaveBeenCalled();
			await expect(
				screen.findByText( /Could not load PayPal’s onboarding window/ )
			).resolves.toBeInTheDocument();
		} );

		it( 'opens PayPal on the retry after its script fails to load', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await settlePartnerScript( await screen.findByTitle( 'PayPal onboarding' ), {
				result: 'error',
			} );
			await expect(
				screen.findByText( /Could not load PayPal’s onboarding window/ )
			).resolves.toBeInTheDocument();

			// The failure dropped the referral with the frame, so the retry starts
			// from nothing: this click rebuilds both and stops.
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );
			await settlePartnerScript( await screen.findByTitle( 'PayPal onboarding' ) );

			expect( click ).not.toHaveBeenCalled();

			// The next one opens PayPal, which is what the notice promised.
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			expect( click ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'drops the request when the merchant leaves the welcome step', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			// Second thoughts, while PayPal's script is still loading.
			await user.click(
				screen.getByRole( 'button', { name: /enter your API credentials manually/i } )
			);
			await settlePartnerScript( frame );

			// The frame is rendered outside the step conditionals, so a request
			// left standing would open PayPal over the credentials form.
			expect( click ).not.toHaveBeenCalled();
			expect( frame ).not.toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
		} );

		it( 'waits for PayPal to bind the link before clicking it', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			// render() returns before PayPal has bound the anchor. Until it takes
			// the target away the anchor is an ordinary link, and clicking it
			// opens a browser tab instead of the lightbox.
			const renderSpy = await settlePartnerScript( frame, { binds: false } );

			expect( renderSpy ).toHaveBeenCalled();
			expect( click ).not.toHaveBeenCalled();
			expect( frame ).not.toHaveClass( 'jetpack-paypal-onboarding-frame--active' );

			// The merchant clicked and nothing has opened yet, so the button has
			// to show it heard them.
			const connect = screen.getByRole( 'button', { name: /Connecting/i } );
			expect( connect ).toBeDisabled();
			expect( connect ).toHaveAttribute( 'data-busy', 'true' );
		} );

		it( 'drops the request when the environment changes', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await expect( screen.findByTitle( 'PayPal onboarding' ) ).resolves.toBeInTheDocument();
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			// Second thoughts, before PayPal's script has bound anything.
			await user.click( screen.getByLabelText( 'Use sandbox (testing)' ) );
			await waitFor( () => expect( signupLinkCalls() ).toHaveLength( 2 ) );
			await settlePartnerScript( await screen.findByTitle( 'PayPal onboarding' ) );

			// The refetched referral must not launch PayPal off the toggle.
			expect( click ).not.toHaveBeenCalled();
		} );

		it( 'asks PayPal to rescan once its script is loaded', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			const renderSpy = await settlePartnerScript( frame );

			// Without the rescan the anchor is never turned into a PayPal button
			// and the click that opens the lightbox does nothing.
			expect( renderSpy ).toHaveBeenCalled();
		} );

		it( 'swaps the wizard for the connected view when the SDK reports completion', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			await openActiveOverlay();

			await act( async () => {
				window.jetpackPayPalOnboardComplete( 'AUTH_CODE_1', 'SHARED_ID_1' );
			} );

			// The frame going away means little on its own: clearing the referral
			// and flipping to connected each remove it. Check for the connected
			// view itself.
			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByTitle( 'PayPal onboarding' ) ).not.toBeInTheDocument();
		} );

		/**
		 * Onboard, then disconnect — the only route back to the wizard once the
		 * SDK has reported completion. Disconnect leaves signupUrl and the
		 * overlay flag alone, so whatever completion left behind is what the
		 * merchant comes back to.
		 *
		 * @param {object} user - userEvent instance.
		 */
		async function onboardThenDisconnect( user ) {
			await openActiveOverlay();

			await act( async () => {
				window.jetpackPayPalOnboardComplete( 'AUTH_CODE_1', 'SHARED_ID_1' );
			} );

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();

			await user.click( screen.getByRole( 'button', { name: /Disconnect PayPal/i } ) );
			await user.click( screen.getByTestId( 'confirm-dialog-confirm' ) );

			await expect(
				screen.findByRole( 'button', { name: /Connect with PayPal/i } )
			).resolves.toBeVisible();
		}

		it( 'drops the spent referral link when onboarding completes', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			await onboardThenDisconnect( user );

			// A referral that has been through onboarding cannot be reopened, and
			// only an empty signupUrl lets the prefetch ask for a fresh one. Wait
			// for the second request, then check there was only the one extra.
			await waitFor( () => expect( signupLinkCalls().length ).toBeGreaterThan( 1 ) );
			expect( signupLinkCalls() ).toHaveLength( 2 );
		} );

		it( 'leaves the overlay down when the wizard comes back', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			await onboardThenDisconnect( user );

			// The prefetch remounts the frame. It must come back closed rather
			// than covering the welcome step with nothing in it.
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			expect( frame ).not.toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
		} );

		it( 'closes the frame when the exchange fails, so the error is not hidden behind it', async () => {
			apiFetch.mockImplementation( ( { path, method } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( {
						connected: false,
						environment: 'sandbox',
						partner_referrals_available: true,
					} );
				}
				if ( path.endsWith( '/onboarding/signup-link' ) ) {
					return Promise.resolve( {
						action_url: 'https://www.sandbox.paypal.com/merchantsignup/x',
					} );
				}
				if ( path.endsWith( '/onboarding/complete' ) && 'POST' === method ) {
					return Promise.reject( new Error( 'PayPal token exchange failed.' ) );
				}
				return Promise.resolve( {} );
			} );

			// Taking the overlay down only means something if it went up.
			const frame = await openActiveOverlay();

			await act( async () => {
				window.jetpackPayPalOnboardComplete( 'AUTH_CODE_1', 'SHARED_ID_1' );
			} );

			// The error notice renders on the welcome step, which the overlay
			// would otherwise cover. The referral has been through PayPal by now,
			// so it goes too and the prefetch builds a fresh frame for the retry.
			await waitFor( () => expect( frame ).not.toBeInTheDocument() );
			await expect(
				screen.findByText( /PayPal token exchange failed/ )
			).resolves.toBeInTheDocument();
		} );

		it( 'opens PayPal when the anchor is already bound before we start watching', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			const frame = await screen.findByTitle( 'PayPal onboarding' );

			// PayPal normally takes the target away after render() returns, so we
			// watch for it. Nothing promises that ordering: bind inside render()
			// and the change has already happened before anything is watching.
			await settlePartnerScript( frame, { sync: true } );

			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			expect( click ).toHaveBeenCalledTimes( 1 );
			expect( frame ).toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
		} );

		it( 'does not open on a rebuilt frame the SDK has not bound yet', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			await openActiveOverlay();
			await user.keyboard( '{Escape}' );
			await waitFor( () => expect( signupLinkCalls() ).toHaveLength( 2 ) );

			// The replacement frame is mounted but PayPal has not bound its anchor
			// yet. Unless tearing down the old frame also cleared isSdkReady, this
			// click opens the overlay onto an ordinary link.
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await user.click( screen.getByRole( 'button', { name: /Connect with PayPal/i } ) );

			expect( click ).toHaveBeenCalledTimes( 1 );
			expect( frame ).not.toHaveClass( 'jetpack-paypal-onboarding-frame--active' );

			// And once it does bind, the click that was waiting goes through.
			await settlePartnerScript( frame );

			expect( click ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'exchanges the auth code the SDK hands to the frame realm', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			const frame = await openActiveOverlay();

			/*
			 * The SDK resolves the callback by name against the realm it runs in,
			 * and it runs in the frame. Every other completion test calls the copy
			 * on the top window, so this is the only one on the path PayPal
			 * actually takes.
			 */
			await act( async () => {
				frame.contentWindow.jetpackPayPalOnboardComplete( 'AUTH_CODE_2', 'SHARED_ID_2' );
			} );

			await waitFor( () =>
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: expect.stringContaining( '/onboarding/complete' ),
						method: 'POST',
						data: expect.objectContaining( {
							auth_code: 'AUTH_CODE_2',
							shared_id: 'SHARED_ID_2',
						} ),
					} )
				)
			);

			// Then the wizard gives way to the connected view.
			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByTitle( 'PayPal onboarding' ) ).not.toBeInTheDocument();
		} );

		it( 'closes the overlay on Escape', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			const frame = await openActiveOverlay();

			await user.keyboard( '{Escape}' );

			// The referral goes with the overlay, so the frame unmounts and the
			// prefetch builds a fresh one. It has to come back closed.
			await waitFor( () => expect( frame ).not.toBeInTheDocument() );
			await expect( screen.findByTitle( 'PayPal onboarding' ) ).resolves.not.toHaveClass(
				'jetpack-paypal-onboarding-frame--active'
			);
		} );

		it( 'closes the overlay from its close button', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			const frame = await openActiveOverlay();

			// Queried by accessible name — that is all a keyboard or screen
			// reader user gets.
			await user.click( screen.getByRole( 'button', { name: 'Close PayPal onboarding' } ) );

			await waitFor( () => expect( frame ).not.toBeInTheDocument() );
			await expect( screen.findByTitle( 'PayPal onboarding' ) ).resolves.not.toHaveClass(
				'jetpack-paypal-onboarding-frame--active'
			);
		} );

		it( 'shows the close button only while the overlay is up', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await settlePartnerScript( await screen.findByTitle( 'PayPal onboarding' ) );

			// The frame is mounted hidden long before the merchant clicks Connect.
			// A close button sitting in the tab order there has nothing to close.
			expect(
				screen.queryByRole( 'button', { name: 'Close PayPal onboarding' } )
			).not.toBeInTheDocument();
		} );

		it( 'leaves the referral alone when Escape lands with the overlay down', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await settlePartnerScript( await screen.findByTitle( 'PayPal onboarding' ) );

			await user.keyboard( '{Escape}' );

			// Escape belongs to the editor until the overlay is up. Taking it here
			// throws away a referral the merchant never opened and asks for another.
			expect( signupLinkCalls() ).toHaveLength( 1 );
			await expect( screen.findByTitle( 'PayPal onboarding' ) ).resolves.toBeInTheDocument();
		} );

		it( 'asks for a fresh referral after a cancel', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			await openActiveOverlay();
			expect( signupLinkCalls() ).toHaveLength( 1 );

			await user.keyboard( '{Escape}' );

			// The referral has been opened, so it cannot be reopened. Canceling
			// has to drop it and the prefetch has to ask for another.
			await waitFor( () => expect( signupLinkCalls() ).toHaveLength( 2 ) );
		} );

		it( 'stops the Escape before anything below the document sees it', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			await openActiveOverlay();

			// Stands in for the editor's own Escape, which runs on the canvas
			// body. jsdom has no canvas iframe, so this checks the listener
			// ordering rather than the editor itself.
			const editor = jest.fn();
			watchKeys( document.body, editor );

			await user.keyboard( '{Escape}' );

			expect( editor ).not.toHaveBeenCalled();
		} );

		it( 'cancels the Escape event', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			await openActiveOverlay();

			// Same node, same phase, registered second, so it still runs —
			// stopPropagation does not silence other listeners on its own node.
			const seen = [];
			watchKeys( document, event => seen.push( event.defaultPrevented ), true );

			await user.keyboard( '{Escape}' );

			expect( seen ).toEqual( [ true ] );
		} );

		it( 'stops listening for Escape once the overlay is closed', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			await openActiveOverlay();
			await user.keyboard( '{Escape}' );
			await waitFor( () =>
				expect( screen.getByTitle( 'PayPal onboarding' ) ).not.toHaveClass(
					'jetpack-paypal-onboarding-frame--active'
				)
			);

			// A listener left behind goes on eating Escape for the rest of the
			// editor session, with no overlay left to close.
			const editor = jest.fn();
			watchKeys( document.body, editor );

			await user.keyboard( '{Escape}' );

			expect( editor ).toHaveBeenCalled();
		} );

		it( 'leaves the overlay up for keys that are not Escape', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			const frame = await openActiveOverlay();

			await user.keyboard( 'a' );

			// Escape is the exit. Closing on anything else throws away a referral
			// on a stray keypress.
			expect( frame ).toBeInTheDocument();
			expect( frame ).toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
		} );

		it( 'does not reopen PayPal off the referral fetched after a cancel', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			await openActiveOverlay();

			await user.keyboard( '{Escape}' );
			await waitFor( () => expect( signupLinkCalls() ).toHaveLength( 2 ) );

			// If the request survived the cancel, the replacement referral would
			// reopen PayPal on its own, over the wizard the merchant came back to.
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await settlePartnerScript( frame );

			expect( click ).toHaveBeenCalledTimes( 1 );
			expect( frame ).not.toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
		} );

		it( 'exposes the completion callback for the SDK to call by name', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await expect(
				screen.findByRole( 'button', { name: /Connect with PayPal/i } )
			).resolves.toBeVisible();

			// The SDK resolves the callback off `window` by name, so it cannot be
			// a closure passed to the script.
			expect( typeof window.jetpackPayPalOnboardComplete ).toBe( 'function' );
		} );

		it( 'exchanges the auth code when the SDK reports completion', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await expect(
				screen.findByRole( 'button', { name: /Connect with PayPal/i } )
			).resolves.toBeVisible();

			await act( async () => {
				window.jetpackPayPalOnboardComplete( 'AUTH_CODE_1', 'SHARED_ID_1' );
			} );

			await waitFor( () =>
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: expect.stringContaining( '/onboarding/complete' ),
						method: 'POST',
						data: expect.objectContaining( {
							auth_code: 'AUTH_CODE_1',
							shared_id: 'SHARED_ID_1',
						} ),
					} )
				)
			);
		} );

		it( 'shows the failure when the signup link cannot be generated', async () => {
			mockPlatformMode( { reject: new Error( 'Could not create a PayPal onboarding link.' ) } );

			const user = userEvent.setup();
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await user.click( await screen.findByRole( 'button', { name: /Connect with PayPal/i } ) );

			await expect(
				screen.findByText( /Could not create a PayPal onboarding link/ )
			).resolves.toBeInTheDocument();

			expect( screen.queryByTitle( 'PayPal onboarding' ) ).not.toBeInTheDocument();
		} );

		it( 'shows the failure and stops asking for the signup link', async () => {
			mockPlatformMode( { reject: new Error( 'Could not create a PayPal onboarding link.' ) } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			/*
			 * The failed request clears the busy flag, which re-runs the prefetch.
			 * Without connectError to stop it the block asks again on a loop, and
			 * each attempt wipes the error the merchant is meant to read.
			 */
			await expect(
				screen.findByText( /Could not create a PayPal onboarding link/ )
			).resolves.toBeInTheDocument();

			expect( signupLinkCalls() ).toHaveLength( 1 );
		} );

		it( 'dismissing the signup-link failure hides it and leaves the request count at one', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { reject: new Error( 'Could not create a PayPal onboarding link.' ) } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect(
				screen.findByText( /Could not create a PayPal onboarding link/ )
			).resolves.toBeInTheDocument();

			await user.click( screen.getByTestId( 'dismiss-notice' ) );

			// Wait for the dismissal before counting, or the count is taken
			// before the prefetch could run.
			await waitFor( () =>
				expect(
					screen.queryByText( /Could not create a PayPal onboarding link/ )
				).not.toBeInTheDocument()
			);

			// Dismissing must leave connectError set, or the prefetch runs again
			// and puts the same notice straight back.
			expect( signupLinkCalls() ).toHaveLength( 1 );
		} );

		it( 'asks again when the merchant clicks Connect with PayPal after a failure', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { reject: new Error( 'Could not create a PayPal onboarding link.' ) } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await user.click( await screen.findByRole( 'button', { name: /Connect with PayPal/i } ) );

			// fetchSignupLink clears connectError on entry, so a deliberate click
			// gets past the bail condition that stops the automatic retry.
			expect( signupLinkCalls() ).toHaveLength( 2 );
		} );
	} );

	describe( 'Legacy Block', () => {
		it( 'shows legacy message for paste-code blocks', async () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );

			render(
				<Edit
					attributes={ {
						isApiManaged: false,
						scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
						hostedButtonId: 'BTN_123',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( /legacy paste-code format/ ) ).resolves.toBeInTheDocument();
		} );
	} );

	describe( 'Create Form (connected, no button)', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		it( 'shows the create form when connected but no button exists', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			expect( screen.getByLabelText( 'Product Name' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( 'Price' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( 'Currency' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( /Description/ ) ).toBeInTheDocument();
			expect( screen.getByText( 'Product Image (optional)' ) ).toBeInTheDocument();
		} );

		it( 'calls setAttributes when product name changes', async () => {
			const user = userEvent.setup();

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			const nameInput = screen.getByLabelText( 'Product Name' );
			await user.type( nameInput, 'T' );

			expect( setAttributes ).toHaveBeenCalledWith( { productName: 'T' } );
		} );

		it( 'disables the primary action when form is invalid', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			const createButton = screen.getByText( 'Create New' );
			expect( createButton ).toBeDisabled();
		} );

		it( 'enables the primary action when required fields are filled', async () => {
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			const createButton = screen.getByText( 'Create New' );
			expect( createButton ).toBeEnabled();
		} );

		it( 'disables the primary action when the description is too long', async () => {
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						productDescription: 'x'.repeat( 2049 ),
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			const createButton = screen.getByText( 'Create New' );
			expect( createButton ).toBeDisabled();
		} );

		it( 'accepts a description past the old 256 limit', async () => {
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						productDescription: 'x'.repeat( 500 ),
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			expect( screen.getByText( 'Create New' ) ).toBeEnabled();
		} );

		it( 'submits create request with correct data', async () => {
			const user = userEvent.setup();

			// First call: connection check. Second call: create button.
			apiFetch
				.mockResolvedValueOnce( { connected: true, environment: 'sandbox' } )
				.mockResolvedValueOnce( {
					id: 'PLB-TEST123',
					payment_link: 'https://www.paypal.com/paymentpage/PLB-TEST123',
				} );

			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						collectShippingAddress: false,
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			const createButton = screen.getByText( 'Create New' );
			await user.click( createButton );

			// Should have called apiFetch with the create request.
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/wpcom/v2/paypal/buttons',
					method: 'POST',
					data: expect.objectContaining( {
						type: 'BUY_NOW',
						integration_mode: 'LINK',
						line_items: expect.arrayContaining( [
							expect.objectContaining( {
								name: 'Test Widget',
								unit_amount: { currency_code: 'USD', value: '29.99' },
								// Sent even when off: omit it and PayPal turns address collection on.
								collect_shipping_address: false,
							} ),
						] ),
					} ),
				} )
			);
		} );
	} );

	describe( 'Per-variant pricing', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		/**
		 * Build a variants structure with one primary option group.
		 *
		 * The group is primary, so PayPal takes the amounts from the options rather
		 * than from the product.
		 *
		 * @param {Array} prices - One price per option; '' means unpriced.
		 * @return {object} Variants structure.
		 */
		const variantsWithPrices = prices => ( {
			dimensions: [
				{
					_key: 'grp-1',
					name: 'Size',
					primary: true,
					options: prices.map( ( value, i ) => ( {
						_key: `opt-${ i }`,
						label: `Option ${ i + 1 }`,
						unit_amount: { currency_code: 'USD', value },
					} ) ),
				},
			],
		} );

		// The variant builder gives every option in the primary group its own
		// 'Price' control, so the product price is looked up inside Details.
		const details = () => within( panel( 'Details' ) );

		it( 'drops the price field and keeps the currency select', async () => {
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: variantsWithPrices( [ '10.00', '20.00' ] ),
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByLabelText( 'Currency' ) ).resolves.toBeInTheDocument();
			expect( details().queryByLabelText( 'Price' ) ).not.toBeInTheDocument();
		} );

		it( 'drops the price field before a single option price is typed', async () => {
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: variantsWithPrices( [ '', '' ] ),
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByLabelText( 'Currency' ) ).resolves.toBeInTheDocument();
			expect( details().queryByLabelText( 'Price' ) ).not.toBeInTheDocument();
		} );

		it( 'keeps the price field while no group is primary', async () => {
			const variants = variantsWithPrices( [ '', '' ] );
			variants.dimensions[ 0 ].primary = false;

			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants,
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByLabelText( 'Currency' ) ).resolves.toBeInTheDocument();
			expect( details().getByLabelText( 'Price' ) ).toBeInTheDocument();
		} );

		it( 'ignores a price left behind from before the options were priced', async () => {
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						// Invalid, and now unreachable - it must not gate the save button.
						price: '0',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: variantsWithPrices( [ '10.00', '20.00' ] ),
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			expect( screen.getByText( 'Create New' ) ).toBeEnabled();
		} );

		it( 'gates the save button on the options once their prices are cleared', async () => {
			const attributes = {
				productName: 'Test Widget',
				price: '0',
				currencyCode: 'USD',
				variantsEnabled: true,
				variants: variantsWithPrices( [ '10.00', '20.00' ] ),
			};

			const { rerender } = render(
				<Edit attributes={ attributes } setAttributes={ setAttributes } />
			);

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();

			rerender(
				<Edit
					attributes={ { ...attributes, variants: variantsWithPrices( [ '', '' ] ) } }
					setAttributes={ setAttributes }
				/>
			);

			// Pricing stays on, so the product price field stays away and the options
			// themselves carry the error rather than handing it back to a hidden field.
			expect( details().queryByLabelText( 'Price' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Create New' ) ).toBeDisabled();
			expect( screen.getAllByText( 'Price is required.' ) ).toHaveLength( 2 );
		} );

		it( 'prices the first group and only the first group', async () => {
			const user = userEvent.setup();

			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'EUR',
						variantsEnabled: true,
						variants: {
							dimensions: [
								{
									_key: 'g1',
									name: 'Color',
									primary: false,
									options: [ { _key: 'o1', label: 'Black' } ],
								},
								{
									_key: 'g2',
									name: 'Size',
									primary: false,
									options: [ { _key: 'o2', label: 'Small' } ],
								},
							],
						},
					} }
					setAttributes={ setAttributes }
				/>
			);

			await user.click( await screen.findByLabelText( 'Add price per variant' ) );

			const { dimensions } = setAttributes.mock.lastCall[ 0 ].variants;
			expect( dimensions.map( dim => dim.primary ) ).toEqual( [ true, false ] );
			expect( dimensions[ 0 ].options[ 0 ].unit_amount.currency_code ).toBe( 'EUR' );
			expect( dimensions[ 1 ].options[ 0 ] ).not.toHaveProperty( 'unit_amount' );
		} );

		it( 'takes the option prices away when pricing is turned off', async () => {
			const user = userEvent.setup();

			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: variantsWithPrices( [ '10.00', '20.00' ] ),
					} }
					setAttributes={ setAttributes }
				/>
			);

			await user.click( await screen.findByLabelText( 'Add price per variant' ) );

			const [ dimension ] = setAttributes.mock.lastCall[ 0 ].variants.dimensions;
			expect( dimension.primary ).toBe( false );
			expect( dimension.options.every( opt => ! opt.unit_amount ) ).toBe( true );
			// Turning pricing off drops the prices only - labels and keys stay.
			expect( dimension.options.map( opt => opt.label ) ).toEqual( [ 'Option 1', 'Option 2' ] );
			expect( dimension.options.map( opt => opt._key ) ).toEqual( [ 'opt-0', 'opt-1' ] );
		} );

		// A payment created outside the block can price a later group; moving it to the
		// first would drop those prices on the next save.
		it( 'leaves a payment that prices a later group alone', async () => {
			const user = userEvent.setup();
			const priced = variantsWithPrices( [ '10.00', '20.00' ] ).dimensions[ 0 ];

			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: {
							dimensions: [
								{ _key: 'grp-0', name: 'Color', primary: false, options: [ { label: 'Black' } ] },
								{ ...priced, _key: 'grp-2' },
							],
						},
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect(
				screen.findByText( 'Prices are set on variant 2.' )
			).resolves.toBeInTheDocument();
			expect( screen.getByLabelText( 'Add price per variant' ) ).toBeChecked();

			// Turning pricing off drops the prices from the group that has them, not from
			// the one a new button would have used.
			await user.click( screen.getByLabelText( 'Add price per variant' ) );

			const { dimensions } = setAttributes.mock.lastCall[ 0 ].variants;
			expect( dimensions.some( dim => dim.primary ) ).toBe( false );
			expect( dimensions[ 1 ].options.every( opt => ! opt.unit_amount ) ).toBe( true );
		} );

		it( 'leaves the product amount out of the create request', async () => {
			const user = userEvent.setup();

			apiFetch
				.mockResolvedValueOnce( { connected: true, environment: 'sandbox' } )
				.mockResolvedValueOnce( {
					id: 'PLB-TEST123',
					payment_link: 'https://www.paypal.com/paymentpage/PLB-TEST123',
				} );

			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: variantsWithPrices( [ '10.00', '20.00' ] ),
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			await user.click( screen.getByText( 'Create New' ) );

			// PayPal rejects a request carrying unit_amount at both levels.
			const [ , create ] = apiFetch.mock.calls;
			expect( create[ 0 ].method ).toBe( 'POST' );
			expect( create[ 0 ].data.line_items[ 0 ].name ).toBe( 'Test Widget' );
			expect( create[ 0 ].data.line_items[ 0 ] ).not.toHaveProperty( 'unit_amount' );
		} );

		it( 'sends the option prices in the currency the product is in', async () => {
			const user = userEvent.setup();

			apiFetch
				.mockResolvedValueOnce( { connected: true, environment: 'sandbox' } )
				.mockResolvedValueOnce( {
					id: 'PLB-TEST124',
					payment_link: 'https://www.paypal.com/paymentpage/PLB-TEST124',
				} );

			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						// The options were priced in USD and the currency changed afterwards.
						currencyCode: 'EUR',
						variantsEnabled: true,
						variants: variantsWithPrices( [ '10.00', '20.00' ] ),
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			await user.click( screen.getByText( 'Create New' ) );

			const [ , create ] = apiFetch.mock.calls;
			const [ dimension ] = create[ 0 ].data.line_items[ 0 ].variants.dimensions;
			expect( dimension.options.map( opt => opt.unit_amount.currency_code ) ).toEqual( [
				'EUR',
				'EUR',
			] );
		} );
	} );

	describe( 'Product option errors', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		/**
		 * Build an option group, shaped like the empty one enabling the panel seeds.
		 *
		 * @param {string} key       - Stable group key.
		 * @param {object} overrides - Fields to replace on the group.
		 * @return {object} Option group.
		 */
		const group = ( key, overrides = {} ) => ( {
			_key: key,
			name: '',
			primary: false,
			options: [ { _key: `${ key }-o1`, label: '' } ],
			...overrides,
		} );

		/**
		 * Render the form with the given option groups.
		 *
		 * @param {Array} dimensions - Option groups.
		 * @return {object} Testing Library render result.
		 */
		const renderWith = ( dimensions = [ group( 'g1' ) ] ) =>
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: { dimensions },
					} }
					setAttributes={ setAttributes }
				/>
			);

		/**
		 * One variant's name control. They all share a label, so they go by position.
		 *
		 * @param {number} index - Zero-based variant index.
		 * @return {Element} That variant's name control.
		 */
		const variantControl = index => screen.getAllByTestId( 'control-Variant name' )[ index ];

		/**
		 * Open a saved button's edit form with the given option groups.
		 *
		 * @param {object} user       - userEvent instance.
		 * @param {Array}  dimensions - Option groups.
		 */
		const openSavedWith = async ( user, dimensions ) => {
			apiFetch.mockImplementation( ( { path } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				return Promise.resolve( { id: 'PLB-OPT1', line_items: [ {} ] } );
			} );

			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-OPT1',
						paymentLink: 'https://www.paypal.com/ncp/payment/PLB-OPT1',
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: { dimensions },
					} }
					setAttributes={ setAttributes }
				/>
			);
			await expect( screen.findByTestId( 'toolbar-Edit' ) ).resolves.toBeInTheDocument();
			await user.click( screen.getByTestId( 'toolbar-Edit' ) );
		};

		/**
		 * The Product Options panel.
		 *
		 * @return {Element} The panel element.
		 */
		const optionsPanel = () =>
			screen
				.getAllByTestId( 'panel-body' )
				.find( body => body.getAttribute( 'data-title' ) === 'Product Options' );

		// A saved button opens with the panel closed, and a closed panel renders no
		// children - so a group that was already invalid when it was saved says nothing.
		it( 'opens the panel on a saved button whose options need fixing', async () => {
			const user = userEvent.setup();
			await openSavedWith( user, [ group( 'g1' ) ] );

			expect( optionsPanel() ).toHaveAttribute( 'data-initial-open', 'true' );
			expect(
				within( variantControl( 0 ) ).getByText( 'Variant name is required.' )
			).toBeVisible();
		} );

		it( 'leaves the panel closed on a saved button whose options are fine', async () => {
			const user = userEvent.setup();
			await openSavedWith( user, [
				group( 'g1', { name: 'Size', options: [ { _key: 'g1-o1', label: 'Small' } ] } ),
			] );

			expect( optionsPanel() ).toHaveAttribute( 'data-initial-open', 'false' );
		} );

		// The design labels every variant the same, so the number only exists for screen
		// readers - without it two name fields on one panel are indistinguishable.
		it( 'labels every variant the same on screen and numbers them for screen readers', async () => {
			renderWith( [ group( 'g1' ), group( 'g2' ) ] );

			await expect( screen.findAllByText( 'Variant name' ) ).resolves.toHaveLength( 2 );
			expect( screen.getByRole( 'textbox', { name: 'Variant name 1' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'textbox', { name: 'Variant name 2' } ) ).toBeInTheDocument();
		} );

		it( 'holds its tongue until the merchant leaves the field', async () => {
			renderWith();

			await expect(
				screen.findByRole( 'textbox', { name: 'Variant name 1' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( 'Variant name is required.' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Option name is required.' ) ).not.toBeInTheDocument();
			// The save button is dead from the first render, with nothing on screen saying why.
			expect( screen.getByText( 'Create New' ) ).toBeDisabled();
		} );

		it( 'puts the error inside the control that caused it', async () => {
			const user = userEvent.setup();
			renderWith();

			await visit( user, await screen.findByRole( 'textbox', { name: 'Variant name 1' } ) );

			expect(
				within( variantControl( 0 ) ).getByText( 'Variant name is required.' )
			).toBeInTheDocument();
			expect( variantControl( 0 ) ).toHaveClass( 'jetpack-paypal-payment-buttons__has-error' );
			// Leaving the group name says nothing about the option below it.
			expect( screen.queryByText( 'Option name is required.' ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'control-Option 1' ) ).not.toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);

			await visit( user, screen.getByRole( 'textbox', { name: 'Option 1' } ) );

			expect( control( 'Option 1' ).getByText( 'Option name is required.' ) ).toBeInTheDocument();
		} );

		it( 'clears the error once the field is filled', async () => {
			const user = userEvent.setup();
			const { rerender } = renderWith();

			await visit( user, await screen.findByRole( 'textbox', { name: 'Variant name 1' } ) );
			expect( screen.getByText( 'Variant name is required.' ) ).toBeInTheDocument();

			rerender(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: { dimensions: [ group( 'g1', { name: 'Size' } ) ] },
					} }
					setAttributes={ setAttributes }
				/>
			);

			expect( screen.queryByText( 'Variant name is required.' ) ).not.toBeInTheDocument();
		} );

		it( 'keeps one group quiet while the merchant works in another', async () => {
			const user = userEvent.setup();
			renderWith( [ group( 'g1' ), group( 'g2' ) ] );

			await visit( user, await screen.findByRole( 'textbox', { name: 'Variant name 2' } ) );

			expect(
				within( variantControl( 1 ) ).getByText( 'Variant name is required.' )
			).toBeInTheDocument();
			expect(
				within( variantControl( 0 ) ).queryByText( 'Variant name is required.' )
			).not.toBeInTheDocument();
		} );

		it( 'reports an unpriced option without waiting for a visit', async () => {
			renderWith( [
				group( 'g1', {
					name: 'Size',
					primary: true,
					options: [
						{ _key: 'o1', label: 'Small', unit_amount: { currency_code: 'USD', value: '10.00' } },
						{ _key: 'o2', label: 'Large', unit_amount: { currency_code: 'USD', value: '' } },
					],
				} ),
			] );

			// Turning pricing on is the interaction, so an option with no price says so
			// rather than waiting for a blur on a field nobody has reached.
			await expect( screen.findAllByLabelText( 'Price' ) ).resolves.toHaveLength( 2 );

			// Every option renders its own control labelled 'Price', so the message has to
			// be checked against the one that is missing a price rather than the panel.
			const [ priced, unpriced ] = screen.getAllByTestId( 'control-Price' );
			expect( within( unpriced ).getByText( 'Price is required.' ) ).toBeInTheDocument();
			expect( unpriced ).toHaveClass( 'jetpack-paypal-payment-buttons__has-error' );
			expect( within( priced ).queryByText( 'Price is required.' ) ).not.toBeInTheDocument();
		} );

		// The option groups are the second path into the same failure, and they enumerate
		// differently: validateVariants returns errors shaped by the data. So put the block
		// in a state, ask the validator what it reports, and require all of it on screen.
		describe( 'Every option group error reaches the merchant', () => {
			// Between them these trip every branch validateVariants has, and no message
			// repeats within one of them.
			const fixtures = [
				// A priced group with nothing in it, and no name either.
				[ { _key: 'g1', name: '', primary: true, options: [] } ],
				// A priced group whose one option is missing both its name and its price.
				[
					{
						_key: 'g2',
						name: 'Size',
						primary: true,
						options: [
							{ _key: 'g2-o1', label: '', unit_amount: { currency_code: 'USD', value: '' } },
						],
					},
				],
			];

			/**
			 * What validateVariants reports for one fixture.
			 *
			 * @param {Array} dimensions - The option groups.
			 * @return {Array} Errors as { group, option, field, message }.
			 */
			const errorsFor = dimensions => validateVariants( true, { dimensions }, 'USD' );

			// Against the exported list, not a copy kept here - so a new kind of option
			// group error fails until a fixture reaches it and the loop below renders it.
			it( 'trips every kind of option group error between them', () => {
				const fields = fixtures.flatMap( errorsFor ).map( error => error.field );

				expect( [ ...new Set( fields ) ].sort() ).toEqual(
					Object.values( VARIANT_ERROR_FIELDS ).sort()
				);
			} );

			it.each( fixtures.map( ( dimensions, i ) => [ i, dimensions ] ) )(
				'shows every error the group in state %i is carrying',
				async ( _index, dimensions ) => {
					const user = userEvent.setup();
					const errors = errorsFor( dimensions );
					expect( errors.length ).toBeGreaterThan( 0 );

					// A saved button, so showAll is on - which is the only way a group with
					// no options reaches the merchant in the first place.
					await openSavedWith( user, dimensions );

					const opened = optionsPanel();
					errors.forEach( ( { message } ) => {
						expect( within( opened ).getByText( message ) ).toBeVisible();
					} );
				}
			);
		} );
	} );

	describe( 'Shared payment resource', () => {
		const attributes = {
			isApiManaged: true,
			resourceId: 'PLB-SHARED1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-SHARED1',
			productName: 'original',
			price: '9.99',
			currencyCode: 'USD',
		};
		const resourcePath = '/wpcom/v2/paypal/buttons/PLB-SHARED1';

		/**
		 * Answer the connection check as connected and the payment read with the given attributes.
		 *
		 * @param {object} resourceAttributes - Block-shaped attributes the server maps from the payment.
		 */
		function mockResource( resourceAttributes ) {
			apiFetch.mockImplementation( ( { path } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				if ( path === resourcePath ) {
					return Promise.resolve( { id: 'PLB-SHARED1', attributes: resourceAttributes } );
				}
				return Promise.resolve( {} );
			} );
		}

		beforeEach( () => {
			mockMarkNotPersistent.mockClear();
		} );

		it( 'corrects a stale copy from the payment PayPal holds, without dirtying the post', async () => {
			mockResource( { ...attributes, productName: 'duplicate', price: '49.00' } );

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );

			await waitFor( () =>
				expect( setAttributes ).toHaveBeenCalledWith( { productName: 'duplicate', price: '49.00' } )
			);
			expect( mockMarkNotPersistent ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'leaves a block alone when it already matches the payment', async () => {
			mockResource( { ...attributes } );

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );

			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toBeInTheDocument();
			await waitFor( () =>
				expect( apiFetch ).toHaveBeenCalledWith( expect.objectContaining( { path: resourcePath } ) )
			);
			expect( setAttributes ).not.toHaveBeenCalled();
			expect( mockMarkNotPersistent ).not.toHaveBeenCalled();
		} );

		it( 'keeps a payment deleted on PayPal for the save-time recovery path', async () => {
			apiFetch.mockImplementation( ( { path } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				return Promise.reject( { code: 'paypal_api_resource_not_found', data: { status: 404 } } );
			} );

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );

			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toBeInTheDocument();
			await waitFor( () =>
				expect( apiFetch ).toHaveBeenCalledWith( expect.objectContaining( { path: resourcePath } ) )
			);
			expect( setAttributes ).not.toHaveBeenCalled();
			expect(
				screen.queryAllByTestId( 'notice' ).map( n => n.getAttribute( 'data-status' ) )
			).toEqual( [ 'info' ] );
		} );

		it( 'does not read the payment while PayPal is disconnected', async () => {
			apiFetch.mockResolvedValue( { connected: false, environment: 'sandbox' } );

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );

			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toBeInTheDocument();
			expect( apiFetch ).not.toHaveBeenCalledWith(
				expect.objectContaining( { path: resourcePath } )
			);
		} );

		it( 'warns that the link is shared on any block that has one', async () => {
			mockResource( { ...attributes } );

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );

			await expect(
				screen.findByText( 'Changes made will apply to all payment buttons with this link.' )
			).resolves.toBeInTheDocument();
		} );

		it( 'stays quiet on a block whose payment link is gone', async () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );

			render(
				<Edit
					attributes={ { ...attributes, paymentLink: '' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);

			// No link means the create form, which must not claim a shared one.
			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			expect(
				screen.queryByText( 'Changes made will apply to all payment buttons with this link.' )
			).not.toBeInTheDocument();
		} );

		it( 'stays quiet on a block with no payment link yet', async () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );

			render(
				<Edit
					attributes={ { productName: 'Test Widget', price: '9.99', currencyCode: 'USD' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
			expect(
				screen.queryByText( 'Changes made will apply to all payment buttons with this link.' )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'Tax', () => {
		const resourcePath = '/wpcom/v2/paypal/buttons/PLB-TAX1';
		const attributes = {
			isApiManaged: true,
			resourceId: 'PLB-TAX1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-TAX1',
			productName: 'Test Widget',
			price: '29.99',
			currencyCode: 'USD',
			taxEnabled: true,
			taxType: 'PERCENTAGE',
			taxValue: '8.25',
		};

		/**
		 * Mock the connection check and the pre-update read.
		 */
		function mockConnected() {
			apiFetch.mockImplementation( ( { path, method } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				if ( path === resourcePath && method === undefined ) {
					return Promise.resolve( { id: 'PLB-TAX1', line_items: [ {} ] } );
				}
				return Promise.resolve( {} );
			} );
		}

		/**
		 * Open the block's edit form, without saving.
		 *
		 * @param {object} user - The userEvent instance driving the clicks.
		 */
		async function openEditForm( user ) {
			await expect( screen.findByTestId( 'toolbar-Edit' ) ).resolves.toBeInTheDocument();
			await user.click( screen.getByTestId( 'toolbar-Edit' ) );
		}

		it( 'offers no tax name to fill in', async () => {
			const user = userEvent.setup();
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await expect( screen.findByTestId( 'toolbar-Edit' ) ).resolves.toBeInTheDocument();
			await user.click( screen.getByTestId( 'toolbar-Edit' ) );

			expect( screen.queryByLabelText( 'Tax name' ) ).not.toBeInTheDocument();
			expect( screen.getByLabelText( 'Tax rate (%)' ) ).toBeInTheDocument();
		} );

		const missingRate = 'To continue, add the requested info or turn off this feature.';

		// An empty rate used to save as a 0% tax - the request sends `taxValue || '0'` and
		// the server clamps it to 0. The rate field appears when Collect tax is turned on,
		// so the error shows straight away rather than waiting for a blur.
		it.each( [
			[ 'no rate at all', '' ],
			[ 'a rate of zero', '0' ],
		] )( 'refuses to save tax with %s', async ( _label, taxValue ) => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxValue } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await openEditForm( user );

			expect( screen.getByText( missingRate ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'control-Tax rate (%)' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( 'Save' ) ).toBeDisabled();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'true' );
		} );

		// A missing type saves as a percentage, so it has to ask for a rate like one -
		// and show the field it is asking about.
		it( 'asks for a rate when the tax type is missing', async () => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType: '', taxValue: '' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await openEditForm( user );

			expect( screen.getByLabelText( 'Tax rate (%)' ) ).toBeInTheDocument();
			expect( screen.getByText( missingRate ) ).toBeInTheDocument();
		} );

		it( 'turns tax collection on', async () => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxEnabled: false } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await openEditForm( user );
			await user.click( screen.getByLabelText( 'Collect tax' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { taxEnabled: true } );
		} );

		it( 'writes the tax type', async () => {
			const user = userEvent.setup();
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await openEditForm( user );
			await user.selectOptions( screen.getByLabelText( 'Tax type' ), 'PREFERENCE' );

			expect( setAttributes ).toHaveBeenCalledWith( { taxType: 'PREFERENCE' } );
		} );

		it( 'writes the tax rate', async () => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxValue: '' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await openEditForm( user );
			await user.type( screen.getByLabelText( 'Tax rate (%)' ), '8' );

			expect( setAttributes ).toHaveBeenCalledWith( { taxValue: '8' } );
		} );

		it( 'saves a rate that is filled in', async () => {
			const user = userEvent.setup();
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await openEditForm( user );

			expect( screen.queryByText( missingRate ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'control-Tax rate (%)' ) ).not.toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( 'Save' ) ).toBeEnabled();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'false' );
		} );

		// FLAT is not on the Tax type menu, but a link created outside the block can carry
		// one and the read-back copies the type through as it is.
		it.each( [
			[ 'PayPal keeps the rate', 'PREFERENCE' ],
			[ 'the tax is a flat amount', 'FLAT' ],
		] )( 'asks for no rate when %s', async ( _label, taxType ) => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType, taxValue: '' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await openEditForm( user );

			expect( screen.queryByText( missingRate ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Save' ) ).toBeEnabled();
		} );

		/**
		 * The taxes the update request sent.
		 *
		 * @return {Array|undefined} The taxes array from the PUT.
		 */
		function taxesFromUpdate() {
			const put = apiFetch.mock.calls.find( ( [ options ] ) => options.method === 'PUT' );
			return put?.[ 0 ]?.data?.line_items?.[ 0 ]?.taxes;
		}

		// PayPal renders its own label to the buyer, so the merchant's string goes
		// nowhere - and requiring one threw the whole tax away.
		it( 'collects tax on a payment without a tax name', async () => {
			const user = userEvent.setup();
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await saveFromEditForm( user );

			await waitFor( () =>
				expect( taxesFromUpdate() ).toEqual( [ { type: 'PERCENTAGE', value: '8.25' } ] )
			);
		} );

		it( 'leaves taxes out of the request when tax collection is off', async () => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxEnabled: false } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await saveFromEditForm( user );

			await waitFor( () =>
				expect( apiFetch ).toHaveBeenCalledWith( expect.objectContaining( { method: 'PUT' } ) )
			);
			expect( taxesFromUpdate() ).toBeUndefined();
		} );

		it( 'sends PayPal’s own profile rate as PROFILE', async () => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType: 'PREFERENCE' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await saveFromEditForm( user );

			await waitFor( () =>
				expect( taxesFromUpdate() ).toEqual( [ { type: 'PREFERENCE', value: 'PROFILE' } ] )
			);
		} );

		// A payment made in PayPal's dashboard can have one. Sending an empty name
		// back would overwrite it, so the key rides along only when there is one.
		it( 'sends a tax name the payment already has', async () => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxName: 'ZZ Custom VAT Label' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await saveFromEditForm( user );

			await waitFor( () =>
				expect( taxesFromUpdate() ).toEqual( [
					{ name: 'ZZ Custom VAT Label', type: 'PERCENTAGE', value: '8.25' },
				] )
			);
		} );
	} );

	describe( 'Custom checkout fields', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		/**
		 * Build a customer notes attribute with one labelled note per field.
		 *
		 * @param {number} count - How many fields to configure.
		 * @return {Array} Customer notes.
		 */
		const notes = count =>
			Array.from( { length: count }, ( _, i ) => ( {
				label: `Note ${ i + 1 }`,
				required: false,
			} ) );

		/**
		 * Render the create form with the given fields already configured.
		 *
		 * @param {Array} customerNotes - The customerNotes attribute.
		 * @return {object} Testing Library render result.
		 */
		const renderWith = customerNotes =>
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						customerNotes,
					} }
					setAttributes={ setAttributes }
				/>
			);

		it( 'seeds one empty field when the toggle is turned on', async () => {
			const user = userEvent.setup();
			renderWith( [] );

			await user.click( await screen.findByLabelText( 'Custom checkout fields' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				customerNotes: [ { label: '', required: false } ],
			} );
		} );

		it( 'empties the fields when the toggle is turned off', async () => {
			const user = userEvent.setup();
			renderWith( notes( 1 ) );

			await user.click( await screen.findByLabelText( 'Custom checkout fields' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { customerNotes: [] } );
		} );

		it( 'saves the label on the field it was typed in', async () => {
			const user = userEvent.setup();
			renderWith( notes( 2 ) );

			await user.type( await screen.findByLabelText( 'Field 2 label' ), 'X' );

			expect( setAttributes ).toHaveBeenCalledWith( {
				customerNotes: [
					{ label: 'Note 1', required: false },
					{ label: 'Note 2X', required: false },
				],
			} );
		} );

		// Every field carries the same 'Required' label, so the index is the only
		// thing saying which one was toggled.
		it( 'marks the right field required', async () => {
			const user = userEvent.setup();
			renderWith( notes( 2 ) );

			await user.click( ( await screen.findAllByLabelText( 'Required' ) )[ 1 ] );

			expect( setAttributes ).toHaveBeenCalledWith( {
				customerNotes: [
					{ label: 'Note 1', required: false },
					{ label: 'Note 2', required: true },
				],
			} );
		} );

		it( 'offers a second field while only one is configured', async () => {
			renderWith( notes( 1 ) );

			await expect( screen.findByText( 'Add field' ) ).resolves.toBeInTheDocument();
		} );

		it( 'stops offering more once two are configured', async () => {
			renderWith( notes( 2 ) );

			await expect( screen.findByLabelText( 'Field 2 label' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( 'Add field' ) ).not.toBeInTheDocument();
		} );

		it( 'adds the second field on Add field', async () => {
			const user = userEvent.setup();
			renderWith( notes( 1 ) );

			await user.click( await screen.findByText( 'Add field' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				customerNotes: [
					{ label: 'Note 1', required: false },
					{ label: '', required: false },
				],
			} );
		} );

		it( 'keeps a third field editable but offers no fourth', async () => {
			renderWith( notes( 3 ) );

			await expect( screen.findByLabelText( 'Field 3 label' ) ).resolves.toHaveValue( 'Note 3' );
			expect( screen.getByLabelText( 'Remove field 3' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Add field' ) ).not.toBeInTheDocument();
		} );

		it( 'offers the field again once one is removed', async () => {
			const user = userEvent.setup();
			const { rerender } = render(
				<Edit
					attributes={ { productName: 'Test Widget', customerNotes: notes( 2 ) } }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByLabelText( 'Remove field 2' ) ).resolves.toBeInTheDocument();
			await user.click( screen.getByLabelText( 'Remove field 2' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				customerNotes: [ { label: 'Note 1', required: false } ],
			} );

			rerender(
				<Edit
					attributes={ { productName: 'Test Widget', customerNotes: notes( 1 ) } }
					setAttributes={ setAttributes }
				/>
			);

			expect( screen.getByText( 'Add field' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Return URL', () => {
		const label = 'Return URL (optional)';
		const httpsOnly = 'Return URL must use HTTPS (e.g., https://example.com/thank-you).';
		const helpLine = 'Redirect customers here after payment.';

		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		/**
		 * Render the create form with a return URL already set.
		 *
		 * @param {string} returnUrl - The returnUrl attribute.
		 * @return {object} Testing Library render result.
		 */
		const renderWith = returnUrl =>
			render(
				<Edit
					attributes={ { productName: 'Test Widget', price: '29.99', returnUrl } }
					setAttributes={ setAttributes }
				/>
			);

		/**
		 * The control a message has to appear inside for the fix to mean anything.
		 *
		 * @return {object} Queries scoped to the return URL control.
		 */
		const urlControl = () => within( screen.getByTestId( `url-input-${ label }` ) );

		it( 'is a URL picker, not a plain text field', async () => {
			renderWith( '' );

			await expect( screen.findByTestId( `url-input-${ label }` ) ).resolves.toBeInTheDocument();
			expect( urlControl().getByText( helpLine ) ).toBeInTheDocument();
		} );

		// URLInput appends `__suggestions` to whatever className it gets, so a second
		// class in there silently breaks the suggestion list's width rule.
		it( 'hands URLInput exactly one class', async () => {
			renderWith( 'http://example.com' );

			await expect( screen.findByTestId( `url-input-${ label }` ) ).resolves.toHaveAttribute(
				'class',
				'jetpack-paypal-payment-buttons__return-url'
			);
		} );

		it( 'writes what the merchant types', async () => {
			const user = userEvent.setup();
			renderWith( '' );

			await user.type( await screen.findByLabelText( label ), 'h' );

			expect( setAttributes ).toHaveBeenCalledWith( { returnUrl: 'h' } );
		} );

		// People paste into this field, so a URL that is still being typed is not yet
		// wrong. Nothing is said until the merchant leaves the field.
		it( 'says nothing about HTTPS until the field is left', async () => {
			renderWith( 'http://example.com' );

			await expect( screen.findByLabelText( label ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( httpsOnly ) ).not.toBeInTheDocument();
			expect( urlControl().getByText( helpLine ) ).toBeInTheDocument();
		} );

		it( 'asks for HTTPS once the field is left', async () => {
			const user = userEvent.setup();
			renderWith( 'http://example.com' );

			await visit( user, await screen.findByLabelText( label ) );

			expect( urlControl().getByText( httpsOnly ) ).toBeInTheDocument();
			expect( screen.queryByText( helpLine ) ).not.toBeInTheDocument();
		} );

		it( 'accepts an HTTPS URL', async () => {
			const user = userEvent.setup();
			renderWith( 'https://example.com/thanks' );

			await visit( user, await screen.findByLabelText( label ) );

			expect( screen.queryByText( httpsOnly ) ).not.toBeInTheDocument();
			expect( urlControl().getByText( helpLine ) ).toBeInTheDocument();
		} );

		// A bad URL warns, it has never blocked saving.
		it( 'leaves Create enabled with a bad URL', async () => {
			const user = userEvent.setup();
			renderWith( 'http://example.com' );

			await visit( user, await screen.findByLabelText( label ) );

			expect( screen.getByText( 'Create New' ) ).toBeEnabled();
		} );
	} );

	describe( 'Product details', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		const details = () => within( panel( 'Details' ) );

		const formIsUp = async () => {
			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();
		};

		it( 'shows the product name error once the field is left', async () => {
			const user = userEvent.setup();
			renderForm( { productName: '' } );

			const field = await screen.findByLabelText( 'Product Name' );
			expect( screen.queryByText( 'Product name is required.' ) ).not.toBeInTheDocument();

			await visit( user, field );

			expect(
				control( 'Product Name' ).getByText( 'Product name is required.' )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'control-Product Name' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
		} );

		it( 'writes the price', async () => {
			const user = userEvent.setup();
			renderForm( { price: '' } );
			await formIsUp();

			await user.type( details().getByLabelText( 'Price' ), '9' );

			expect( setAttributes ).toHaveBeenCalledWith( { price: '9' } );
		} );

		it( 'shows the price error once the field is left', async () => {
			const user = userEvent.setup();
			renderForm( { price: '' } );
			await formIsUp();

			expect( screen.queryByText( 'Price is required.' ) ).not.toBeInTheDocument();

			await visit( user, details().getByLabelText( 'Price' ) );

			expect( control( 'Price' ).getByText( 'Price is required.' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'control-Price' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
		} );

		it( 'writes the currency', async () => {
			const user = userEvent.setup();
			renderForm( {} );
			await formIsUp();

			await user.selectOptions( details().getByLabelText( 'Currency' ), 'EUR' );

			expect( setAttributes ).toHaveBeenCalledWith( { currencyCode: 'EUR' } );
		} );

		// A currency the menu never offered can still reach the attribute, from a
		// paste or an older block. PayPal would reject it, so Create has to.
		it( 'refuses to create with a currency PayPal does not take', async () => {
			renderForm( { currencyCode: 'XYZ' } );

			await expect( screen.findByText( 'Create New' ) ).resolves.toBeDisabled();
		} );

		it( 'writes the description', async () => {
			const user = userEvent.setup();
			renderForm( {} );

			await user.type( await screen.findByLabelText( 'Description (optional)' ), 'G' );

			expect( setAttributes ).toHaveBeenCalledWith( { productDescription: 'G' } );
		} );

		it( 'shows the description error once the field is left', async () => {
			const user = userEvent.setup();
			const tooLong = 'Description must be 2048 characters or fewer.';
			renderForm( { productDescription: 'x'.repeat( 2049 ) } );

			const field = await screen.findByLabelText( 'Description (optional)' );
			expect( screen.queryByText( tooLong ) ).not.toBeInTheDocument();

			await visit( user, field );

			expect( control( 'Description (optional)' ).getByText( tooLong ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'control-Description (optional)' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
		} );

		it( 'saves the image the merchant chooses', async () => {
			const user = userEvent.setup();
			renderForm( {} );

			await user.click( await screen.findByText( 'Upload Image' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				imageUrl: 'https://example.com/chosen.png',
				imageId: 42,
			} );
		} );

		it( 'saves the replacement image', async () => {
			const user = userEvent.setup();
			renderForm( { imageUrl: 'https://example.com/previous.png', imageId: 7 } );

			await user.click( await screen.findByText( 'Replace' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				imageUrl: 'https://example.com/chosen.png',
				imageId: 42,
			} );
		} );

		it( 'clears the image the merchant removes', async () => {
			const user = userEvent.setup();
			renderForm( { imageUrl: 'https://example.com/previous.png', imageId: 7 } );
			await formIsUp();

			// Customer notes and option groups have Remove buttons of their own.
			await user.click( details().getByText( 'Remove' ) );

			// toStrictEqual, because an assertion that only calls for undefined
			// values would be met by setAttributes( {} ) too.
			expect( setAttributes.mock.lastCall[ 0 ] ).toStrictEqual( {
				imageUrl: undefined,
				imageId: undefined,
			} );
		} );
	} );

	// A key of validationErrors has to reach both the save gate and a control's `help`,
	// and the two are maintained separately. The keys come from the source rather than a
	// list kept here, so a new one that never reaches a `help` fails this suite.
	describe( 'Every validation error reaches the merchant', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		// getValidationErrors() reports every key on every call, so any input enumerates them.
		const errorKeys = Object.keys( getValidationErrors( {} ) );
		const blockingKeys = errorKeys.filter( key => ! ADVISORY_ERROR_KEYS.includes( key ) );

		// Per key: the block state that triggers it, the control its message has to be
		// inside, and the field to leave first where the form waits for a visit.
		const cases = {
			productName: {
				attributes: { productName: '' },
				testId: 'control-Product Name',
				message: 'Product name is required.',
				visit: 'Product Name',
			},
			price: {
				attributes: { price: '' },
				testId: 'control-Price',
				message: 'Price is required.',
				visit: 'Price',
			},
			productDescription: {
				attributes: { productDescription: 'x'.repeat( 2049 ) },
				testId: 'control-Description (optional)',
				message: 'Description must be 2048 characters or fewer.',
				visit: 'Description (optional)',
			},
			currencyCode: {
				attributes: { currencyCode: 'XYZ' },
				testId: 'control-Currency',
				message: 'Unsupported currency.',
			},
			taxValue: {
				attributes: { taxEnabled: true, taxType: 'PERCENTAGE', taxValue: '' },
				testId: 'control-Tax rate (%)',
				message: 'To continue, add the requested info or turn off this feature.',
			},
			returnUrl: {
				attributes: { returnUrl: 'http://example.com/thanks' },
				testId: 'url-input-Return URL (optional)',
				message: 'Return URL must use HTTPS (e.g., https://example.com/thank-you).',
				visit: 'Return URL (optional)',
			},
		};

		/**
		 * Render the form in the state one error describes, and hand back the control
		 * that error's message has to appear inside.
		 *
		 * @param {string} key - The validationErrors key under test.
		 * @return {Element} The control that has to be carrying the message.
		 */
		const showError = async key => {
			const user = userEvent.setup();
			const { attributes, testId, visit: visitLabel } = cases[ key ];

			renderForm( attributes );
			await expect( screen.findByText( 'Create New' ) ).resolves.toBeInTheDocument();

			if ( visitLabel ) {
				await visit( user, within( screen.getByTestId( testId ) ).getByLabelText( visitLabel ) );
			}

			return screen.getByTestId( testId );
		};

		// A new key with no case here fails on this line rather than going untested.
		it( 'has a case for every error the form can report', () => {
			expect( errorKeys.slice().sort() ).toEqual( Object.keys( cases ).sort() );
		} );

		it.each( blockingKeys )( 'says what is wrong when %s blocks the save', async key => {
			const field = await showError( key );

			expect( within( field ).getByText( cases[ key ].message ) ).toBeInTheDocument();
			expect( screen.getByText( 'Create New' ) ).toBeDisabled();
		} );

		// The other half of the split: these warn and the merchant can still save.
		it.each( ADVISORY_ERROR_KEYS )( 'warns about %s and still saves', async key => {
			const field = await showError( key );

			expect( within( field ).getByText( cases[ key ].message ) ).toBeInTheDocument();
			expect( screen.getByText( 'Create New' ) ).toBeEnabled();
		} );
	} );

	describe( 'Adjustable quantity', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		it( 'writes adjustable quantity when it is turned on', async () => {
			const user = userEvent.setup();
			renderForm( { adjustableQuantity: false } );

			await user.click( await screen.findByLabelText( 'Allow customers to adjust quantity' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { adjustableQuantity: true } );
		} );

		// maxQuantity is a number attribute, so the string the field hands back is
		// parsed before it is saved.
		it( 'writes the maximum quantity as a number', async () => {
			const user = userEvent.setup();
			renderForm( { adjustableQuantity: true } );

			await user.type( await screen.findByLabelText( 'Maximum quantity' ), '5' );

			expect( setAttributes ).toHaveBeenCalledWith( { maxQuantity: 5 } );
		} );

		// Emptying the box cannot leave the attribute empty, so it falls back to 10
		// rather than saving NaN.
		it( 'writes a maximum of 10 when the field is emptied', async () => {
			const user = userEvent.setup();
			renderForm( { adjustableQuantity: true, maxQuantity: 4 } );

			await user.clear( await screen.findByLabelText( 'Maximum quantity' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { maxQuantity: 10 } );
		} );
	} );

	describe( 'Button appearance', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		it( 'writes the button text', async () => {
			const user = userEvent.setup();
			renderForm( { buttonText: '' } );

			await user.type( await screen.findByLabelText( 'Button Text' ), 'B' );

			expect( setAttributes ).toHaveBeenCalledWith( { buttonText: 'B' } );
		} );

		it( 'writes the QR code setting when it is turned on', async () => {
			const user = userEvent.setup();
			renderForm( { showQrCode: false } );

			await user.click( await screen.findByLabelText( 'Show QR code' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { showQrCode: true } );
		} );

		// A block saved before the attribute existed has no value, and the QR code
		// shows anyway - so the toggle starts on and the click turns it off.
		it( 'shows the QR code when the attribute is unset', async () => {
			const user = userEvent.setup();
			renderForm( {} );

			const toggle = await screen.findByLabelText( 'Show QR code' );
			expect( toggle ).toBeChecked();

			await user.click( toggle );

			expect( setAttributes ).toHaveBeenCalledWith( { showQrCode: false } );
		} );
	} );

	describe( 'Form actions', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		const savedButton = {
			isApiManaged: true,
			resourceId: 'PLB-CANCEL1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-CANCEL1',
			productName: '',
		};

		/**
		 * Open a saved button's form and leave the name field, so its error shows.
		 *
		 * An empty name is the only visible sign that a field was marked touched.
		 *
		 * @param {object} user - userEvent instance.
		 */
		const editWithATouchedField = async user => {
			await user.click( await screen.findByTestId( 'toolbar-Edit' ) );
			await visit( user, screen.getByLabelText( 'Product Name' ) );
			expect( screen.getByText( 'Product name is required.' ) ).toBeInTheDocument();
		};

		it( 'returns a saved button to its preview on Cancel', async () => {
			const user = userEvent.setup();
			renderForm( savedButton );
			await editWithATouchedField( user );

			await user.click( screen.getByText( 'Cancel' ) );

			expect( screen.getByTestId( 'paypal-button-preview' ) ).toBeInTheDocument();
			// The saved button is the copy of record, so Cancel discards the edits
			// rather than writing them back.
			expect( setAttributes ).not.toHaveBeenCalled();
		} );

		it( 'forgets the touched fields when a saved button is cancelled', async () => {
			const user = userEvent.setup();
			renderForm( savedButton );
			await editWithATouchedField( user );

			await user.click( screen.getByText( 'Cancel' ) );
			await user.click( screen.getByTestId( 'toolbar-Edit' ) );

			expect( screen.queryByText( 'Product name is required.' ) ).not.toBeInTheDocument();
		} );

		// Nothing has been saved, so there is no preview to go back to - Cancel
		// empties the form instead, leaving a block the merchant can delete. The
		// values come from block.json, except the image and the options, which are
		// cleared outright.
		it( 'resets an unsaved form to the block defaults', async () => {
			const user = userEvent.setup();

			renderForm( {
				currencyCode: 'EUR',
				productDescription: 'A widget.',
				imageUrl: 'https://example.com/previous.png',
				imageId: 7,
				returnUrl: 'https://example.com/thanks',
				adjustableQuantity: true,
				maxQuantity: 4,
				customerNotes: [ { label: 'Gift message', required: false } ],
				taxEnabled: true,
				taxType: 'PERCENTAGE',
				taxValue: '8.25',
				buttonText: 'Pay up',
				showQrCode: false,
			} );

			await user.click( await screen.findByText( 'Cancel' ) );

			// toStrictEqual, so dropping the image and variant keys altogether -
			// the bug this reset exists to prevent - is not read as a match.
			expect( setAttributes.mock.lastCall[ 0 ] ).toStrictEqual( {
				productName: '',
				price: '',
				currencyCode: 'USD',
				productDescription: '',
				imageUrl: undefined,
				imageId: undefined,
				returnUrl: '',
				variantsEnabled: false,
				variants: undefined,
				adjustableQuantity: false,
				maxQuantity: 10,
				customerNotes: [],
				taxEnabled: false,
				taxType: 'PERCENTAGE',
				taxName: 'Sales Tax',
				taxValue: '',
				buttonText: 'Buy Now With PayPal',
				showQrCode: true,
			} );
		} );
	} );

	describe( 'Notices', () => {
		const saved = {
			isApiManaged: true,
			resourceId: 'PLB-NOTICE1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-NOTICE1',
		};

		/**
		 * Answer the connection check, and leave the rest of the routes to the test.
		 *
		 * @param {Function} respond - Answers every request but the connection check.
		 * @return {object} The apiFetch mock.
		 */
		const mockRoutes = respond =>
			apiFetch.mockImplementation( request =>
				request.path.endsWith( '/connection' )
					? Promise.resolve( { connected: true, environment: 'sandbox' } )
					: respond( request )
			);

		/**
		 * The one notice a test has put on screen.
		 *
		 * @return {Element} The notice element.
		 */
		const notice = () => screen.getByTestId( 'notice' );

		it( 'clears the success notice when it is dismissed', async () => {
			const user = userEvent.setup();
			const created = 'PayPal button and payment link created successfully!';
			mockRoutes( () =>
				Promise.resolve( { id: saved.resourceId, payment_link: saved.paymentLink } )
			);

			renderForm( {} );

			await user.click( await screen.findByText( 'Create New' ) );
			await expect( screen.findByText( created ) ).resolves.toBeInTheDocument();
			expect( notice() ).toHaveAttribute( 'data-status', 'success' );

			await user.click( screen.getByTestId( 'dismiss-notice' ) );

			expect( screen.queryByText( created ) ).not.toBeInTheDocument();
		} );

		it( 'clears the error notice when it is dismissed', async () => {
			const user = userEvent.setup();
			const refused = 'PayPal turned the payment down.';
			mockRoutes( () => Promise.reject( { message: refused } ) );

			renderForm( {} );

			await user.click( await screen.findByText( 'Create New' ) );
			await expect( screen.findByText( refused ) ).resolves.toBeInTheDocument();
			expect( notice() ).toHaveAttribute( 'data-status', 'error' );

			await user.click( screen.getByTestId( 'dismiss-notice' ) );

			expect( screen.queryByText( refused ) ).not.toBeInTheDocument();
		} );

		// A save drops the merchant back on the preview, so the notice it leaves
		// behind is a different one from the form's.
		it( 'clears the success notice on the preview when it is dismissed', async () => {
			const user = userEvent.setup();
			const updated = 'PayPal button updated successfully!';
			mockRoutes( ( { method } ) =>
				'PUT' === method
					? Promise.resolve( { payment_link: saved.paymentLink } )
					: Promise.resolve( {} )
			);

			renderForm( saved );

			await user.click( await screen.findByTestId( 'toolbar-Edit' ) );
			await user.click( screen.getByText( 'Save' ) );

			await expect( screen.findByText( updated ) ).resolves.toBeInTheDocument();
			expect( screen.getByTestId( 'paypal-button-preview' ) ).toBeInTheDocument();

			await user.click( screen.getByTestId( 'dismiss-notice' ) );

			expect( screen.queryByText( updated ) ).not.toBeInTheDocument();
		} );

		// A delete is refused without ever leaving the preview, so its error lands
		// there rather than on the form.
		it( 'clears the error notice on the preview when it is dismissed', async () => {
			const user = userEvent.setup();
			const refused = 'PayPal could not delete the payment.';
			mockRoutes( ( { method } ) =>
				'DELETE' === method ? Promise.reject( { message: refused } ) : Promise.resolve( {} )
			);

			renderForm( saved );

			await user.click( await screen.findByTestId( 'toolbar-Delete Payment Button' ) );
			await user.click( screen.getByTestId( 'confirm-dialog-confirm' ) );

			await expect( screen.findByText( refused ) ).resolves.toBeInTheDocument();
			expect( screen.getByTestId( 'paypal-button-preview' ) ).toBeInTheDocument();

			await user.click( screen.getByTestId( 'dismiss-notice' ) );

			expect( screen.queryByText( refused ) ).not.toBeInTheDocument();
		} );

		// A saved button keeps its preview while PayPal is disconnected, so the
		// notice is the merchant's only way back to the wizard.
		it( 'opens the reconnect wizard from the disconnected notice', async () => {
			const user = userEvent.setup();
			apiFetch.mockResolvedValue( { connected: false, environment: 'sandbox' } );

			renderForm( saved );

			// The preview carries the shared-link notice too, so the action has to
			// come out of the disconnected one.
			const disconnected = ( await screen.findAllByTestId( 'notice' ) ).find(
				body => body.getAttribute( 'data-status' ) === 'warning'
			);
			await user.click(
				within( disconnected ).getByRole( 'button', { name: 'Reconnect PayPal' } )
			);

			await expect( screen.findByText( /Get Your API Credentials/ ) ).resolves.toBeInTheDocument();
			expect( screen.queryByTestId( 'paypal-button-preview' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Updating a payment', () => {
		const attributes = {
			isApiManaged: true,
			resourceId: 'PLB-KEEP1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-KEEP1',
			productName: 'Test Widget',
			price: '29.99',
			currencyCode: 'USD',
			collectShippingAddress: false,
		};
		const resourcePath = '/wpcom/v2/paypal/buttons/PLB-KEEP1';

		// A payment configured beyond what the block form covers - set in PayPal's
		// own dashboard, or by the admin page.
		const storedLineItem = {
			name: 'Test Widget',
			unit_amount: { currency_code: 'USD', value: '29.99' },
			product_id: 'SKU-12345',
			shipping: [ { type: 'FLAT', value: '5.00', additional_unit_value: '2.00' } ],
			handling: [ { type: 'FLAT', value: '4.00' } ],
			discounts: [ { type: 'FLAT', value: '2.00' } ],
			// The block sends false, so a true in the PUT can only have come from
			// the payment.
			collect_shipping_address: true,
		};

		it( 'keeps the fields set outside the form', async () => {
			const user = userEvent.setup();

			apiFetch.mockImplementation( ( { path, method } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				if ( path === resourcePath && method === undefined ) {
					return Promise.resolve( { id: 'PLB-KEEP1', line_items: [ storedLineItem ] } );
				}
				return Promise.resolve( {} );
			} );

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await saveFromEditForm( user );

			await waitFor( () =>
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: resourcePath,
						method: 'PUT',
						data: expect.objectContaining( {
							line_items: [
								expect.objectContaining( {
									product_id: 'SKU-12345',
									shipping: storedLineItem.shipping,
									handling: storedLineItem.handling,
									discounts: storedLineItem.discounts,
									collect_shipping_address: true,
								} ),
							],
						} ),
					} )
				)
			);
		} );

		it( 'sends the form’s own values over the payment’s', async () => {
			const user = userEvent.setup();

			apiFetch.mockImplementation( ( { path, method } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				if ( path === resourcePath && method === undefined ) {
					return Promise.resolve( {
						id: 'PLB-KEEP1',
						line_items: [ { ...storedLineItem, name: 'Stale name' } ],
					} );
				}
				return Promise.resolve( {} );
			} );

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await saveFromEditForm( user );

			await waitFor( () =>
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						method: 'PUT',
						data: expect.objectContaining( {
							line_items: [ expect.objectContaining( { name: 'Test Widget' } ) ],
						} ),
					} )
				)
			);
		} );

		it( 're-creates a payment that has been deleted from PayPal', async () => {
			const user = userEvent.setup();

			apiFetch.mockImplementation( ( { path } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				if ( path === resourcePath ) {
					return Promise.reject( { code: 'paypal_api_resource_not_found', data: { status: 404 } } );
				}
				return Promise.resolve( {
					id: 'PLB-NEW1',
					payment_link: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
				} );
			} );

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await saveFromEditForm( user );

			await waitFor( () =>
				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( { resourceId: 'PLB-NEW1' } )
				)
			);
		} );
	} );

	describe( 'Preview Mode (connected, has button)', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		it( 'shows PayPal Connected status', async () => {
			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-TEST123',
						paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( 'PayPal Connected' ) ).resolves.toBeInTheDocument();
		} );

		it( 'shows sandbox badge when in sandbox mode', async () => {
			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-TEST123',
						paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByText( 'Sandbox' ) ).resolves.toBeInTheDocument();
		} );

		it( 'shows button preview when API-managed button exists', async () => {
			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-TEST123',
						paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						buttonType: 'stacked',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toBeInTheDocument();
		} );

		it( 'shows edit toolbar when button exists', async () => {
			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-TEST123',
						paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByTestId( 'toolbar-Edit' ) ).resolves.toBeInTheDocument();
			expect( screen.getByTestId( 'toolbar-Preview' ) ).toBeInTheDocument();
		} );

		it( 'switches back to the preview when the Preview toolbar button is clicked', async () => {
			const user = userEvent.setup();

			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-TEST123',
						paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await user.click( await screen.findByTestId( 'toolbar-Edit' ) );
			expect( screen.getByLabelText( 'Product Name' ) ).toBeInTheDocument();

			await user.click( screen.getByTestId( 'toolbar-Preview' ) );

			expect( screen.getByTestId( 'paypal-button-preview' ) ).toBeInTheDocument();
			expect( screen.queryByLabelText( 'Product Name' ) ).not.toBeInTheDocument();
		} );

		it( 'switches to edit mode when Edit toolbar button is clicked', async () => {
			const user = userEvent.setup();

			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-TEST123',
						paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByTestId( 'toolbar-Edit' ) ).resolves.toBeInTheDocument();
			const editButton = screen.getByTestId( 'toolbar-Edit' );
			await user.click( editButton );

			// Should now show the edit form.
			expect( screen.getByLabelText( 'Product Name' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Save' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'API Error Handling', () => {
		it( 'shows the API credentials instructions step when the connection check fails', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			// A failed check leaves partner referrals off, so the wizard opens on
			// the manual step instead of offering Connect with PayPal.
			await expect( screen.findByText( /Get Your API Credentials/ ) ).resolves.toBeInTheDocument();
		} );

		it( 'sends the dashboard link to the environment being connected', async () => {
			apiFetch.mockResolvedValue( {
				connected: false,
				environment: 'sandbox',
				partner_referrals_available: false,
			} );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			// Sandbox credentials only exist in the sandbox app list; the live
			// dashboard shows a different set of apps.
			const link = await screen.findByRole( 'button', { name: /Open PayPal Dashboard/ } );
			expect( link ).toHaveAttribute(
				'href',
				'https://developer.paypal.com/dashboard/applications/sandbox'
			);
		} );
	} );

	describe( 'Connection Check', () => {
		it( 'calls apiFetch to check connection on mount', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			// Wait for the connection check to settle. The default mock reports
			// no partner referrals, so the wizard opens on the manual step.
			await expect( screen.findByText( /Get Your API Credentials/ ) ).resolves.toBeInTheDocument();

			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/wpcom/v2/paypal/connection',
				} )
			);
		} );
	} );
} );
