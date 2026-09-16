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
	validateCustomerNotes,
	validateVariants,
	VARIANT_ERROR_FIELDS,
} from '../../../src/paypal-payment-buttons/components/variant-builder';
import Edit from '../../../src/paypal-payment-buttons/edit';
import {
	ADVISORY_ERROR_KEYS,
	getValidationErrors,
	REQUIRED_FIELD_ERROR,
} from '../../../src/paypal-payment-buttons/utils/validation';
// apiFetch mock — controls what the component receives from the REST API.
const apiFetch = require( '@wordpress/api-fetch' );
// Used by the control mocks below to id each instance.
const mockReact = require( 'react' );

// The API-managed editor only renders while the feature flag is on.
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: path => `https://example.test/wp-admin/${ path }`,
} ) );

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
		// The Copy button's hook comes from @wordpress/compose, which builds a
		// context at import time and reaches for useLayoutEffect when it runs.
		createContext: React.createContext,
		useState: React.useState,
		useEffect: React.useEffect,
		useLayoutEffect: React.useLayoutEffect,
		useCallback: React.useCallback,
		useMemo: React.useMemo,
		useRef: React.useRef,
		createInterpolateElement: jest.requireActual( '@wordpress/element' ).createInterpolateElement,
	};
} );

// The tax hint interpolates a Link into its sentence. The real Link sets no `rel`
// - eslint adds it here - so do not read this mock as proof of one.
jest.mock( '@wordpress/ui', () => ( {
	Link: ( { href, children, openInNewTab } ) => (
		<a
			href={ href }
			target={ openInNewTab ? '_blank' : undefined }
			data-testid="link"
			rel="noreferrer"
		>
			{ children }
		</a>
	),
} ) );

// Mock WordPress i18n.
jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	_x: text => text,
	sprintf: ( format, ...args ) => {
		let i = 0;
		return format.replace( /%[ds]/g, () => args[ i++ ] );
	},
} ) );

// jsdom has no 2D context, so the inspector's QR preview cannot really draw.
jest.mock( 'qrcode', () => ( {
	toCanvas: jest.fn( () => Promise.resolve() ),
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
	InspectorControls: ( { children, group } ) => (
		<div data-testid={ group ? `inspector-controls-${ group }` : 'inspector-controls' }>
			{ children }
		</div>
	),
	// Core reads the two colors and warns when the pair is unreadable. The real
	// one renders nothing until it has both, so the mock records what it was given.
	ContrastChecker: ( { textColor, backgroundColor } ) =>
		textColor && backgroundColor ? (
			<div
				data-testid="contrast-checker"
				data-text={ textColor }
				data-background={ backgroundColor }
			/>
		) : null,
	// Core's color panel is a labeled swatch row per setting, not a text field.
	// Keep the mock a button so a test can't type a color into a UI with no input.
	__experimentalColorGradientSettingsDropdown: ( { settings } ) => (
		<div data-testid="color-dropdown">
			{ ( settings || [] ).map( setting => (
				<button
					key={ setting.label }
					type="button"
					data-testid={ `color-${ setting.label }` }
					data-value={ setting.colorValue || '' }
					onClick={ () => setting.onColorChange( '#111111' ) }
				>
					{ setting.label }
				</button>
			) ) }
			{ /* The real control clears by calling onColorChange with no argument. */ }
			<button
				type="button"
				data-testid="color-clear"
				onClick={ () => ( settings || [] ).forEach( setting => setting.onColorChange() ) }
			>
				clear
			</button>
		</div>
	),
	__experimentalUseMultipleOriginColorsAndGradients: () => ( { colors: [], gradients: [] } ),
	// The real picker returns the size WITH its unit once the theme defines
	// font-size presets as strings, which block themes do, and undefined on reset.
	FontSizePicker: ( { value, onChange } ) => (
		<>
			<button type="button" data-testid="font-size" onClick={ () => onChange( '1.5rem' ) }>
				{ value || 'size' }
			</button>
			<button type="button" data-testid="font-size-reset" onClick={ () => onChange( undefined ) }>
				reset
			</button>
		</>
	),
	// Margin is core's axial spacing control; the test drives it by side.
	__experimentalSpacingSizesControl: ( { label, values, onChange } ) => (
		<div data-testid={ `spacing-${ label }` }>
			<button
				type="button"
				data-testid={ `spacing-${ label }-vertical` }
				onClick={ () => onChange( { ...values, top: '12px', bottom: '12px' } ) }
			>
				vertical
			</button>
		</div>
	),
	__experimentalBorderRadiusControl: ( { values, onChange } ) => (
		<button type="button" data-testid="border-radius" onClick={ () => onChange( '8px' ) }>
			{ values || 'radius' }
		</button>
	),
	// open() calls onSelect straight away so the block's handler runs.
	MediaUpload: ( { onSelect, render: renderProp } ) =>
		renderProp( { open: () => onSelect( mockSelectedMedia ) } ),
	MediaUploadCheck: ( { children } ) => <>{ children }</>,
	// Like TextControl, className and help sit on the BaseControl wrapper rather than
	// the input. URLInput has no onBlur - the form catches that on a wrapper of its
	// own. The testid deliberately differs from `control-` so a test can tell this
	// apart from the TextControl it replaced. Ids by label - Return URL renders once.
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
			{ help && <span className="components-base-control__help">{ help }</span> }
		</div>
	),
} ) );

// jsdom has no clipboard, so the real useCopyToClipboard never calls back and the
// "Copied!" state is unreachable. Stub the write and record what it was handed,
// so a Copy button wired to the wrong URL fails. The name has to start with
// `mock` for jest to allow the factory to reach it.
const mockCopiedText = { last: null };

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useCopyToClipboard: ( text, onCopy ) => node => {
		if ( node ) {
			node.addEventListener( 'click', () => {
				mockCopiedText.last = text;
				onCopy();
			} );
		}
	},
} ) );

// Mock WordPress components with simple HTML equivalents.
//
// A control drawn in a repeated row ids per instance with useId(), so each row's label
// points at its own input. Share one label-derived id and an index lookup lands on row
// one. A control that renders once ids by label.
jest.mock( '@wordpress/components', () => ( {
	BaseControl: {
		VisualLabel: ( { children } ) => (
			<span className="components-base-control__label">{ children }</span>
		),
	},
	// Only there to pad the suffix off the field edge; nothing asserts on it.
	__experimentalInputControlSuffixWrapper: ( { children } ) => <span>{ children }</span>,
	// Real InputControl renders its own BaseControl: className on the root, help in
	// .components-base-control__help - the class editor.scss keys on - and the label
	// tied to the input by a shared id. Mock that, not an aria-label, so a field with
	// no accessible name fails here.
	__experimentalInputControl: ( { label, value, onChange, suffix, help, className, ...rest } ) => {
		const id = `field-${ mockReact.useId() }`;
		return (
			<div
				data-testid={ `control-${ label }` }
				className={ [ 'components-input-control', className ].filter( Boolean ).join( ' ' ) }
			>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					value={ value ?? '' }
					onChange={ e => e.target.value !== value && onChange( e.target.value ) }
					{ ...rest }
				/>
				{ suffix }
				{ help && <span className="components-base-control__help">{ help }</span> }
			</div>
		);
	},
	// isDestructive, isSmall and the __next* opt-ins are destructured off rather
	// than spread: the real Button consumes them, so letting them reach the DOM warns.
	// `icon` and `label` are rendered instead: the real Button draws the icon and
	// turns `label` into aria-label. Spreading either one puts it on the DOM node raw.
	// forwardRef because the real one is — the Copy button hands it a ref. The
	// require is inline because jest hoists this factory above mockReact.
	Button: require( 'react' ).forwardRef(
		(
			{
				children,
				onClick,
				disabled,
				variant,
				isBusy,
				isDestructive,
				isSmall,
				size,
				icon,
				label,
				__next40pxDefaultSize,
				__nextHasNoMarginBottom,
				...rest
			},
			ref
		) => (
			<button
				ref={ ref }
				onClick={ onClick }
				disabled={ disabled }
				data-variant={ variant }
				data-busy={ isBusy }
				data-size={ size }
				aria-label={ label }
				{ ...rest }
			>
				{ typeof icon === 'function' ? mockReact.createElement( icon ) : icon }
				{ children }
			</button>
		)
	),
	ButtonGroup: ( { children } ) => <div data-testid="button-group">{ children }</div>,
	ExternalLink: ( { children, href } ) => (
		<a href={ href } target="_blank" rel="external noreferrer noopener">
			{ children }
		</a>
	),
	Modal: ( { children, title, onRequestClose } ) => (
		<div data-testid="modal" role="dialog" aria-label={ title }>
			{ children }
			<button data-testid="modal-close" onClick={ onRequestClose }>
				Close
			</button>
		</div>
	),
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
	SelectControl: ( { label, value, options, onChange, help, className, disabled } ) => (
		<div data-testid={ `control-${ label }` } className={ className }>
			<select
				aria-label={ label }
				value={ value }
				disabled={ disabled }
				onChange={ e => onChange( e.target.value ) }
			>
				{ options &&
					options.map( opt => (
						<option key={ opt.value } value={ opt.value }>
							{ opt.label }
						</option>
					) ) }
			</select>
			{ help && <span className="components-base-control__help">{ help }</span> }
		</div>
	),
	// Takes and returns the whole option, and falls back to the first when the value
	// matches none, both like the real one. The hint rides on `data-hint` because an
	// <option> cannot hold the span core draws it in.
	CustomSelectControl: ( { label, value, options, onChange, disabled, className } ) => (
		<div
			data-testid={ `control-${ label }` }
			className={ className }
			// The value as the caller passed it, before the fallback below, so a test
			// can tell the block's own fallback from this mock's.
			data-value={ value?.key ?? '' }
		>
			<select
				aria-label={ label }
				value={ ( options?.find( o => o.key === value?.key ) ?? options?.[ 0 ] )?.key ?? '' }
				disabled={ disabled }
				onChange={ e =>
					onChange( { selectedItem: options.find( o => o.key === e.target.value ) } )
				}
			>
				{ options &&
					options.map( opt => (
						<option key={ opt.key } value={ opt.key } data-hint={ opt.hint }>
							{ opt.name }
						</option>
					) ) }
			</select>
		</div>
	),
	Spinner: () => <div data-testid="spinner">Loading...</div>,
	SearchControl: ( { label, value, onChange, placeholder } ) => (
		<input
			type="search"
			aria-label={ label }
			placeholder={ placeholder }
			value={ value }
			onChange={ e => onChange( e.target.value ) }
		/>
	),
	// Ids per instance - the notes repeat the 'Required' label.
	CheckboxControl: ( { label, checked, onChange, help, disabled } ) => {
		const id = `checkbox-${ mockReact.useId() }`;
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
	TextControl: ( {
		label,
		value,
		onChange,
		onBlur,
		type,
		help,
		className,
		hideLabelFromVision,
		// The real TextControl consumes these; spreading them onto the input warns.
		__next40pxDefaultSize,
		__nextHasNoMarginBottom,
		...rest
	} ) => {
		// Ids per instance - the notes repeat 'Customer note label', the groups repeat
		// 'Variant name' and the options repeat 'Price'.
		const id = `field-${ mockReact.useId() }`;
		return (
			<div data-testid={ `control-${ label }` } className={ className }>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					aria-label={ label }
					value={ value || '' }
					onChange={ e => onChange( e.target.value ) }
					onBlur={ onBlur }
					type={ type || 'text' }
					{ ...rest }
				/>
				{ help && <span className="components-base-control__help">{ help }</span> }
			</div>
		);
	},
	// Ids by label - Description (optional) renders once.
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
			{ help && <span className="components-base-control__help">{ help }</span> }
		</div>
	),
	ToolbarButton: ( { label, onClick } ) => (
		<button data-testid={ `toolbar-${ label }` } onClick={ onClick }>
			{ label }
		</button>
	),
	ToolbarGroup: ( { children } ) => <div data-testid="toolbar-group">{ children }</div>,
	// The real BorderControl returns width, style and color as one value.
	BorderControl: ( { label, value, onChange } ) => (
		<button
			type="button"
			data-testid={ `border-${ label }` }
			onClick={ () => onChange( { ...value, width: '2px', color: '#ff0000' } ) }
		>
			stroke
		</button>
	),
	// The panels only group controls, so they render as their contents under a
	// testid named for the label.
	// Reset All is the panel's own menu item in the real control, so the mock
	// exposes it as a button — without it the panel's resetAll never runs and a
	// test cannot tell a one-key reset from an all-keys one.
	__experimentalToolsPanel: ( { children, label, resetAll } ) => (
		<div data-testid={ `tools-panel-${ label }` }>
			<button type="button" data-testid="tools-panel-reset" onClick={ () => resetAll() }>
				reset all
			</button>
			{ children }
		</div>
	),
	__experimentalToolsPanelItem: ( { children } ) => <>{ children }</>,
	// Ids by label - Custom width renders once.
	__experimentalUnitControl: ( { label, value, onChange } ) => (
		<div data-testid={ `unit-${ label }` }>
			<label htmlFor={ `unit-field-${ label }` }>{ label }</label>
			<input
				id={ `unit-field-${ label }` }
				type="text"
				value={ value ?? '' }
				onChange={ e => onChange( e.target.value ) }
			/>
		</div>
	),
	__experimentalToggleGroupControl: ( { children, label, value, onChange } ) => {
		// Required here rather than imported: the factory is hoisted above the
		// module body, so a top-level binding is still undefined when it runs.
		const { Children, cloneElement } = require( 'react' );
		return (
			<div data-testid={ `toggle-group-${ label }` } data-value={ value }>
				{ Children.map( children, child =>
					child ? cloneElement( child, { onSelect: onChange } ) : null
				) }
			</div>
		);
	},
	__experimentalToggleGroupControlOption: ( { value, label, onSelect } ) => (
		<button type="button" onClick={ () => onSelect( value ) }>
			{ label }
		</button>
	),
} ) );

// Mock PayPal button preview component.
jest.mock( '../../../src/paypal-payment-buttons/components/paypal-button-preview', () => {
	return function MockPayPalButtonPreview( props ) {
		return (
			<div
				data-testid="paypal-button-preview"
				data-product-name={ props.productName }
				data-format={ props.format }
			>
				Preview: { props.productName } - { props.price } { props.currencyCode }
			</div>
		);
	};
} );

describe( 'PayPalPaymentButtonsEdit (V2)', () => {
	const setAttributes = jest.fn();

	// The sidebar says what the post save will do with the payment.
	const createdOnSave =
		'The payment button is created on PayPal when you save or publish the post.';
	const updatedOnSave = 'Changes are sent to PayPal when you save the post.';
	const heldBack =
		'Complete the highlighted fields. Until then the button is not sent to PayPal when you save.';

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
	 * The <p> a converted select renders its profile hint into.
	 *
	 * CustomSelectControl has no help slot, so the hint is a sibling rather than
	 * something the control owns. One shows at a time.
	 *
	 * @return {Element} The hint element.
	 */
	const fieldHint = () =>
		screen.getByText( ( _text, element ) =>
			element?.classList?.contains( 'jetpack-paypal-payment-buttons__field-hint' )
		);

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

	beforeEach( () => {
		jest.clearAllMocks();
		// One test runs on fake timers; leaving them on hangs every test after it.
		jest.useRealTimers();
		mockCopiedText.last = null;
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

		it( 'puts the wizard in the sidebar and a placeholder on the canvas', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect(
				screen.findByRole( 'heading', { name: 'PayPal Payment Button', level: 4 } )
			).resolves.toBeInTheDocument();
			expect(
				screen.getByText( 'Log in to or create a PayPal business account to use payment buttons' )
			).toBeInTheDocument();

			const sidebar = within( screen.getByTestId( 'inspector-controls' ) );
			expect(
				sidebar.getByRole( 'button', { name: /I have my credentials/i } )
			).toBeInTheDocument();
			expect(
				sidebar.queryByRole( 'heading', { name: 'PayPal Payment Button' } )
			).not.toBeInTheDocument();
		} );

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

	describe( 'Connect PayPal (Partner Referrals)', () => {
		/**
		 * Reply to the connection check with platform mode, so the welcome step
		 * with the "Connect PayPal" flow renders.
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
		 * Stop jsdom acting on the connect anchor's click.
		 *
		 * The anchor points at PayPal, so a real click on it makes jsdom log
		 * "Not implemented: navigation to another Document". The listener runs
		 * before the default action, and dies with the frame it is attached to.
		 *
		 * @param {HTMLIFrameElement} frame - The frame the anchor lives in.
		 * @return {HTMLIFrameElement} The same frame.
		 */
		function blockFrameNavigation( frame ) {
			frame.contentDocument.addEventListener( 'click', event => event.preventDefault() );
			return frame;
		}

		/**
		 * Get onto the welcome step and open the onboarding frame.
		 *
		 * @return {Promise<HTMLIFrameElement>} The frame PayPal's SDK runs in.
		 */
		async function openOnboardingFrame() {
			const user = userEvent.setup();
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await user.click( await screen.findByRole( 'button', { name: /Connect PayPal/i } ) );
			return blockFrameNavigation( await screen.findByTitle( 'PayPal onboarding' ) );
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
				/* eslint-disable-next-line testing-library/no-unnecessary-act --
				   The hook flips isSdkReady on the microtask after the attribute
				   change, which lands once waitFor has put the act environment back. */
				await act( async () => {
					/* eslint-disable testing-library/no-node-access -- The anchor is in
					   the frame's document, out of reach of screen queries. */
					await waitFor( () =>
						expect(
							frame.contentDocument.querySelector( 'a[data-paypal-button]' )
						).not.toHaveAttribute( 'target' )
					);
					/* eslint-enable testing-library/no-node-access */
				} );
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
			const frame = blockFrameNavigation( await screen.findByTitle( 'PayPal onboarding' ) );
			await settlePartnerScript( frame );
			const click = jest.spyOn( await findConnectLink( frame ), 'click' );

			expect( frame ).not.toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

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

		it( 'leads with the connect copy and the environment toggle in the sidebar', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/bizsignup/partner/entry' } );
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			const sidebar = within( await screen.findByTestId( 'inspector-controls' ) );
			// The button says "Connecting…" while the referral link is pre-fetched.
			await expect(
				sidebar.findByRole( 'button', { name: 'Connect PayPal' } )
			).resolves.toBeInTheDocument();
			expect(
				sidebar.getByRole( 'heading', { name: 'Connect your PayPal account' } )
			).toBeInTheDocument();
			expect(
				sidebar.getByText( 'Create a link or button directly in the editor - no code required' )
			).toBeInTheDocument();
			expect( sidebar.getByLabelText( 'Use sandbox (testing)' ) ).toBeInTheDocument();
		} );

		it( 'keeps the onboarding frame on the canvas, outside the sidebar', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );
			await openOnboardingFrame();

			expect( screen.getByTitle( 'PayPal onboarding' ) ).toBeInTheDocument();
			expect(
				within( screen.getByTestId( 'inspector-controls' ) ).queryByTitle( 'PayPal onboarding' )
			).not.toBeInTheDocument();
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
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await settlePartnerScript( frame );

			expect( signupLinkCalls() ).toHaveLength( 2 );
			expect( click ).not.toHaveBeenCalled();
			expect( frame ).not.toHaveClass( 'jetpack-paypal-onboarding-frame--active' );

			// The frame is there now, so it is in the set of same-origin frames
			// this click stamps its user activation on.
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

			expect( click ).toHaveBeenCalledTimes( 1 );
			expect( frame ).toHaveClass( 'jetpack-paypal-onboarding-frame--active' );
		} );

		it( 'does not open PayPal when the script loads without the SDK', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

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
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );
			await settlePartnerScript( await screen.findByTitle( 'PayPal onboarding' ) );

			expect( click ).not.toHaveBeenCalled();

			// The next one opens PayPal, which is what the notice promised.
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

			expect( click ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'drops the request when the merchant leaves the welcome step', async () => {
			const user = userEvent.setup();
			const click = watchAnchorClicks();
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			const frame = await screen.findByTitle( 'PayPal onboarding' );
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

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
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

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
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

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
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
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

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();

			await user.click( screen.getByRole( 'button', { name: /Disconnect PayPal/i } ) );
			await user.click( screen.getByTestId( 'confirm-dialog-confirm' ) );

			await expect(
				screen.findByRole( 'button', { name: /Connect PayPal/i } )
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

			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

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
			await user.click( screen.getByRole( 'button', { name: /Connect PayPal/i } ) );

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
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
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
				screen.findByRole( 'button', { name: /Connect PayPal/i } )
			).resolves.toBeVisible();

			// The SDK resolves the callback off `window` by name, so it cannot be
			// a closure passed to the script.
			expect( typeof window.jetpackPayPalOnboardComplete ).toBe( 'function' );
		} );

		it( 'exchanges the auth code when the SDK reports completion', async () => {
			mockPlatformMode( { action_url: 'https://www.sandbox.paypal.com/merchantsignup/x' } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await expect(
				screen.findByRole( 'button', { name: /Connect PayPal/i } )
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
			await user.click( await screen.findByRole( 'button', { name: /Connect PayPal/i } ) );

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

		it( 'asks again when the merchant clicks Connect PayPal after a failure', async () => {
			const user = userEvent.setup();
			mockPlatformMode( { reject: new Error( 'Could not create a PayPal onboarding link.' ) } );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );
			await user.click( await screen.findByRole( 'button', { name: /Connect PayPal/i } ) );

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

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
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

		it( 'calls setAttributes when the product id changes', async () => {
			const user = userEvent.setup();

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			const idInput = await screen.findByLabelText( 'Product ID (optional)' );
			await user.type( idInput, 'S' );

			expect( setAttributes ).toHaveBeenCalledWith( { productId: 'S' } );
			// The field caps the id, and the server answers a longer one with
			// product_id_too_long.
			expect( idInput ).toHaveAttribute( 'maxlength', '50' );
		} );

		it( 'holds the payment back while the form is invalid', async () => {
			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		it( 'creates the payment on save once the required fields are filled', async () => {
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

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect( screen.getByText( createdOnSave ) ).toBeInTheDocument();
		} );

		it( 'holds the payment back when the description is too long', async () => {
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

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
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

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect( screen.getByText( createdOnSave ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Existing links step', () => {
		const listPath = '/wpcom/v2/paypal/buttons?page_size=100';

		/**
		 * A payment resource as the list route returns it.
		 *
		 * @param {string} id     - Resource id.
		 * @param {string} name   - Product name.
		 * @param {object} extras - Line item fields to add.
		 * @return {object} The resource.
		 */
		const resource = ( id, name, extras = {} ) => ( {
			id,
			create_time: '2026-09-01T10:00:00Z',
			payment_link: `https://www.paypal.com/ncp/payment/${ id }`,
			line_items: [ { name, unit_amount: { value: '12.00', currency_code: 'USD' }, ...extras } ],
		} );

		/**
		 * Reply connected, with these links on the account.
		 *
		 * @param {Array}  links      - Resources the list route returns.
		 * @param {object} attributes - What reading one link back returns.
		 */
		const mockLinks = ( links, attributes = {} ) => {
			apiFetch.mockImplementation( ( { path } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				if ( path === listPath ) {
					return Promise.resolve( { resources: links } );
				}
				if ( path.includes( '/buttons/PLB-' ) ) {
					return Promise.resolve( { attributes } );
				}
				return Promise.resolve( {} );
			} );
		};

		it( 'is skipped when the account has no links', async () => {
			mockLinks( [] );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Create new' } ) ).not.toBeInTheDocument();
		} );

		it( 'holds the form back until the listing is in', async () => {
			let resolveList;
			apiFetch.mockImplementation( ( { path } ) =>
				path === listPath
					? new Promise( resolve => {
							resolveList = resolve;
					  } )
					: Promise.resolve( { connected: true, environment: 'sandbox' } )
			);

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			// The connection check has a spinner of its own, so wait for the step's panel.
			await waitFor( () => expect( panel( 'Payment link' ) ).toBeDefined() );
			expect( within( panel( 'Payment link' ) ).getByTestId( 'spinner' ) ).toBeInTheDocument();
			expect( screen.queryByLabelText( 'Product Name' ) ).not.toBeInTheDocument();

			await act( async () => resolveList( { resources: [] } ) );

			expect( screen.getByLabelText( 'Product Name' ) ).toBeInTheDocument();
		} );

		it( 'is skipped when the listing fails', async () => {
			apiFetch.mockImplementation( ( { path } ) =>
				path === listPath
					? Promise.reject( new Error( 'down' ) )
					: Promise.resolve( { connected: true, environment: 'sandbox' } )
			);

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
		} );

		it( 'offers Create new and the links, with price and date, instead of the form', async () => {
			mockLinks( [
				resource( 'PLB-A1', 'Croissant' ),
				resource( 'PLB-B2', 'Baguette', {
					unit_amount: undefined,
					variants: {
						dimensions: [
							{
								name: 'Size',
								options: [
									{ label: 'Small', unit_amount: { value: '3.50', currency_code: 'EUR' } },
									{ label: 'Large', unit_amount: { value: '2.50', currency_code: 'EUR' } },
								],
							},
						],
					},
				} ),
			] );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await expect(
				screen.findByRole( 'button', { name: 'Create new' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByLabelText( 'Product Name' ) ).not.toBeInTheDocument();
			expect( screen.queryByLabelText( 'Search payment links' ) ).not.toBeInTheDocument();

			const croissant = screen.getByRole( 'button', { name: /Croissant/ } );
			expect( croissant ).toHaveTextContent( '$12.00' );
			expect( croissant ).toHaveTextContent( '2026' );
			expect( screen.getByRole( 'button', { name: /Baguette/ } ) ).toHaveTextContent(
				'From €2.50'
			);
			expect(
				screen.getByText(
					'Choose a payment link you already have, or create a new one, in the block settings.'
				)
			).toBeInTheDocument();
		} );

		it( 'goes on to the empty form on Create new', async () => {
			const user = userEvent.setup();
			mockLinks( [ resource( 'PLB-A1', 'Croissant' ) ] );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await user.click( await screen.findByRole( 'button', { name: 'Create new' } ) );

			expect( screen.getByLabelText( 'Product Name' ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Create new' } ) ).not.toBeInTheDocument();
			expect( setAttributes ).not.toHaveBeenCalled();
		} );

		it( 'points the block at a picked link with what PayPal holds for it', async () => {
			const user = userEvent.setup();
			mockLinks( [ resource( 'PLB-A1', 'Croissant' ) ], {
				isApiManaged: true,
				resourceId: 'PLB-A1',
				paymentLink: 'https://www.paypal.com/ncp/payment/PLB-A1',
				productName: 'Croissant',
				price: '12.00',
				currencyCode: 'USD',
			} );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await user.click( await screen.findByRole( 'button', { name: /Croissant/ } ) );

			await waitFor( () =>
				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						isApiManaged: true,
						resourceId: 'PLB-A1',
						paymentLink: 'https://www.paypal.com/ncp/payment/PLB-A1',
						productName: 'Croissant',
						price: '12.00',
					} )
				)
			);
		} );

		it( 'shows the failure when a picked link cannot be read back', async () => {
			const user = userEvent.setup();
			apiFetch.mockImplementation( ( { path } ) => {
				if ( path === listPath ) {
					return Promise.resolve( { resources: [ resource( 'PLB-A1', 'Croissant' ) ] } );
				}
				if ( path.includes( '/buttons/PLB-' ) ) {
					return Promise.reject( { message: 'PayPal is unavailable' } );
				}
				return Promise.resolve( { connected: true, environment: 'sandbox' } );
			} );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			await user.click( await screen.findByRole( 'button', { name: /Croissant/ } ) );

			await expect( screen.findByText( /PayPal is unavailable/ ) ).resolves.toBeInTheDocument();
			expect( setAttributes ).not.toHaveBeenCalled();
		} );

		it( 'searches by name, description and price once there are more than ten links', async () => {
			const user = userEvent.setup();
			const links = Array.from( { length: 11 }, ( _, i ) =>
				resource( `PLB-L${ i }`, `Loaf ${ i }`, { description: i === 3 ? 'Sourdough' : '' } )
			);
			links[ 5 ].line_items[ 0 ].unit_amount.value = '99.00';
			mockLinks( links );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			const search = await screen.findByLabelText( 'Search payment links' );
			expect( screen.getAllByRole( 'button', { name: /Loaf/ } ) ).toHaveLength( 11 );

			await user.type( search, 'loaf 1' );
			expect( screen.getAllByRole( 'button', { name: /Loaf/ } ) ).toHaveLength( 2 );

			await user.clear( search );
			await user.type( search, 'sour' );
			expect( screen.getByRole( 'button', { name: /Loaf 3/ } ) ).toBeInTheDocument();
			expect( screen.getAllByRole( 'button', { name: /Loaf/ } ) ).toHaveLength( 1 );

			await user.clear( search );
			await user.type( search, '99.00' );
			expect( screen.getByRole( 'button', { name: /Loaf 5/ } ) ).toBeInTheDocument();
			expect( screen.getAllByRole( 'button', { name: /Loaf/ } ) ).toHaveLength( 1 );

			await user.clear( search );
			await user.type( search, 'brioche' );
			expect( screen.getByText( 'No payment links match your search.' ) ).toBeInTheDocument();
		} );

		it( 'is not offered to a block that already has a product typed in', async () => {
			mockLinks( [ resource( 'PLB-A1', 'Croissant' ) ] );

			render( <Edit attributes={ { productName: 'Draft' } } setAttributes={ setAttributes } /> );

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Create new' } ) ).not.toBeInTheDocument();
			expect( apiFetch.mock.calls.some( ( [ { path } ] ) => path === listPath ) ).toBe( false );
		} );

		it( 'is not offered to a block that already has a link', async () => {
			mockLinks( [ resource( 'PLB-A1', 'Croissant' ) ] );

			renderForm( {
				isApiManaged: true,
				resourceId: 'PLB-A1',
				paymentLink: 'https://www.paypal.com/ncp/payment/PLB-A1',
			} );

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Create new' } ) ).not.toBeInTheDocument();
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
						// Invalid, and now unreachable - it must not hold the payment back.
						price: '0',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: variantsWithPrices( [ '10.00', '20.00' ] ),
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect( screen.getByText( createdOnSave ) ).toBeInTheDocument();
		} );

		it( 'holds the payment back on the options once their prices are cleared', async () => {
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

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();

			rerender(
				<Edit
					attributes={ { ...attributes, variants: variantsWithPrices( [ '', '' ] ) } }
					setAttributes={ setAttributes }
				/>
			);

			// Pricing stays on, so the product price field stays away and the options
			// themselves carry the error rather than handing it back to a hidden field.
			expect( details().queryByLabelText( 'Price' ) ).not.toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
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

		it( 'gives every option row a key when the payment carries none', async () => {
			// The resource-sync diff compares variants with _key stripped, so a block
			// that already agrees with the payment on content keeps its _key-less
			// options and never goes through the backfill.
			render(
				<Edit
					attributes={ {
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						variantsEnabled: true,
						variants: {
							dimensions: [
								{
									_key: 'grp-1',
									name: 'Size',
									primary: false,
									options: [ { label: 'Small' }, { label: 'Large' } ],
								},
							],
						},
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect( screen.findByLabelText( 'Option 1' ) ).resolves.toHaveValue( 'Small' );
			expect( screen.getByLabelText( 'Option 2' ) ).toHaveValue( 'Large' );
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
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
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
			// The payment is held back from the first render, with nothing on screen saying why.
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
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
			// A 404 on the read leaves the payment alone: no error, just the
			// save-status notice and a warning that the link is gone.
			expect(
				screen.queryAllByTestId( 'notice' ).map( n => n.getAttribute( 'data-status' ) )
			).toEqual( [ 'info', 'warning' ] );
			// The shared-link line is inspector text, not a notice.
			expect(
				screen.getByText( 'Changes made will apply to all payment buttons with this link.' )
			).toHaveClass( 'jetpack-paypal-payment-buttons__shared-link-note' );
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
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
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

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
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
		 * Wait for the form, which renders once the connection check resolves.
		 */
		async function waitForForm() {
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
		}

		it( 'offers no tax name to fill in', async () => {
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await waitForForm();

			expect( screen.queryByLabelText( 'Tax name' ) ).not.toBeInTheDocument();
			expect( screen.getByLabelText( 'Tax rate' ) ).toBeInTheDocument();
		} );

		// The value field appears as soon as Add tax is on, so the error shows straight
		// away rather than waiting for a blur. A flat amount was never validated before -
		// only PERCENTAGE was.
		it.each( [
			[ 'no rate at all', { taxValue: '' } ],
			[ 'a flat amount and no value', { taxType: 'FLAT', taxValue: '' } ],
			[ 'no type and no value', { taxType: '', taxValue: '' } ],
		] )( 'refuses to save tax with %s', async ( _label, overrides ) => {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, ...overrides } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();

			expect( screen.getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'control-Tax rate' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'true' );
		} );

		// PayPal's own form takes a 0 rate, saves it and reads it back. A merchant who
		// wants no tax turns the toggle off instead.
		it.each( [
			[ 'a rate of zero', { taxType: 'PERCENTAGE', taxValue: '0' } ],
			[ 'a flat amount of zero', { taxType: 'FLAT', taxValue: '0' } ],
		] )( 'saves tax with %s', async ( _label, overrides ) => {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, ...overrides } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();

			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
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
			await waitForForm();
			await user.click( screen.getByLabelText( 'Add tax' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { taxEnabled: true } );
		} );

		// Tax type shows a mode; taxType holds the wire value. Flipping back to a specific
		// rate picks PERCENTAGE rather than the merchant's last specific type, which would
		// need a second attribute to remember.
		// Switching to profile also drops the rate: PayPal reads a profile tax back with
		// no value, so a leftover one makes the block disagree with the payment and the
		// next mount reports it as a change made at PayPal.
		it.each( [
			[ 'profile', 'PERCENTAGE', { taxType: 'PREFERENCE', taxValue: '' } ],
			[ 'specific', 'PREFERENCE', { taxType: 'PERCENTAGE' } ],
		] )( 'maps the %s tax type back to the wire value', async ( mode, from, written ) => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType: from } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();
			await user.selectOptions( screen.getByLabelText( 'Tax type' ), mode );

			expect( setAttributes ).toHaveBeenCalledWith( written );
		} );

		// Clearing the field writes '' rather than dropping the attribute, which would
		// read back as the block.json default on the next mount.
		it( 'writes an empty string when the field is cleared', async () => {
			const user = userEvent.setup();
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await waitForForm();
			await user.clear( screen.getByLabelText( 'Tax rate' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { taxValue: '' } );
		} );

		/**
		 * Render the tax field in one attribute state and hand it back.
		 *
		 * @param {object} overrides - Attributes to merge over the tax fixture.
		 * @return {Promise<Element>} The tax value input.
		 */
		async function taxField( overrides ) {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, ...overrides } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();

			return screen.getByLabelText( 'Tax rate' );
		}

		// A percentage steps in hundredths whatever the currency; an amount is money,
		// so it follows the currency - JPY takes no decimals at all.
		it.each( [
			[ 'a percentage', { taxType: 'PERCENTAGE' }, '0.01' ],
			[ 'a flat amount', { taxType: 'FLAT' }, '0.01' ],
			[ 'a flat amount in JPY', { taxType: 'FLAT', currencyCode: 'JPY', price: '2000' }, '1' ],
		] )( 'steps the field for %s', async ( _label, overrides, step ) => {
			const field = await taxField( overrides );

			expect( field ).toHaveAttribute( 'step', step );
		} );

		// The affordance. validatePercentage is what gates the save.
		it( 'caps a percentage at 99.99', async () => {
			const field = await taxField( { taxType: 'PERCENTAGE' } );

			expect( field ).toHaveAttribute( 'max', '99.99' );
		} );

		// Renders the currency error, which a validator test leaves invisible.
		it( 'refuses a flat amount with decimals in a currency that has none', async () => {
			await taxField( { taxType: 'FLAT', currencyCode: 'JPY', price: '2000', taxValue: '1.50' } );

			expect(
				screen.getByText( 'Prices in JPY are whole numbers (e.g., "1500").' )
			).toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		it( 'refuses a rate of 100% or more', async () => {
			await taxField( { taxType: 'PERCENTAGE', taxValue: '150' } );

			expect( screen.getByText( 'Rate must be less than 100%.' ) ).toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		// A flat amount must not inherit the percentage ceiling - $150 of tax is legal.
		it( 'puts no ceiling on a flat amount', async () => {
			const field = await taxField( { taxType: 'FLAT' } );

			expect( field ).not.toHaveAttribute( 'max' );
		} );

		it.each( [
			[ 'PERCENTAGE', 'FLAT' ],
			[ 'FLAT', 'PERCENTAGE' ],
		] )( 'clears the rate when the rate type goes %s -> %s', async ( from, to ) => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType: from } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();
			await user.selectOptions( screen.getByLabelText( 'Rate type' ), to );

			expect( setAttributes ).toHaveBeenCalledWith( { taxType: to, taxValue: '' } );
		} );

		// The mockup shows a $, so check the suffix follows the product's currency
		// rather than being hardcoded.
		it( 'shows a percent sign on a rate', async () => {
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await waitForForm();

			expect(
				within( screen.getByTestId( 'control-Tax rate' ) ).getByText( '%' )
			).toBeInTheDocument();
		} );

		it( 'shows the currency symbol on a flat amount', async () => {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType: 'FLAT', currencyCode: 'EUR' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();

			expect(
				within( screen.getByTestId( 'control-Tax rate' ) ).getByText( '\u20AC' )
			).toBeInTheDocument();
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
			await waitForForm();
			await user.type( screen.getByLabelText( 'Tax rate' ), '8' );

			expect( setAttributes ).toHaveBeenCalledWith( { taxValue: '8' } );
		} );

		it.each( [
			[ 'a rate', { taxType: 'PERCENTAGE', taxValue: '8.25' } ],
			[ 'a flat amount', { taxType: 'FLAT', taxValue: '1.50' } ],
		] )( 'saves %s that is filled in', async ( _label, overrides ) => {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, ...overrides } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();

			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'control-Tax rate' ) ).not.toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'false' );
		} );

		// PREFERENCE is the one type with nothing local to fill in - the rate lives in the
		// merchant's PayPal profile, so the form sends them there instead of asking.
		it( 'asks for no rate when PayPal keeps the rate', async () => {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType: 'PREFERENCE', taxValue: '' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();

			expect( screen.queryByLabelText( 'Rate type' ) ).not.toBeInTheDocument();
			expect( screen.queryByLabelText( 'Tax rate' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
			const link = screen.getByTestId( 'link' );

			expect( link ).toHaveAttribute(
				'href',
				'https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_profile-sales-tax'
			);
			// The post may be unsaved, so this must not navigate away from it.
			expect( link ).toHaveAttribute( 'target', '_blank' );
		} );

		it.each( [
			[ 'production', 'production' ],
			[ 'an unknown environment', undefined ],
		] )( 'sends %s to the production tax settings', async ( _label, environment ) => {
			apiFetch.mockResolvedValue( { connected: true, environment } );

			render(
				<Edit
					attributes={ { ...attributes, taxType: 'PREFERENCE', taxValue: '' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();

			expect( screen.getByTestId( 'link' ) ).toHaveAttribute(
				'href',
				'https://www.paypal.com/cgi-bin/webscr?cmd=_profile-sales-tax'
			);
		} );

		it( 'puts the field and menu classes on both tax selects', async () => {
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await waitForForm();

			// The stylesheet keys the input treatment off __field and the menu off
			// __select-menu.
			[ 'control-Tax type', 'control-Rate type', 'control-Tax rate' ].forEach( testId =>
				expect( screen.getByTestId( testId ) ).toHaveClass(
					'jetpack-paypal-payment-buttons__field'
				)
			);
			expect( screen.getByTestId( 'control-Tax type' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__select-menu'
			);
			expect( screen.getByTestId( 'control-Rate type' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__select-menu'
			);
		} );

		// CustomSelectControl reads `name` where SelectControl read `label`, and the
		// old shape renders every option blank.
		it( 'shows the option labels in both tax selects', async () => {
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await waitForForm();
			const typeOptions = within( screen.getByTestId( 'control-Tax type' ) ).getAllByRole(
				'option'
			);
			const rateOptions = within( screen.getByTestId( 'control-Rate type' ) ).getAllByRole(
				'option'
			);

			expect( typeOptions.map( o => o.textContent ) ).toEqual( [
				'Use tax from my PayPal settings',
				'Use a specific tax rate',
			] );
			expect( rateOptions.map( o => o.textContent ) ).toEqual( [ 'Percentage', 'Amount' ] );
		} );

		// data-value holds what the block passed, ahead of the mock's own fallback,
		// so a raw string shows up here as an empty attribute.
		it( 'passes each tax select the whole option object', async () => {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType: 'FLAT' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();

			expect( screen.getByTestId( 'control-Tax type' ) ).toHaveAttribute(
				'data-value',
				'specific'
			);
			// FLAT is the second option, so only the real value produces it.
			expect( screen.getByTestId( 'control-Rate type' ) ).toHaveAttribute( 'data-value', 'FLAT' );
			expect( screen.getByLabelText( 'Rate type' ) ).toHaveValue( 'FLAT' );
		} );

		// The mapper stores whatever rate type PayPal sent, so the control falls
		// back to the first option and stays controlled.
		it( 'falls back to the first rate type for an unknown tax type', async () => {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType: 'TIERED' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();

			expect( screen.getByTestId( 'control-Rate type' ) ).toHaveAttribute(
				'data-value',
				'PERCENTAGE'
			);
		} );

		it( 'renders the tax profile hint beside the select', async () => {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, taxType: 'PREFERENCE', taxValue: '' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await waitForForm();
			const hint = fieldHint();

			expect( hint ).toContainElement( screen.getByTestId( 'link' ) );
			// The class is how the select hands its bottom margin to the hint.
			expect( screen.getByTestId( 'control-Tax type' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-hint'
			);
		} );

		it( 'hides the tax profile hint when a specific rate is set', async () => {
			mockConnected();

			render( <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="a" /> );
			await waitForForm();

			expect( screen.queryByTestId( 'link' ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'control-Tax type' ) ).not.toHaveClass(
				'jetpack-paypal-payment-buttons__has-hint'
			);
		} );

		// PayPal renders its own label to the buyer, so the merchant's string goes
		// nowhere - and requiring one threw the whole tax away.
		// A payment made in PayPal's dashboard can have one. Sending an empty name
		// back would overwrite it, so the key rides along only when there is one.
	} );

	describe( 'Handling fee', () => {
		const resourcePath = '/wpcom/v2/paypal/buttons/PLB-FEE1';
		const attributes = {
			isApiManaged: true,
			resourceId: 'PLB-FEE1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-FEE1',
			productName: 'Test Widget',
			price: '29.99',
			currencyCode: 'USD',
			handlingEnabled: true,
			handlingValue: '4.00',
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
					return Promise.resolve( { id: 'PLB-FEE1', line_items: [ {} ] } );
				}
				return Promise.resolve( {} );
			} );
		}

		/**
		 * Render the editor with the handling-fee fixture, plus any overrides.
		 *
		 * @param {object} overrides - Attributes to merge over the fixture.
		 */
		async function renderFee( overrides = {} ) {
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, ...overrides } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
		}

		it( 'asks for no amount while the fee is off', async () => {
			await renderFee( { handlingEnabled: false, handlingValue: '' } );

			expect( screen.queryByLabelText( 'Handling fee' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
		} );

		// The amount field appears as soon as the toggle is on, so the error shows
		// straight away rather than waiting for a blur.
		it( 'refuses to save a fee with no amount', async () => {
			await renderFee( { handlingValue: '' } );

			expect( screen.getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'control-Handling fee' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'true' );
		} );

		// Same rule as the tax: PayPal stores a 0 and hands it back, and a merchant
		// who wants no fee turns the toggle off instead.
		it( 'saves a fee of zero', async () => {
			await renderFee( { handlingValue: '0' } );

			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'control-Handling fee' ) ).not.toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'false' );
		} );

		it( 'turns the handling fee on', async () => {
			const user = userEvent.setup();
			await renderFee( { handlingEnabled: false, handlingValue: '' } );
			await user.click( screen.getByLabelText( 'Add handling fee' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { handlingEnabled: true } );
		} );

		it( 'writes the amount', async () => {
			const user = userEvent.setup();
			await renderFee( { handlingValue: '' } );
			await user.type( screen.getByLabelText( 'Handling fee' ), '4' );

			expect( setAttributes ).toHaveBeenCalledWith( { handlingValue: '4' } );
		} );

		// Clearing the field writes '' rather than dropping the attribute, which would
		// read back as the block.json default on the next mount.
		it( 'writes an empty string when the field is cleared', async () => {
			const user = userEvent.setup();
			await renderFee();
			await user.clear( screen.getByLabelText( 'Handling fee' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { handlingValue: '' } );
		} );

		// A fee is money, so it follows the currency - JPY takes no decimals at all.
		it.each( [
			[ 'USD', {}, '0.01' ],
			[ 'JPY', { currencyCode: 'JPY', price: '2000' }, '1' ],
		] )( 'steps the field for %s', async ( _label, overrides, step ) => {
			await renderFee( overrides );

			expect( screen.getByLabelText( 'Handling fee' ) ).toHaveAttribute( 'step', step );
		} );

		// A fee is money, so it must not inherit the tax field's percentage ceiling -
		// a $150 handling fee is legal.
		it( 'takes any fee from zero up', async () => {
			await renderFee();
			const field = screen.getByLabelText( 'Handling fee' );

			expect( field ).toHaveAttribute( 'min', '0' );
			expect( field ).not.toHaveAttribute( 'max' );
		} );

		// Renders the currency error, which a validator test leaves invisible.
		it( 'refuses a decimal amount in a currency that has none', async () => {
			await renderFee( { currencyCode: 'JPY', price: '2000', handlingValue: '1.50' } );

			expect(
				screen.getByText( 'Prices in JPY are whole numbers (e.g., "1500").' )
			).toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		// The mockup shows a $, so check the suffix follows the product's currency
		// rather than being hardcoded.
		it( 'shows the currency symbol', async () => {
			await renderFee( { currencyCode: 'EUR' } );

			expect(
				within( screen.getByTestId( 'control-Handling fee' ) ).getByText( '€' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Shipping', () => {
		const resourcePath = '/wpcom/v2/paypal/buttons/PLB-SHIP1';
		const attributes = {
			isApiManaged: true,
			resourceId: 'PLB-SHIP1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-SHIP1',
			productName: 'Test Widget',
			price: '29.99',
			currencyCode: 'USD',
			shippingEnabled: true,
			shippingMode: 'FLAT',
			shippingValue: '5.00',
		};

		/**
		 * Mock the connection check and the block's mount read.
		 *
		 * @param {string} environment - The environment the connection reports.
		 */
		function mockConnected( environment = 'sandbox' ) {
			apiFetch.mockImplementation( ( { path, method } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment } );
				}
				if ( path === resourcePath && method === undefined ) {
					return Promise.resolve( { id: 'PLB-SHIP1', line_items: [ {} ] } );
				}
				return Promise.resolve( {} );
			} );
		}

		/**
		 * Render the editor with the shipping fixture, plus any overrides.
		 *
		 * @param {object} overrides   - Attributes to merge over the fixture.
		 * @param {string} environment - The environment the connection reports.
		 */
		async function renderShipping( overrides = {}, environment = 'sandbox' ) {
			mockConnected( environment );

			render(
				<Edit
					attributes={ { ...attributes, ...overrides } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
		}

		it( 'shows the toggle alone while shipping is off', async () => {
			await renderShipping( { shippingEnabled: false, shippingValue: '' } );

			expect( screen.queryByLabelText( 'Shipping fee' ) ).not.toBeInTheDocument();
			expect( screen.queryByLabelText( 'Collect shipping address' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
		} );

		// The design nests the checkbox under the toggle, so it rides every mode.
		it.each( [ 'PROFILE', 'QUANTITY', 'FLAT', 'FREE' ] )(
			'offers the address checkbox in %s mode',
			async shippingMode => {
				await renderShipping( { shippingMode } );

				expect( screen.getByLabelText( 'Collect shipping address' ) ).toBeInTheDocument();
			}
		);

		it.each( [
			[ 'PROFILE', 'Use shipping from my PayPal settings' ],
			[ 'FREE', 'Free shipping' ],
		] )( 'asks for no amount in %s mode', async ( shippingMode, label ) => {
			await renderShipping( { shippingMode, shippingValue: '' } );

			// PROFILE is the first option, so the mock's fallback reaches it too -
			// data-value is what tells a real value from that fallback.
			expect( screen.getByTestId( 'control-Shipping fee' ) ).toHaveAttribute(
				'data-value',
				shippingMode
			);
			expect( screen.getByLabelText( 'Shipping fee' ) ).toHaveValue( shippingMode );
			expect( screen.getByRole( 'option', { name: label } ) ).toBeInTheDocument();
			expect( screen.queryByLabelText( 'Enter shipping fee' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
		} );

		it( 'links to PayPal in profile mode', async () => {
			await renderShipping( { shippingMode: 'PROFILE', shippingValue: '' } );

			expect(
				screen.getByRole( 'link', { name: 'Set up or manage shipping settings' } )
			).toHaveAttribute(
				'href',
				'https://www.sandbox.paypal.com/cgi-bin/customerprofileweb?cmd=_profile-shipping'
			);
		} );

		it.each( [ 'QUANTITY', 'FLAT', 'FREE' ] )(
			'keeps the link to profile mode, not %s',
			async shippingMode => {
				await renderShipping( { shippingMode } );

				expect(
					screen.queryByRole( 'link', { name: 'Set up or manage shipping settings' } )
				).not.toBeInTheDocument();
			}
		);

		// An environment the connection has not reported yet points at production, so
		// the link never sends a live merchant to the sandbox.
		it( 'falls back to the production settings page', async () => {
			await renderShipping( { shippingMode: 'PROFILE', shippingValue: '' }, null );

			expect(
				screen.getByRole( 'link', { name: 'Set up or manage shipping settings' } )
			).toHaveAttribute(
				'href',
				'https://www.paypal.com/cgi-bin/customerprofileweb?cmd=_profile-shipping'
			);
		} );

		it( 'offers the four modes in the order the design lists them', async () => {
			await renderShipping();

			expect(
				[ ...screen.getByLabelText( 'Shipping fee' ).options ].map( o => o.textContent )
			).toEqual( [
				'Use shipping from my PayPal settings',
				'Use quantity-based shipping fee',
				'Use specific shipping fee',
				'Free shipping',
			] );
		} );

		it( 'puts the field and menu classes on the shipping select', async () => {
			await renderShipping();

			expect( screen.getByTestId( 'control-Shipping fee' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__field',
				'jetpack-paypal-payment-buttons__select-menu'
			);
			expect( screen.getByTestId( 'control-Enter shipping fee' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__field'
			);
		} );

		// FLAT is the second mode, so only the real value produces it.
		it( 'passes the shipping select the whole option object', async () => {
			await renderShipping();

			expect( screen.getByTestId( 'control-Shipping fee' ) ).toHaveAttribute(
				'data-value',
				'FLAT'
			);
		} );

		it( 'keeps the shipping select margin when the hint is hidden', async () => {
			await renderShipping();

			expect( screen.getByTestId( 'control-Shipping fee' ) ).not.toHaveClass(
				'jetpack-paypal-payment-buttons__has-hint'
			);
		} );

		it( 'falls back to PROFILE for an unknown shipping mode', async () => {
			await renderShipping( { shippingMode: 'PICKUP', shippingValue: '' } );

			expect( screen.getByTestId( 'control-Shipping fee' ) ).toHaveAttribute(
				'data-value',
				'PROFILE'
			);
		} );

		it( 'renders the shipping profile hint beside the select', async () => {
			await renderShipping( { shippingMode: 'PROFILE', shippingValue: '' } );
			const hint = fieldHint();

			expect( hint ).toContainElement( screen.getByTestId( 'link' ) );
			expect( screen.getByTestId( 'control-Shipping fee' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-hint'
			);
		} );

		// Every attribute a toggle hides goes back to its block.json default, so the
		// next mount's read-back agrees with a payment that carries none of it.
		it( 'resets the tax fields to their defaults when tax goes off', async () => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ {
						...attributes,
						taxEnabled: true,
						taxType: 'FLAT',
						taxName: 'VAT',
						taxValue: '1.50',
					} }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();

			await user.click( screen.getByLabelText( 'Add tax' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				taxEnabled: false,
				taxType: 'PERCENTAGE',
				taxName: 'Sales Tax',
				taxValue: '',
			} );
		} );

		it( 'resets the handling fee to its default when the fee goes off', async () => {
			const user = userEvent.setup();
			mockConnected();

			render(
				<Edit
					attributes={ { ...attributes, handlingEnabled: true, handlingValue: '4.00' } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();

			await user.click( screen.getByLabelText( 'Add handling fee' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				handlingEnabled: false,
				handlingValue: '',
			} );
		} );

		it( 'turns shipping on without touching anything else', async () => {
			const user = userEvent.setup();
			await renderShipping( { shippingEnabled: false, shippingValue: '' } );

			await user.click( screen.getByLabelText( 'Add shipping' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { shippingEnabled: true } );
		} );

		it( 'asks for one amount in specific-fee mode', async () => {
			await renderShipping();

			expect( screen.getByLabelText( 'Enter shipping fee' ) ).toHaveValue( 5 );
			expect( screen.queryByLabelText( 'Additional items (optional)' ) ).not.toBeInTheDocument();
		} );

		it( 'asks for two amounts in quantity-based mode', async () => {
			await renderShipping( { shippingMode: 'QUANTITY', shippingAdditionalValue: '2.00' } );

			expect( screen.getByLabelText( 'Shipping fee for first item' ) ).toHaveValue( 5 );
			expect( screen.getByLabelText( 'Additional items (optional)' ) ).toHaveValue( 2 );
		} );

		it( 'refuses to save a fee mode with no amount', async () => {
			await renderShipping( { shippingValue: '' } );

			expect( screen.getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'control-Enter shipping fee' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'true' );
		} );

		// The second amount is optional even here - PayPal only requires the first.
		it( 'saves quantity-based shipping with no per-extra-item fee', async () => {
			await renderShipping( { shippingMode: 'QUANTITY', shippingAdditionalValue: '' } );

			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
		} );

		it( 'saves a fee of zero', async () => {
			await renderShipping( { shippingValue: '0' } );

			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
		} );

		// The fee fields are gone in the two preference modes, so a leftover amount
		// would never be seen again while the read-back forces it blank.
		it.each( [ 'PROFILE', 'FREE' ] )(
			'clears both amounts on the way to %s',
			async shippingMode => {
				const user = userEvent.setup();
				await renderShipping( { shippingMode: 'QUANTITY', shippingAdditionalValue: '2.00' } );

				await user.selectOptions( screen.getByLabelText( 'Shipping fee' ), shippingMode );

				expect( setAttributes ).toHaveBeenCalledWith( {
					shippingMode,
					shippingValue: '',
					shippingAdditionalValue: '',
				} );
			}
		);

		// Every mode clears exactly the fields it does not show. A fee left behind
		// its own field is a permanent diff against the read-back.
		it.each( [
			[ 'QUANTITY', { shippingMode: 'QUANTITY' } ],
			[ 'FLAT', { shippingMode: 'FLAT', shippingAdditionalValue: '' } ],
		] )( 'switching to %s keeps the fee it still shows', async ( shippingMode, expected ) => {
			const user = userEvent.setup();
			await renderShipping( { shippingMode: 'QUANTITY', shippingAdditionalValue: '2.00' } );

			await user.selectOptions( screen.getByLabelText( 'Shipping fee' ), shippingMode );

			expect( setAttributes ).toHaveBeenCalledWith( expected );
		} );

		// The three attributes have to go with the toggle. Left behind, the next
		// mount's read-back reports PayPal as having changed the button.
		// The toggle hides the address checkbox too, so it resets with the rest.
		it( 'resets every shipping field to its default when shipping goes off', async () => {
			const user = userEvent.setup();
			await renderShipping( {
				shippingMode: 'QUANTITY',
				shippingAdditionalValue: '2.00',
				collectShippingAddress: true,
			} );

			await user.click( screen.getByLabelText( 'Add shipping' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				shippingEnabled: false,
				shippingMode: 'FLAT',
				shippingValue: '',
				shippingAdditionalValue: '',
				collectShippingAddress: false,
			} );
		} );

		it( 'writes the address preference when the box is ticked', async () => {
			const user = userEvent.setup();
			await renderShipping();

			await user.click( screen.getByLabelText( 'Collect shipping address' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { collectShippingAddress: true } );
		} );

		it.each( [
			[ 'Enter shipping fee', 'FLAT', 'shippingValue' ],
			[ 'Additional items (optional)', 'QUANTITY', 'shippingAdditionalValue' ],
		] )( 'writes %s', async ( label, shippingMode, attribute ) => {
			const user = userEvent.setup();
			await renderShipping( { shippingMode, shippingValue: '', shippingAdditionalValue: '' } );

			await user.type( screen.getByLabelText( label ), '7' );

			expect( setAttributes ).toHaveBeenCalledWith( { [ attribute ]: '7' } );
		} );

		// JPY takes no decimals, so the spinner must not offer one.
		it( 'steps both fees by the currency', async () => {
			await renderShipping( { shippingMode: 'QUANTITY', currencyCode: 'JPY' } );

			expect( screen.getByLabelText( 'Shipping fee for first item' ) ).toHaveAttribute(
				'step',
				'1'
			);
			expect( screen.getByLabelText( 'Additional items (optional)' ) ).toHaveAttribute(
				'step',
				'1'
			);
		} );

		// Both fees are on screen, so each row names its own control and the assertion
		// points at one of them.
		it.each( [
			[ 'Shipping fee for first item', { shippingValue: '5.50' } ],
			[ 'Additional items (optional)', { shippingAdditionalValue: '2.50' } ],
		] )( 'refuses decimals on %s in a currency that has none', async ( label, overrides ) => {
			await renderShipping( {
				shippingMode: 'QUANTITY',
				currencyCode: 'JPY',
				price: '2000',
				shippingValue: '500',
				...overrides,
			} );

			const field = screen.getByTestId( `control-${ label }` );

			expect(
				within( field ).getByText( 'Prices in JPY are whole numbers (e.g., "1500").' )
			).toBeInTheDocument();
			expect( field ).toHaveClass( 'jetpack-paypal-payment-buttons__has-error' );
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		it( 'shows the currency symbol on the fee', async () => {
			await renderShipping( { currencyCode: 'EUR' } );

			expect( control( 'Enter shipping fee' ).getByText( '\u20AC' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Discount', () => {
		const resourcePath = '/wpcom/v2/paypal/buttons/PLB-DISC1';
		const attributes = {
			isApiManaged: true,
			resourceId: 'PLB-DISC1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-DISC1',
			productName: 'Test Widget',
			price: '29.99',
			currencyCode: 'USD',
			discountEnabled: true,
			discountType: 'FLAT',
			discountValue: '2.00',
		};

		/**
		 * Render the editor with the discount fixture, plus any overrides.
		 *
		 * @param {object} overrides - Attributes to merge over the fixture.
		 */
		async function renderDiscount( overrides = {} ) {
			apiFetch.mockImplementation( ( { path, method } ) => {
				if ( path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				if ( path === resourcePath && method === undefined ) {
					return Promise.resolve( { id: 'PLB-DISC1', line_items: [ {} ] } );
				}
				return Promise.resolve( {} );
			} );

			render(
				<Edit
					attributes={ { ...attributes, ...overrides } }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
		}

		const standingHint = 'Reduced from the product price';

		it( 'asks for nothing while the discount is off', async () => {
			await renderDiscount( { discountEnabled: false, discountValue: '' } );

			expect( screen.queryByLabelText( 'Discount type' ) ).not.toBeInTheDocument();
			expect( screen.queryByLabelText( 'Discount value' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
		} );

		it( 'turns the discount on', async () => {
			const user = userEvent.setup();
			await renderDiscount( { discountEnabled: false, discountValue: '' } );
			await user.click( screen.getByLabelText( 'Add discount' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { discountEnabled: true } );
		} );

		// A value left behind reads as a difference against the payment on the next
		// mount, and the reconcile reports PayPal as having changed the button.
		it( 'clears the type and the value when the discount goes off', async () => {
			const user = userEvent.setup();
			await renderDiscount( { discountType: 'PERCENTAGE', discountValue: '15' } );
			await user.click( screen.getByLabelText( 'Add discount' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				discountEnabled: false,
				discountType: 'FLAT',
				discountValue: '',
			} );
		} );

		// It hands back the whole option, so the handler reads .key off it. The value
		// goes too: 2 kept across a switch turns $2 off into 2% off, and both are legal.
		it( 'writes the type as PayPal’s own value and clears the amount', async () => {
			const user = userEvent.setup();
			await renderDiscount();
			await user.selectOptions( screen.getByLabelText( 'Discount type' ), 'PERCENTAGE' );

			expect( setAttributes ).toHaveBeenCalledWith( {
				discountType: 'PERCENTAGE',
				discountValue: '',
			} );
		} );

		it( 'writes the value', async () => {
			const user = userEvent.setup();
			await renderDiscount( { discountValue: '' } );
			await user.type( screen.getByLabelText( 'Discount value' ), '2' );

			expect( setAttributes ).toHaveBeenCalledWith( { discountValue: '2' } );
		} );

		// Clearing writes '' rather than dropping the attribute, which would read
		// back as the block.json default on the next mount.
		it( 'writes an empty string when the field is cleared', async () => {
			const user = userEvent.setup();
			await renderDiscount();
			await user.clear( screen.getByLabelText( 'Discount value' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { discountValue: '' } );
		} );

		// editor.scss hangs the menu styling off this class. jsdom cannot check more.
		it( 'puts the menu class on the type picker', async () => {
			await renderDiscount();

			expect( screen.getByTestId( 'control-Discount type' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__select-menu'
			);
		} );

		// It takes the whole option as its value, not the key.
		it( 'shows the type the block is set to', async () => {
			await renderDiscount( { discountType: 'PERCENTAGE' } );

			expect( screen.getByLabelText( 'Discount type' ) ).toHaveValue( 'PERCENTAGE' );
		} );

		// The second line is why this is not a plain SelectControl.
		it( 'describes each type under its name', async () => {
			await renderDiscount();
			const options = within( screen.getByTestId( 'control-Discount type' ) ).getAllByRole(
				'option'
			);

			expect( options.map( o => o.textContent ) ).toEqual( [ 'Amount off', 'Percentage' ] );
			// The second line core draws from the hint. The mock carries it on an
			// attribute because an <option> cannot hold the span the real one uses.
			expect( options.map( o => o.dataset.hint ) ).toEqual( [
				'Fixed amount off the price',
				'Percentage based on price',
			] );
		} );

		// The mapper stores a type PayPal sent even when the block has no option for
		// it, so the block falls back to the first option rather than the control.
		it( 'shows the first type for one the block does not model', async () => {
			await renderDiscount( { discountType: 'TIERED', discountValue: '5' } );

			// data-value is what the block passed, so this fails if its fallback goes.
			expect( screen.getByTestId( 'control-Discount type' ) ).toHaveAttribute(
				'data-value',
				'FLAT'
			);
			expect( screen.getByLabelText( 'Discount type' ) ).toHaveValue( 'FLAT' );
		} );

		// The inspector and the post-save gate each compute the price a flat discount
		// is measured against. With per-option pricing there is no product price, so
		// it is the cheapest option - not the 29.99 still sitting in `price`.
		it( 'measures a flat discount against the cheapest option price', async () => {
			const variants = {
				dimensions: [
					{
						name: 'Size',
						primary: true,
						options: [
							{ label: 'S', unit_amount: { currency_code: 'USD', value: '10.00' } },
							{ label: 'L', unit_amount: { currency_code: 'USD', value: '20.00' } },
						],
					},
				],
			};

			await renderDiscount( { variantsEnabled: true, variants, discountValue: '15.00' } );

			expect(
				screen.getByText( 'Discount must be less than the product price.' )
			).toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		it( 'refuses to save a discount with no value', async () => {
			await renderDiscount( { discountValue: '' } );

			expect( screen.getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
			// editor.scss reddens the error row through this class, so without it the
			// message renders grey and the assertion above still passes.
			expect( screen.getByTestId( 'control-Discount value' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'true' );
		} );

		// The design draws both rows at once - the hint stays grey above the error
		// rather than being replaced by it, which is what every other field here does.
		it( 'keeps the standing hint while the error is up', async () => {
			await renderDiscount( { discountValue: '' } );
			const field = screen.getByTestId( 'control-Discount value' );

			expect( within( field ).getByText( standingHint ) ).toBeInTheDocument();
			expect( within( field ).getByText( REQUIRED_FIELD_ERROR ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__field-error'
			);
		} );

		it( 'shows the hint on its own when the value is good', async () => {
			await renderDiscount();
			const field = screen.getByTestId( 'control-Discount value' );

			expect( within( field ).getByText( standingHint ) ).toBeInTheDocument();
			expect( within( field ).queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( field ).not.toHaveClass( 'jetpack-paypal-payment-buttons__has-error' );
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
		} );

		// Measured: 422 DISCOUNT_EXCEEDS_ITEM_PRICE at equal, so this is strictly less.
		it( 'refuses a flat discount that reaches the price', async () => {
			await renderDiscount( { discountValue: '29.99' } );

			expect(
				screen.getByText( 'Discount must be less than the product price.' )
			).toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		// A percentage is not money, so the price comparison must not apply to it -
		// 50 is fine against a 29.99 product.
		it( 'takes a percentage above the product price', async () => {
			await renderDiscount( { discountType: 'PERCENTAGE', discountValue: '50' } );

			expect(
				screen.queryByText( 'Discount must be less than the product price.' )
			).not.toBeInTheDocument();
			expect( screen.getByText( updatedOnSave ) ).toBeInTheDocument();
		} );

		it( 'refuses a percentage of 100', async () => {
			await renderDiscount( { discountType: 'PERCENTAGE', discountValue: '100' } );

			expect( screen.getByText( 'Discount must be between 1% and 99%.' ) ).toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		// PayPal takes a whole-number percentage only, so the form says so rather than
		// letting the save fail against the API.
		it( 'refuses a percentage with decimals', async () => {
			await renderDiscount( { discountType: 'PERCENTAGE', discountValue: '15.5' } );

			expect(
				screen.getByText( 'Discount percentage must be a whole number.' )
			).toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		// Zero is not a discount - PayPal rejects it for both types - so the merchant
		// is pointed back at the toggle, which is what the shared string says.
		it.each( [
			[ 'a percentage', 'PERCENTAGE' ],
			[ 'an amount', 'FLAT' ],
		] )( 'refuses %s of zero', async ( _label, discountType ) => {
			await renderDiscount( { discountType, discountValue: '0' } );

			expect( screen.getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		// The unit follows the type; a flat step and floor still follow the currency,
		// a percentage is 1 either way because it is not money.
		it.each( [
			[ 'a flat amount', { currencyCode: 'EUR', discountValue: '2.00' }, '€', '0.01', '0.01' ],
			[
				'a flat amount in JPY',
				{ currencyCode: 'JPY', price: '2000', discountValue: '200' },
				'¥',
				'1',
				'1',
			],
			[
				'a percentage in JPY',
				{ discountType: 'PERCENTAGE', currencyCode: 'JPY', discountValue: '15' },
				'%',
				'1',
				'1',
			],
		] )(
			'shows the right unit, step and floor for %s',
			async ( _label, overrides, unit, step, min ) => {
				await renderDiscount( overrides );
				const field = screen.getByLabelText( 'Discount value' );

				expect(
					within( screen.getByTestId( 'control-Discount value' ) ).getByText( unit )
				).toBeInTheDocument();
				expect( field ).toHaveAttribute( 'step', step );
				expect( field ).toHaveAttribute( 'min', min );
			}
		);

		// Renders the currency error, which a validator test leaves invisible.
		it( 'refuses a decimal amount in a currency that has none', async () => {
			await renderDiscount( { currencyCode: 'JPY', price: '2000', discountValue: '1.50' } );

			expect(
				screen.getByText( 'Prices in JPY are whole numbers (e.g., "1500").' )
			).toBeInTheDocument();
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		// A percentage has a ceiling the control can offer - measured, 99 takes and
		// 100 does not.
		it( 'caps a percentage at 99', async () => {
			await renderDiscount( { discountType: 'PERCENTAGE', discountValue: '15' } );

			expect( screen.getByLabelText( 'Discount value' ) ).toHaveAttribute( 'max', '99' );
		} );

		// An amount does not - a $150 discount off a $200 product is legal, so the
		// field must not inherit the percentage ceiling.
		it( 'puts no ceiling on an amount', async () => {
			await renderDiscount();

			expect( screen.getByLabelText( 'Discount value' ) ).not.toHaveAttribute( 'max' );
		} );
	} );

	describe( 'Add customer note', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		/**
		 * Build a customer notes attribute with one labelled note per row.
		 *
		 * @param {number} count - How many notes to configure.
		 * @return {Array} Customer notes.
		 */
		const notes = count =>
			Array.from( { length: count }, ( _, i ) => ( {
				label: `Note ${ i + 1 }`,
				required: false,
			} ) );

		/**
		 * One note row, scoped. A message found anywhere on the page says nothing about
		 * which row it belongs to, and rows share a label, so the index is all there is.
		 *
		 * @param {number} index - Which row.
		 * @return {object} Queries scoped to that row's control.
		 */
		const noteControl = index =>
			within( screen.getAllByTestId( 'control-Customer note label' )[ index ] );

		/**
		 * Render the create form with the given notes already configured.
		 *
		 * @param {Array} customerNotes - The customerNotes attribute.
		 * @return {object} Testing Library render result.
		 */
		const renderWith = customerNotes => renderForm( { customerNotes } );

		/**
		 * Render a block that already has a payment, where errors show without a blur.
		 *
		 * @param {Array} customerNotes - The customerNotes attribute.
		 * @return {object} Testing Library render result.
		 */
		const renderSaved = customerNotes =>
			render(
				<Edit
					attributes={ {
						isApiManaged: true,
						resourceId: 'PLB-NOTE1',
						paymentLink: 'https://www.paypal.com/ncp/payment/PLB-NOTE1',
						productName: 'Test Widget',
						price: '29.99',
						currencyCode: 'USD',
						customerNotes,
					} }
					setAttributes={ setAttributes }
					clientId="a"
				/>
			);

		/**
		 * Re-render with a different set of notes, keeping every other prop.
		 *
		 * @param {Function} rerender      - The render result's rerender.
		 * @param {Array}    customerNotes - The customerNotes attribute.
		 */
		const rerenderWith = ( rerender, customerNotes ) => {
			rerender(
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
		};

		it( 'seeds one empty note when the toggle is turned on', async () => {
			const user = userEvent.setup();
			renderWith( [] );

			await user.click( await screen.findByLabelText( 'Add customer note' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				customerNotes: [ { label: '', required: false } ],
			} );
		} );

		it( 'empties the notes when the toggle is turned off', async () => {
			const user = userEvent.setup();
			renderWith( notes( 1 ) );

			await user.click( await screen.findByLabelText( 'Add customer note' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { customerNotes: [] } );
		} );

		it( 'saves the label on the note it was typed in', async () => {
			const user = userEvent.setup();
			renderWith( notes( 2 ) );

			await user.type( ( await screen.findAllByLabelText( 'Customer note label' ) )[ 1 ], 'X' );

			expect( setAttributes ).toHaveBeenCalledWith( {
				customerNotes: [
					{ label: 'Note 1', required: false },
					{ label: 'Note 2X', required: false },
				],
			} );
		} );

		// Every note has the same 'Required' label, so the index is the only thing
		// saying which one was ticked.
		it( 'marks the right note required', async () => {
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

		it( 'offers a second note while only one is configured', async () => {
			renderWith( notes( 1 ) );

			await expect( screen.findByText( 'Add another note' ) ).resolves.toBeInTheDocument();
		} );

		it( 'stops offering more once two are configured', async () => {
			renderWith( notes( 2 ) );

			await expect( screen.findAllByLabelText( 'Customer note label' ) ).resolves.toHaveLength( 2 );
			expect( screen.queryByText( 'Add another note' ) ).not.toBeInTheDocument();
		} );

		it( 'adds a second note when asked for another', async () => {
			const user = userEvent.setup();
			renderWith( notes( 1 ) );

			await user.click( await screen.findByText( 'Add another note' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				customerNotes: [
					{ label: 'Note 1', required: false },
					{ label: '', required: false },
				],
			} );
		} );

		it( 'keeps a third note from an older button editable and caps the list there', async () => {
			renderWith( notes( 3 ) );

			await expect( ( await screen.findAllByLabelText( 'Customer note label' ) )[ 2 ] ).toHaveValue(
				'Note 3'
			);
			expect( screen.getByLabelText( 'Remove customer note 3' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Add another note' ) ).not.toBeInTheDocument();
		} );

		// buildRequestData() drops a blank-labelled note, so the merchant has to be told here.
		it( 'flags a blank label once the merchant leaves the note', async () => {
			const user = userEvent.setup();
			renderWith( [ { label: '', required: false } ] );

			await visit( user, await screen.findByLabelText( 'Customer note label' ) );

			expect( noteControl( 0 ).getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'control-Customer note label' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		it( 'stays quiet on a note the merchant just added', async () => {
			const user = userEvent.setup();
			const { rerender } = renderWith( [] );

			await user.click( await screen.findByLabelText( 'Add customer note' ) );
			rerenderWith( rerender, [ { label: '', required: false } ] );

			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
		} );

		// The payment is never sent while the label is blank, so the reason has to be
		// visible without the merchant clicking into the field first.
		it( 'flags a blank label that was already in the post', async () => {
			renderWith( [ { label: '', required: false } ] );

			await expect( screen.findByLabelText( 'Customer note label' ) ).resolves.toBeInTheDocument();
			expect( noteControl( 0 ).getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'control-Customer note label' ) ).toHaveClass(
				'jetpack-paypal-payment-buttons__has-error'
			);
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();
		} );

		// The merchant may never touch this field, so waiting for a blur shows nothing.
		it( 'flags a saved blank note on first render', async () => {
			renderSaved( [ { label: '', required: false } ] );

			await expect( screen.findByText( REQUIRED_FIELD_ERROR ) ).resolves.toBeInTheDocument();
			expect( noteControl( 0 ).getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'true' );
		} );

		it( 'leaves the panel closed while every saved label is filled', async () => {
			renderSaved( notes( 2 ) );

			await expect( screen.findAllByLabelText( 'Customer note label' ) ).resolves.toHaveLength( 2 );
			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( panel( 'Checkout Options' ) ).toHaveAttribute( 'data-initial-open', 'false' );
		} );

		it( 'flags the blank note and leaves the filled one alone', async () => {
			renderSaved( [
				{ label: 'Engraving', required: false },
				{ label: '', required: false },
			] );

			await expect( screen.findByText( REQUIRED_FIELD_ERROR ) ).resolves.toBeInTheDocument();
			expect( noteControl( 1 ).getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
			expect( noteControl( 0 ).queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
		} );

		it( 'stays quiet after the merchant leaves a filled label', async () => {
			const user = userEvent.setup();
			renderWith( notes( 2 ) );

			const fields = await screen.findAllByLabelText( 'Customer note label' );
			await visit( user, fields[ 1 ] );

			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
			expect( screen.getByText( createdOnSave ) ).toBeInTheDocument();
		} );

		// Marks use the row index, so removing a note has to move them. removeNote()
		// clears every note mark before re-adding them, so the shift is what keeps the
		// remaining row's mark.
		it( 'keeps flagging the blank note after the one above it is removed', async () => {
			const user = userEvent.setup();
			const { rerender } = renderWith( [
				{ label: 'Engraving', required: false },
				{ label: '', required: false },
			] );

			// Blur the blank second row, then drop the first - the mark has to follow.
			await visit( user, ( await screen.findAllByLabelText( 'Customer note label' ) )[ 1 ] );
			await user.click( screen.getByLabelText( 'Remove customer note 1' ) );

			rerenderWith( rerender, [ { label: '', required: false } ] );

			expect( noteControl( 0 ).getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();
		} );

		it( 'stays quiet on the note added by turning the toggle back on', async () => {
			const user = userEvent.setup();
			const { rerender } = renderWith( [ { label: '', required: false } ] );

			await visit( user, await screen.findByLabelText( 'Customer note label' ) );
			expect( screen.getByText( REQUIRED_FIELD_ERROR ) ).toBeInTheDocument();

			await user.click( screen.getByLabelText( 'Add customer note' ) );
			rerenderWith( rerender, [] );
			await user.click( screen.getByLabelText( 'Add customer note' ) );
			rerenderWith( rerender, [ { label: '', required: false } ] );

			expect( screen.queryByText( REQUIRED_FIELD_ERROR ) ).not.toBeInTheDocument();
		} );

		// The same sentence whether or not any notes are configured.
		it.each( [
			[ 'no notes', [] ],
			[ 'two notes', notes( 2 ) ],
		] )( 'describes what customer notes are for with %s', async ( _label, configured ) => {
			renderWith( configured );

			await expect(
				screen.findByText(
					'Tell customers what you need, like personalization, gift messages, etc.'
				)
			).resolves.toBeInTheDocument();
		} );

		// Put the notes in a state, ask validateCustomerNotes what it reports, and require
		// all of it on screen in the row it names.
		describe( 'Every customer note error reaches the merchant', () => {
			// Between them these cover an empty label and a whitespace-only one, in the
			// first row, the second, and both at once.
			const fixtures = [
				[ { label: '', required: false } ],
				[
					{ label: 'Engraving', required: false },
					{ label: '   ', required: true },
				],
				[
					{ label: '   ', required: false },
					{ label: '', required: false },
				],
			];

			it.each( fixtures.map( ( customerNotes, i ) => [ i, customerNotes ] ) )(
				'shows every error the notes in state %i are carrying, and leaves the clean rows alone',
				async ( _index, customerNotes ) => {
					const errors = validateCustomerNotes( customerNotes );
					expect( errors.length ).toBeGreaterThan( 0 );

					// A saved button shows every error on first render.
					renderSaved( customerNotes );
					await expect( screen.findAllByLabelText( 'Customer note label' ) ).resolves.toHaveLength(
						customerNotes.length
					);

					errors.forEach( ( { index, message } ) => {
						expect( noteControl( index ).getByText( message ) ).toBeVisible();
					} );

					customerNotes.forEach( ( _note, index ) => {
						if ( errors.some( error => error.index === index ) ) {
							return;
						}
						expect(
							noteControl( index ).queryByText( REQUIRED_FIELD_ERROR )
						).not.toBeInTheDocument();
					} );
				}
			);
		} );

		it( 'offers the note again once one is removed', async () => {
			const user = userEvent.setup();
			const { rerender } = renderWith( notes( 2 ) );

			await expect(
				screen.findByLabelText( 'Remove customer note 2' )
			).resolves.toBeInTheDocument();
			await user.click( screen.getByLabelText( 'Remove customer note 2' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				customerNotes: [ { label: 'Note 1', required: false } ],
			} );

			rerenderWith( rerender, notes( 1 ) );

			expect( screen.getByText( 'Add another note' ) ).toBeInTheDocument();
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
		it( 'still sends the payment with a bad URL', async () => {
			const user = userEvent.setup();
			renderWith( 'http://example.com' );

			await visit( user, await screen.findByLabelText( label ) );

			expect( screen.getByText( createdOnSave ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Product details', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		const details = () => within( panel( 'Details' ) );

		const formIsUp = async () => {
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
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

			await expect( screen.findByText( heldBack ) ).resolves.toBeInTheDocument();
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
		// inside, the field to leave first where the form waits for a visit, and which
		// class editor.scss reddens it through - an amount field nests the error in a
		// span of its own so a hint can sit above it, everything else uses the help slot.
		const cases = {
			productName: {
				attributes: { productName: '' },
				testId: 'control-Product Name',
				message: 'Product name is required.',
				carrier: 'components-base-control__help',
				visit: 'Product Name',
			},
			price: {
				attributes: { price: '' },
				testId: 'control-Price',
				message: 'Price is required.',
				carrier: 'components-base-control__help',
				visit: 'Price',
			},
			productDescription: {
				attributes: { productDescription: 'x'.repeat( 2049 ) },
				testId: 'control-Description (optional)',
				message: 'Description must be 2048 characters or fewer.',
				carrier: 'components-base-control__help',
				visit: 'Description (optional)',
			},
			currencyCode: {
				attributes: { currencyCode: 'XYZ' },
				testId: 'control-Currency',
				message: 'Unsupported currency.',
				carrier: 'components-base-control__help',
			},
			taxValue: {
				attributes: { taxEnabled: true, taxType: 'PERCENTAGE', taxValue: '' },
				testId: 'control-Tax rate',
				message: REQUIRED_FIELD_ERROR,
				carrier: 'jetpack-paypal-payment-buttons__field-error',
			},
			handlingValue: {
				attributes: { handlingEnabled: true, handlingValue: '' },
				testId: 'control-Handling fee',
				message: REQUIRED_FIELD_ERROR,
				carrier: 'jetpack-paypal-payment-buttons__field-error',
			},
			discountValue: {
				attributes: { discountEnabled: true, discountType: 'FLAT', discountValue: '' },
				testId: 'control-Discount value',
				message: REQUIRED_FIELD_ERROR,
				carrier: 'jetpack-paypal-payment-buttons__field-error',
			},
			shippingValue: {
				attributes: { shippingEnabled: true, shippingMode: 'FLAT', shippingValue: '' },
				testId: 'control-Enter shipping fee',
				message: REQUIRED_FIELD_ERROR,
				carrier: 'jetpack-paypal-payment-buttons__field-error',
			},
			shippingAdditionalValue: {
				attributes: {
					shippingEnabled: true,
					shippingMode: 'QUANTITY',
					shippingValue: '5.00',
					shippingAdditionalValue: '-2',
				},
				testId: 'control-Additional items (optional)',
				message: REQUIRED_FIELD_ERROR,
				carrier: 'jetpack-paypal-payment-buttons__field-error',
			},
			returnUrl: {
				attributes: { returnUrl: 'http://example.com/thanks' },
				testId: 'url-input-Return URL (optional)',
				message: 'Return URL must use HTTPS (e.g., https://example.com/thank-you).',
				carrier: 'components-base-control__help',
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
			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();

			if ( visitLabel ) {
				await visit( user, within( screen.getByTestId( testId ) ).getByLabelText( visitLabel ) );
			}

			return screen.getByTestId( testId );
		};

		// A new key with no case here fails on this line rather than going untested.
		it( 'has a case for every error the form can report', () => {
			expect( errorKeys.slice().sort() ).toEqual( Object.keys( cases ).sort() );
		} );

		/**
		 * Assert the error is on screen wearing the class editor.scss reddens.
		 *
		 * One class per shape of field, so the case says which - a message in the
		 * other one renders grey, which is the bug this pins.
		 *
		 * @param {Element} field - The control the message has to be inside.
		 * @param {string}  key   - The validationErrors key under test.
		 */
		const expectStyledError = ( field, key ) => {
			expect( within( field ).getByText( cases[ key ].message ) ).toHaveClass(
				cases[ key ].carrier
			);
		};

		it.each( blockingKeys )( 'says what is wrong when %s blocks the save', async key => {
			const field = await showError( key );

			expectStyledError( field, key );
			expect( screen.getByText( heldBack ) ).toBeInTheDocument();

			// A message inside a collapsed panel is a message nobody reads, so the
			// panel opens itself for its own fields. Whether the field is one of its
			// own comes from where the control actually sits, not from the same list
			// the source reads - that would make this assertion agree with any
			// classification, right or wrong.
			const checkoutOptions = panel( 'Checkout Options' );
			expect( checkoutOptions ).toHaveAttribute(
				'data-initial-open',
				String( checkoutOptions.contains( field ) )
			);
		} );

		// The other half of the split: these warn and the merchant can still save.
		it.each( ADVISORY_ERROR_KEYS )( 'warns about %s and still saves', async key => {
			const field = await showError( key );

			expectStyledError( field, key );
			expect( screen.getByText( createdOnSave ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Adjustable quantity', () => {
		beforeEach( () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
		} );

		it( 'writes adjustable quantity when it is turned on', async () => {
			const user = userEvent.setup();
			renderForm( { adjustableQuantity: false } );

			await user.click( await screen.findByLabelText( 'Let customers set quantity' ) );

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

		// The design draws the same help under the toggle in every state, so the
		// string stays put while the field below it appears.
		it.each( [ true, false ] )(
			'shows the same quantity help with the toggle %s',
			async adjustableQuantity => {
				renderForm( { adjustableQuantity } );

				await expect(
					screen.findByText( 'Fixed at 1 unit per purchase' )
				).resolves.toBeInTheDocument();
			}
		);

		it( 'shows the help text under the maximum quantity field', async () => {
			renderForm( { adjustableQuantity: true } );

			await expect(
				screen.findByText( 'Customers can buy up to this number' )
			).resolves.toBeInTheDocument();
		} );
	} );

	describe( 'Manage PayPal Payment Links', () => {
		const saved = {
			isApiManaged: true,
			resourceId: 'PLB-MANAGE1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-MANAGE1',
		};

		it( 'links to the admin page from the connection panel once the block has a saved link', async () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
			renderForm( saved );

			const connectionPanel = ( await screen.findAllByTestId( 'panel-body' ) ).find(
				body => body.dataset.title === 'PayPal Connection'
			);
			const link = within( connectionPanel ).getByRole( 'link', {
				name: 'Manage PayPal Payment Links',
			} );

			expect( link ).toHaveAttribute(
				'href',
				'https://example.test/wp-admin/admin.php?page=paypal-payment-links'
			);
			// A new tab, so the post being edited is not left behind.
			expect( link ).toHaveAttribute( 'target', '_blank' );
		} );

		it( 'has nothing to manage before the link exists', async () => {
			apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
			renderForm();

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect(
				screen.queryByRole( 'link', { name: 'Manage PayPal Payment Links' } )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'Deleted link', () => {
		const saved = {
			isApiManaged: true,
			resourceId: 'PLB-GONE1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-GONE1',
		};
		const notice = /This payment link was deleted from PayPal/;

		it( 'warns that the link is gone when PayPal no longer has it', async () => {
			apiFetch.mockImplementation( request => {
				if ( request.path.endsWith( '/connection' ) ) {
					return Promise.resolve( { connected: true, environment: 'sandbox' } );
				}
				return Promise.reject( {
					code: 'paypal_api_resource_not_found',
					data: { status: 404 },
					message: 'Not found.',
				} );
			} );
			renderForm( saved );

			await expect( screen.findByText( notice ) ).resolves.toBeInTheDocument();
			// The preview stays, so the merchant can see what the page used to show.
			expect( screen.getByTestId( 'paypal-button-preview' ) ).toBeInTheDocument();
		} );

		it( 'stays quiet while PayPal still has the link', async () => {
			apiFetch.mockImplementation( request =>
				request.path.endsWith( '/connection' )
					? Promise.resolve( { connected: true, environment: 'sandbox' } )
					: Promise.resolve( { attributes: {} } )
			);
			renderForm( saved );

			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( notice ) ).not.toBeInTheDocument();
		} );

		// Any other failure is not evidence the link is gone.
		it( 'stays quiet when the lookup fails for another reason', async () => {
			apiFetch.mockImplementation( request =>
				request.path.endsWith( '/connection' )
					? Promise.resolve( { connected: true, environment: 'sandbox' } )
					: Promise.reject( { code: 'fetch_error', message: 'offline' } )
			);
			renderForm( saved );

			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( notice ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Delete confirmation', () => {
		const saved = {
			isApiManaged: true,
			resourceId: 'PLB-DELETE1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-DELETE1',
		};

		/**
		 * Answer the connection check and every delete, and record the deletes.
		 *
		 * @return {jest.Mock} The apiFetch mock.
		 */
		const mockConnectedRoutes = () =>
			apiFetch.mockImplementation( request =>
				request.path.endsWith( '/connection' )
					? Promise.resolve( { connected: true, environment: 'sandbox' } )
					: Promise.resolve( {} )
			);

		const deleteRequests = () =>
			apiFetch.mock.calls.filter( ( [ request ] ) => 'DELETE' === request.method );

		it( 'keeps the delete button disabled until the merchant acknowledges the warning', async () => {
			const user = userEvent.setup();
			mockConnectedRoutes();
			renderForm( saved );

			await user.click( await screen.findByTestId( 'toolbar-Delete payment link' ) );

			const dialog = screen.getByRole( 'dialog', { name: 'Delete payment link' } );
			expect( within( dialog ).getByText( /cannot pause, deactivate, or restore/ ) ).toBeVisible();
			const confirm = within( dialog ).getByRole( 'button', { name: 'Delete permanently' } );
			expect( confirm ).toBeDisabled();

			await user.click( confirm );
			expect( deleteRequests() ).toHaveLength( 0 );

			await user.click( within( dialog ).getByLabelText( 'I understand this cannot be undone.' ) );
			expect( confirm ).toBeEnabled();

			await user.click( confirm );

			await waitFor( () => expect( deleteRequests() ).toHaveLength( 1 ) );
			expect( deleteRequests()[ 0 ][ 0 ].path ).toContain( '/buttons/PLB-DELETE1' );
			await expect( screen.findByText( 'Payment link deleted.' ) ).resolves.toBeInTheDocument();
		} );

		it( 'cancelling closes the dialog without deleting', async () => {
			const user = userEvent.setup();
			mockConnectedRoutes();
			renderForm( saved );

			await user.click( await screen.findByTestId( 'toolbar-Delete payment link' ) );
			await user.click( screen.getByLabelText( 'I understand this cannot be undone.' ) );
			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

			expect(
				screen.queryByRole( 'dialog', { name: 'Delete payment link' } )
			).not.toBeInTheDocument();
			expect( deleteRequests() ).toHaveLength( 0 );
			expect( setAttributes ).not.toHaveBeenCalledWith(
				expect.objectContaining( { resourceId: undefined } )
			);
		} );

		// The acknowledgement is for this delete, not the next one.
		it( 'asks for the acknowledgement again when the dialog is reopened', async () => {
			const user = userEvent.setup();
			mockConnectedRoutes();
			renderForm( saved );

			await user.click( await screen.findByTestId( 'toolbar-Delete payment link' ) );
			await user.click( screen.getByLabelText( 'I understand this cannot be undone.' ) );
			await user.click( screen.getByTestId( 'modal-close' ) );

			await user.click( screen.getByTestId( 'toolbar-Delete payment link' ) );

			expect( screen.getByLabelText( 'I understand this cannot be undone.' ) ).not.toBeChecked();
			expect( screen.getByRole( 'button', { name: 'Delete permanently' } ) ).toBeDisabled();
		} );
	} );

	describe( 'Changed at PayPal', () => {
		const saved = {
			isApiManaged: true,
			resourceId: 'PLB-CLEAR1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-CLEAR1',
		};
		// Matches renderForm's product exactly, so only the field a test changes or
		// leaves out can raise the notice.
		const carried = {
			productName: 'Test Widget',
			price: '29.99',
			currencyCode: 'USD',
			paymentLink: saved.paymentLink,
		};
		const notice =
			/This payment link was updated elsewhere and this block has been updated to match\./;

		/**
		 * Answer the connection check, then hand back one payment.
		 *
		 * @param {object} attributes - Block-shaped attributes the payment read returns.
		 * @return {jest.Mock} The apiFetch mock.
		 */
		const mockPayment = attributes =>
			apiFetch.mockImplementation( request =>
				request.path.endsWith( '/connection' )
					? Promise.resolve( { connected: true, environment: 'sandbox' } )
					: Promise.resolve( { attributes } )
			);

		it( 'says so when the payment no longer carries a field the block held', async () => {
			mockPayment( carried );
			renderForm( { ...saved, productDescription: 'Hand made' } );

			await expect( screen.findByText( notice ) ).resolves.toBeInTheDocument();
			// The notice does not stop the sync - the block still takes PayPal's blank.
			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( { productDescription: '' } )
			);
		} );

		// Price is the case that matters most - the block would otherwise take the new
		// number with nothing shown.
		it( 'says so when the payment carries a different value', async () => {
			mockPayment( { ...carried, price: '200.00' } );
			renderForm( { ...saved, price: '100.00' } );

			await expect( screen.findByText( notice ) ).resolves.toBeInTheDocument();
			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( { price: '200.00' } )
			);
		} );

		it( 'stays quiet when the block already agrees with the payment', async () => {
			mockPayment( carried );
			renderForm( saved );

			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( notice ) ).not.toBeInTheDocument();
		} );

		// Any failure leaves the block on its own values, so there is nothing to report.
		it( 'stays quiet when the lookup fails', async () => {
			apiFetch.mockImplementation( request =>
				request.path.endsWith( '/connection' )
					? Promise.resolve( { connected: true, environment: 'sandbox' } )
					: Promise.reject( { code: 'fetch_error', message: 'offline' } )
			);
			renderForm( { ...saved, price: '100.00' } );

			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( notice ) ).not.toBeInTheDocument();
		} );

		// The warning is about a payment. Delete it and the warning goes with it, even
		// though the read that raised it never runs again.
		it( 'drops the warning when the payment is deleted', async () => {
			mockPayment( { ...carried, price: '200.00' } );
			const attributes = { productName: 'Test Widget', price: '100.00', currencyCode: 'USD' };
			const { rerender } = render(
				<Edit attributes={ { ...attributes, ...saved } } setAttributes={ setAttributes } />
			);
			await expect( screen.findByText( notice ) ).resolves.toBeInTheDocument();

			rerender( <Edit attributes={ attributes } setAttributes={ setAttributes } /> );

			await waitFor( () => expect( screen.queryByText( notice ) ).not.toBeInTheDocument() );
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

		// A save drops the merchant back on the preview, so the notice it leaves
		// behind is a different one from the form's.
		// A delete is refused without ever leaving the preview, so its error lands
		// there rather than on the form.
		it( 'clears the error notice on the preview when it is dismissed', async () => {
			const user = userEvent.setup();
			const refused = 'PayPal could not delete the payment.';
			mockRoutes( ( { method } ) =>
				'DELETE' === method ? Promise.reject( { message: refused } ) : Promise.resolve( {} )
			);

			renderForm( saved );

			await user.click( await screen.findByTestId( 'toolbar-Delete payment link' ) );
			await user.click( screen.getByLabelText( 'I understand this cannot be undone.' ) );
			await user.click( screen.getByRole( 'button', { name: 'Delete permanently' } ) );

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

	describe( 'Saved Button (connected, has button)', () => {
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

		// Display Format used to change nothing on the canvas, because the preview
		// was never handed the attribute.
		it( 'hands the chosen Display Format to the preview', async () => {
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

			// No format attribute yet, so the block is a button.
			await expect( screen.findByTestId( 'paypal-button-preview' ) ).resolves.toHaveAttribute(
				'data-format',
				'BUTTON'
			);

			// Embed as is a dropdown in the Styles tab.
			await user.selectOptions( screen.getByLabelText( 'Embed as' ), 'QR' );

			expect( setAttributes ).toHaveBeenCalledWith( { format: 'QR' } );
		} );

		// The Styles tab — the panel set changes per format and, for QR, per the
		// caption toggle.
		describe( 'the Styles tab', () => {
			const qrAttributes = {
				isApiManaged: true,
				resourceId: 'PLB-TEST123',
				paymentLink: 'https://www.paypal.com/paymentpage/PLB-TEST123',
				productName: 'Test Widget',
				price: '29.99',
				currencyCode: 'USD',
				format: 'QR',
			};

			it( 'puts the format controls in the styles group, which is what draws the tab bar', async () => {
				render( <Edit attributes={ qrAttributes } setAttributes={ setAttributes } /> );
				await expect(
					screen.findByTestId( 'inspector-controls-styles' )
				).resolves.toBeInTheDocument();
			} );

			it( 'offers Download beside the inspector QR code', async () => {
				render( <Edit attributes={ qrAttributes } setAttributes={ setAttributes } /> );
				await expect( screen.findByText( 'Download' ) ).resolves.toBeInTheDocument();
			} );

			// Button text goes under Embed as so it follows the format, rather than
			// in the Settings tab where QR and Link merchants saw a field that did
			// nothing. Scoped to the styles fill: both fills render into one body,
			// so an unscoped query passes wherever the control actually lives.
			it( 'writes the button text from the styles tab', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON', buttonText: '' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				await user.type( within( styles ).getByLabelText( 'Button text' ), 'B' );

				expect( setAttributes ).toHaveBeenCalledWith( { buttonText: 'B' } );
			} );

			// A block with no payment yet draws the styles tab down a different
			// render path, so it gets its own case.
			it( 'offers the button text field before a button exists', async () => {
				apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
				renderForm( { format: 'BUTTON', buttonText: '' } );

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( styles ).getByLabelText( 'Button text' ) ).toBeInTheDocument();
			} );

			it( 'leaves no button text field in the settings tab', async () => {
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);

				// The form and the connection panel are both ungrouped fills, so the
				// settings tab is more than one node.
				const settings = await screen.findAllByTestId( 'inspector-controls' );
				settings.forEach( fill =>
					expect( within( fill ).queryByLabelText( 'Button text' ) ).not.toBeInTheDocument()
				);
			} );

			// Document-wide, not scoped: a QR merchant must not see the field
			// anywhere, wherever a future change might put it.
			it( 'keeps the button text field off QR and Link', async () => {
				const { rerender } = render(
					<Edit attributes={ qrAttributes } setAttributes={ setAttributes } />
				);

				let styles = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( styles ).getByLabelText( 'Embed as' ) ).toHaveValue( 'QR' );
				expect( screen.queryByLabelText( 'Button text' ) ).not.toBeInTheDocument();

				rerender(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);

				styles = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( styles ).getByLabelText( 'Embed as' ) ).toHaveValue( 'LINK' );
				expect( screen.queryByLabelText( 'Button text' ) ).not.toBeInTheDocument();
			} );

			// Embed as is a single choice, so a QR under the button has no home
			// anymore. The QR format draws one instead.
			it( 'offers no QR toggle', async () => {
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( styles ).getByLabelText( 'Button text' ) ).toBeInTheDocument();
				expect( screen.queryByLabelText( 'Show QR code' ) ).not.toBeInTheDocument();
			} );

			// The button colors text and background, so its Color panel has two
			// rows; the other formats have one.
			it( 'draws a Text and a Background swatch on the button', async () => {
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);

				const colorPanel = await screen.findByTestId( 'tools-panel-Color' );
				expect( within( colorPanel ).getByTestId( 'color-Text' ) ).toBeInTheDocument();
				expect( within( colorPanel ).getByTestId( 'color-Background' ) ).toBeInTheDocument();
			} );

			it( 'stores the button text and background colors separately', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);
				await expect( screen.findByTestId( 'tools-panel-Color' ) ).resolves.toBeInTheDocument();

				await user.click( screen.getByTestId( 'color-Text' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { buttonTextColor: '#111111' } );

				await user.click( screen.getByTestId( 'color-Background' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { buttonBackgroundColor: '#111111' } );
			} );

			// Reset All clears every row in the panel, not just the last one set.
			it( 'clears both button colors at once', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ {
							...qrAttributes,
							format: 'BUTTON',
							buttonTextColor: '#1e1e1e',
							buttonBackgroundColor: '#ffd140',
						} }
						setAttributes={ setAttributes }
					/>
				);
				const colorPanel = await screen.findByTestId( 'tools-panel-Color' );

				// The panel's own Reset All, not the per-swatch clear — one write
				// covering every key the format owns is what the panel promises.
				await user.click( within( colorPanel ).getByTestId( 'tools-panel-reset' ) );

				expect( setAttributes ).toHaveBeenCalledWith( {
					buttonTextColor: '',
					buttonBackgroundColor: '',
				} );
			} );

			// The swatch would fill in and change nothing: both renderers drop the
			// background under Outline, because the transparent one comes from CSS.
			it( 'drops the background swatch and the contrast warning under Outline', async () => {
				// Both colors set: the real ContrastChecker draws nothing without them.
				const colored = {
					...qrAttributes,
					format: 'BUTTON',
					buttonTextColor: '#1e1e1e',
					buttonBackgroundColor: '#ffd140',
				};
				const { rerender } = render(
					<Edit
						attributes={ { ...colored, buttonStyle: 'fill' } }
						setAttributes={ setAttributes }
					/>
				);

				let styles = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( styles ).getByTestId( 'color-Background' ) ).toBeInTheDocument();
				expect( within( styles ).getByTestId( 'contrast-checker' ) ).toBeInTheDocument();

				rerender(
					<Edit
						attributes={ { ...colored, buttonStyle: 'outline' } }
						setAttributes={ setAttributes }
					/>
				);

				styles = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( styles ).getByTestId( 'color-Text' ) ).toBeInTheDocument();
				expect( within( styles ).queryByTestId( 'color-Background' ) ).not.toBeInTheDocument();
				expect( within( styles ).queryByTestId( 'contrast-checker' ) ).not.toBeInTheDocument();
			} );

			// The row is hidden under Outline, but the value behind it is not — Reset
			// All has to clear it or it comes back when the merchant picks Fill again.
			it( 'clears the hidden background color under Outline', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ {
							...qrAttributes,
							format: 'BUTTON',
							buttonStyle: 'outline',
							buttonBackgroundColor: '#ffd140',
						} }
						setAttributes={ setAttributes }
					/>
				);
				const colorPanel = await screen.findByTestId( 'tools-panel-Color' );

				await user.click( within( colorPanel ).getByTestId( 'tools-panel-reset' ) );

				expect( setAttributes ).toHaveBeenCalledWith( {
					buttonTextColor: '',
					buttonBackgroundColor: '',
				} );
			} );

			// The peer formats both have this; without it a wrong fontSizeKey on the
			// button's TypographyPanel ships green.
			it( 'writes the button font size, and clears it on reset', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);
				await expect( screen.findByTestId( 'font-size' ) ).resolves.toBeInTheDocument();

				await user.click( screen.getByTestId( 'font-size' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { buttonFontSize: '1.5rem' } );

				await user.click( screen.getByTestId( 'font-size-reset' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { buttonFontSize: undefined } );
			} );

			it( 'hands the contrast checker both button colors', async () => {
				render(
					<Edit
						attributes={ {
							...qrAttributes,
							format: 'BUTTON',
							buttonTextColor: '#1e1e1e',
							buttonBackgroundColor: '#ffd140',
						} }
						setAttributes={ setAttributes }
					/>
				);

				const checker = await screen.findByTestId( 'contrast-checker' );
				expect( checker ).toHaveAttribute( 'data-text', '#1e1e1e' );
				expect( checker ).toHaveAttribute( 'data-background', '#ffd140' );
			} );

			// LINK and QR pass no ownedKeys, so they reset from the rows on screen.
			it( 'clears the link color from its own panel', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK', linkColor: '#1e1e1e' } }
						setAttributes={ setAttributes }
					/>
				);
				const colorPanel = await screen.findByTestId( 'tools-panel-Color' );

				await user.click( within( colorPanel ).getByTestId( 'tools-panel-reset' ) );

				expect( setAttributes ).toHaveBeenCalledWith( { linkColor: '' } );
			} );

			it( 'offers Fill and Outline on the button, and defaults to Fill', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				const toggle = within( styles ).getByTestId( 'toggle-group-Styles' );
				expect( toggle ).toHaveAttribute( 'data-value', 'fill' );

				await user.click( within( toggle ).getByText( 'Outline' ) );

				expect( setAttributes ).toHaveBeenCalledWith( { buttonStyle: 'outline' } );
			} );

			// Fill/Outline is the button's alone — a QR or a link has no face to
			// fill. Queried document-wide so the test still works if the panel moves.
			it( 'keeps the Styles panel off QR and Link', async () => {
				const { rerender } = render(
					<Edit attributes={ qrAttributes } setAttributes={ setAttributes } />
				);
				await expect(
					screen.findByTestId( 'inspector-controls-styles' )
				).resolves.toBeInTheDocument();
				expect( screen.queryByTestId( 'toggle-group-Styles' ) ).not.toBeInTheDocument();

				rerender(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);
				expect( screen.queryByTestId( 'toggle-group-Styles' ) ).not.toBeInTheDocument();
			} );

			it( 'starts with the attribution line off and toggles it on', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				const checkbox = within( styles ).getByLabelText( 'Show "Powered by PayPal" text' );
				expect( checkbox ).not.toBeChecked();

				await user.click( checkbox );

				expect( setAttributes ).toHaveBeenCalledWith( { buttonShowPoweredBy: true } );
			} );

			// Only the button format offers the choice; the QR draws the code and its
			// caption and nothing else.
			it( 'keeps the attribution checkbox off QR and Link', async () => {
				const { rerender } = render(
					<Edit attributes={ qrAttributes } setAttributes={ setAttributes } />
				);
				await expect(
					screen.findByTestId( 'inspector-controls-styles' )
				).resolves.toBeInTheDocument();
				expect(
					screen.queryByLabelText( 'Show "Powered by PayPal" text' )
				).not.toBeInTheDocument();

				rerender(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);
				expect(
					screen.queryByLabelText( 'Show "Powered by PayPal" text' )
				).not.toBeInTheDocument();
			} );

			// The button puts Width Settings between Color and Typography; QR does
			// not, so one shared Color+Typography component cannot draw both.
			it( 'orders the button panels Color, Styles, Width, Typography, Border', async () => {
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				// Both testids in one query, so the result comes back in document
				// order. Only PanelBody has a title; the Color panel is a
				// ToolsPanel and is named by its testid.
				const titles = within( styles )
					.getAllByTestId( /^(tools-panel-Color|panel-body)$/ )
					.map( node =>
						node.dataset.testid === 'tools-panel-Color'
							? 'Color'
							: node.getAttribute( 'data-title' )
					);

				expect( titles ).toEqual( [
					'Color',
					'Styles',
					'Width Settings',
					'Typography',
					'Border Settings',
				] );
			} );

			// The Light / Auto / Dark preset only ever changed the editor — the
			// published page never emitted data-color-scheme — so it is gone.
			it( 'offers no color scheme preset', async () => {
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);

				// Scoped to the Settings fills, where the preset used to live —
				// unscoped, this would pass just as well if the tab stopped
				// rendering for some unrelated reason.
				const settings = await screen.findAllByTestId( 'inspector-controls' );
				settings.forEach( fill => {
					expect( within( fill ).queryByText( 'Light' ) ).not.toBeInTheDocument();
					expect( within( fill ).queryByText( 'Auto' ) ).not.toBeInTheDocument();
					expect( within( fill ).queryByText( 'Dark' ) ).not.toBeInTheDocument();
				} );
			} );

			// The inspector's copy shows the caption too, so the merchant sees what
			// they typed without going back to the canvas.
			it( 'captions the inspector QR code, and drops it with the toggle', async () => {
				const { rerender } = render(
					<Edit
						attributes={ { ...qrAttributes, qrShowCaption: true, qrCaption: 'Scan to pay' } }
						setAttributes={ setAttributes }
					/>
				);

				let inspector = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( inspector ).getByText( 'Scan to pay' ) ).toBeInTheDocument();

				rerender(
					<Edit
						attributes={ { ...qrAttributes, qrShowCaption: false, qrCaption: 'Scan to pay' } }
						setAttributes={ setAttributes }
					/>
				);

				inspector = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( inspector ).getByText( 'Download' ) ).toBeInTheDocument();
				expect( within( inspector ).queryByText( 'Scan to pay' ) ).not.toBeInTheDocument();
			} );

			// A fresh QR block draws a bare code; the caption is opt-in.
			it( 'starts with the caption off', async () => {
				render( <Edit attributes={ qrAttributes } setAttributes={ setAttributes } /> );
				const styles = await screen.findByTestId( 'inspector-controls-styles' );

				expect( within( styles ).getByLabelText( 'Show text under QR code' ) ).not.toBeChecked();
				expect( within( styles ).queryByLabelText( 'Caption' ) ).not.toBeInTheDocument();
			} );

			it( 'toggles the caption off', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, qrShowCaption: true } }
						setAttributes={ setAttributes }
					/>
				);
				await expect(
					screen.findByTestId( 'inspector-controls-styles' )
				).resolves.toBeInTheDocument();

				await user.click( screen.getByLabelText( 'Show text under QR code' ) );

				expect( setAttributes ).toHaveBeenCalledWith( { qrShowCaption: false } );
			} );

			it( 'drops Color and Typography when the caption is off', async () => {
				render(
					<Edit
						attributes={ { ...qrAttributes, qrShowCaption: false } }
						setAttributes={ setAttributes }
					/>
				);
				await expect(
					screen.findByTestId( 'inspector-controls-styles' )
				).resolves.toBeInTheDocument();

				expect( screen.queryByTestId( 'tools-panel-Color' ) ).not.toBeInTheDocument();
				expect( screen.queryByTestId( 'color-dropdown' ) ).not.toBeInTheDocument();
				expect( screen.queryByTestId( 'font-size' ) ).not.toBeInTheDocument();
				// Width and Border do not depend on the caption.
				expect( panel( 'Width Settings' ) ).toBeInTheDocument();
				expect( panel( 'Border Settings' ) ).toBeInTheDocument();
			} );

			it( 'adds Color and Typography when the caption is on', async () => {
				render(
					<Edit
						attributes={ { ...qrAttributes, qrShowCaption: true } }
						setAttributes={ setAttributes }
					/>
				);

				// The dropdown renders a ToolsPanelItem, so without a ToolsPanel
				// around it the whole panel silently draws nothing.
				const colorPanel = await screen.findByTestId( 'tools-panel-Color' );
				expect( within( colorPanel ).getByTestId( 'color-dropdown' ) ).toBeInTheDocument();
				expect( screen.getByTestId( 'font-size' ) ).toBeInTheDocument();
			} );

			it( 'stores the caption color, and clears it', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, qrShowCaption: true } }
						setAttributes={ setAttributes }
					/>
				);
				await expect( screen.findByTestId( 'tools-panel-Color' ) ).resolves.toBeInTheDocument();

				await user.click( screen.getByTestId( 'color-Text' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { captionColor: '#111111' } );

				// The real control clears by calling back with no argument at all.
				await user.click( screen.getByTestId( 'color-clear' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { captionColor: '' } );
			} );

			it( 'stores the caption size with its unit, and clears it', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, qrShowCaption: true } }
						setAttributes={ setAttributes }
					/>
				);
				await expect( screen.findByTestId( 'font-size' ) ).resolves.toBeInTheDocument();

				// The unit comes with it — a bare number would not render on the
				// published page, where the value is used verbatim.
				await user.click( screen.getByTestId( 'font-size' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { captionFontSize: '1.5rem' } );

				await user.click( screen.getByTestId( 'font-size-reset' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { captionFontSize: undefined } );
			} );

			it( 'gives the QR a margin control and the button none', async () => {
				// Margin belongs to the QR panel only; the button panel is radius
				// and stroke.
				const { unmount } = render(
					<Edit attributes={ qrAttributes } setAttributes={ setAttributes } />
				);
				await expect( screen.findByTestId( 'spacing-Margin' ) ).resolves.toBeInTheDocument();
				unmount();

				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'BUTTON' } }
						setAttributes={ setAttributes }
					/>
				);
				await expect(
					screen.findByTestId( 'inspector-controls-styles' )
				).resolves.toBeInTheDocument();
				expect( panel( 'Border Settings' ) ).toBeInTheDocument();
				expect( screen.queryByTestId( 'spacing-Margin' ) ).not.toBeInTheDocument();
				// Radius and stroke still belong to the button.
				expect( screen.getByTestId( 'border-radius' ) ).toBeInTheDocument();
				expect( screen.getByTestId( 'border-Stroke' ) ).toBeInTheDocument();
			} );

			it( 'writes the link text from the styles tab', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK', linkText: '' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				await user.type( within( styles ).getByLabelText( 'Link text' ), 'B' );

				expect( setAttributes ).toHaveBeenCalledWith( { linkText: 'B' } );
			} );

			// LINK is the only format with a URL, so this is the one place in the
			// block a merchant can copy it.
			it( 'offers the attributed payment URL and a Copy button for LINK', async () => {
				// The BN code rides the connection response, not the block.
				apiFetch.mockResolvedValue( {
					connected: true,
					environment: 'sandbox',
					partner_attribution_id: 'BN-TEST',
				} );
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				// The BN code has to be on it: a merchant shares this link
				// directly, so it must attribute the same way the anchor does.
				await waitFor( () =>
					expect( within( styles ).getByLabelText( 'URL' ).value ).toContain( 'at_code=BN-TEST' )
				);
				expect( within( styles ).getByLabelText( 'URL' ).value ).toContain(
					'paypal.com/paymentpage/PLB-TEST123'
				);
				expect( within( styles ).getByText( 'Copy' ) ).toBeInTheDocument();
			} );

			it( 'copies the attributed URL and goes back to Copy', async () => {
				jest.useFakeTimers();
				const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
				apiFetch.mockResolvedValue( {
					connected: true,
					environment: 'sandbox',
					partner_attribution_id: 'BN-TEST',
				} );
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				await waitFor( () =>
					expect( within( styles ).getByLabelText( 'URL' ).value ).toContain( 'at_code=BN-TEST' )
				);

				await user.click( within( styles ).getByText( 'Copy' ) );

				// The clipboard gets the same attributed URL the field shows.
				expect( mockCopiedText.last ).toBe( within( styles ).getByLabelText( 'URL' ).value );
				expect( within( styles ).getByText( 'Copied!' ) ).toBeInTheDocument();

				// The label goes back on its own rather than sticking at "Copied!".
				await act( async () => {
					jest.advanceTimersByTime( 2000 );
				} );
				expect( within( styles ).getByText( 'Copy' ) ).toBeInTheDocument();
			} );

			// No payment link until the post is saved, so there is nothing to copy.
			it( 'restarts the confirmation when Copy is clicked twice', async () => {
				jest.useFakeTimers();
				const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				await user.click( within( styles ).getByText( 'Copy' ) );

				// Most of the way through the first window, then copy again.
				await act( async () => {
					jest.advanceTimersByTime( 1500 );
				} );
				await user.click( within( styles ).getByText( 'Copied!' ) );

				// The first timer would have fired by now; the second one has not.
				await act( async () => {
					jest.advanceTimersByTime( 1000 );
				} );
				expect( within( styles ).getByText( 'Copied!' ) ).toBeInTheDocument();

				await act( async () => {
					jest.advanceTimersByTime( 1000 );
				} );
				expect( within( styles ).getByText( 'Copy' ) ).toBeInTheDocument();
			} );

			it( 'leaves out the URL row before a button exists', async () => {
				apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );
				renderForm( { format: 'LINK', linkText: '' } );

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( styles ).getByLabelText( 'Link text' ) ).toBeInTheDocument();
				expect( within( styles ).queryByLabelText( 'URL' ) ).not.toBeInTheDocument();
			} );

			// The panels are shared with the QR caption, so the thing worth
			// asserting is which attributes they write — wiring LINK to the
			// caption's would draw an identical tab.
			it( 'stores the link color, and clears it', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);
				await expect( screen.findByTestId( 'tools-panel-Color' ) ).resolves.toBeInTheDocument();

				await user.click( screen.getByTestId( 'color-Link text' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { linkColor: '#111111' } );

				await user.click( screen.getByTestId( 'color-clear' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { linkColor: '' } );
			} );

			it( 'stores the link size with its unit, and clears it', async () => {
				const user = userEvent.setup();
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);
				await expect( screen.findByTestId( 'font-size' ) ).resolves.toBeInTheDocument();

				await user.click( screen.getByTestId( 'font-size' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { linkFontSize: '1.5rem' } );

				await user.click( screen.getByTestId( 'font-size-reset' ) );
				expect( setAttributes ).toHaveBeenCalledWith( { linkFontSize: undefined } );
			} );

			it( 'gives LINK no button text or caption field', async () => {
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				// Positive control: the link's own field is there, so the case
				// covers the wrong field being dropped rather than the whole tab.
				expect( within( styles ).getByLabelText( 'Link text' ) ).toBeInTheDocument();
				expect( within( styles ).queryByLabelText( 'Button text' ) ).not.toBeInTheDocument();
				expect(
					within( styles ).queryByLabelText( 'Show text under QR code' )
				).not.toBeInTheDocument();
			} );

			it( 'gives LINK no Width or Border panel', async () => {
				render(
					<Edit
						attributes={ { ...qrAttributes, format: 'LINK' } }
						setAttributes={ setAttributes }
					/>
				);
				await expect(
					screen.findByTestId( 'inspector-controls-styles' )
				).resolves.toBeInTheDocument();

				// Positive control: Typography still draws, so an empty styles tab
				// cannot pass this.
				expect( panel( 'Typography' ) ).toBeInTheDocument();
				expect( panel( 'Width Settings' ) ).toBeUndefined();
				expect( panel( 'Border Settings' ) ).toBeUndefined();
			} );

			// Both controls take the same busy flag, so a request in flight locks
			// the format and its label together.
			/**
			 * Put a block into the busy state and hand back its styles fill.
			 *
			 * Hangs the delete so the busy flag is still on when it is checked.
			 *
			 * @param {object} attributes - Attributes on top of qrAttributes.
			 * @return {Element} The styles fill, once the controls have locked.
			 */
			const lockedStylesTab = async attributes => {
				const user = userEvent.setup();
				apiFetch.mockImplementation( ( { method } ) =>
					'DELETE' === method
						? new Promise( () => {} )
						: Promise.resolve( { connected: true, environment: 'sandbox' } )
				);
				render(
					<Edit attributes={ { ...qrAttributes, ...attributes } } setAttributes={ setAttributes } />
				);

				const styles = await screen.findByTestId( 'inspector-controls-styles' );
				expect( within( styles ).getByLabelText( 'Embed as' ) ).toBeEnabled();

				await user.click( await screen.findByTestId( 'toolbar-Delete payment link' ) );
				await user.click( screen.getByLabelText( 'I understand this cannot be undone.' ) );
				await user.click( screen.getByRole( 'button', { name: 'Delete permanently' } ) );

				await waitFor( () => {
					expect( within( styles ).getByLabelText( 'Embed as' ) ).toBeDisabled();
				} );

				return styles;
			};

			// Every control in the tab takes the same busy flag, so a request in
			// flight locks the format and the text that goes with it.
			it( 'locks embed as and button text while a request is in flight', async () => {
				const styles = await lockedStylesTab( { format: 'BUTTON' } );

				expect( within( styles ).getByLabelText( 'Button text' ) ).toBeDisabled();
			} );

			it( 'locks the link text and Copy while a request is in flight', async () => {
				const styles = await lockedStylesTab( { format: 'LINK' } );

				expect( within( styles ).getByLabelText( 'Link text' ) ).toBeDisabled();
				expect( within( styles ).getByText( 'Copy' ) ).toBeDisabled();
			} );

			it( 'locks the caption controls while a request is in flight', async () => {
				const styles = await lockedStylesTab( { format: 'QR', qrShowCaption: true } );

				expect( within( styles ).getByLabelText( 'Show text under QR code' ) ).toBeDisabled();
				expect( within( styles ).getByLabelText( 'Caption' ) ).toBeDisabled();
			} );

			it( 'stores a width preset', async () => {
				const user = userEvent.setup();
				render( <Edit attributes={ qrAttributes } setAttributes={ setAttributes } /> );
				await expect(
					screen.findByTestId( 'inspector-controls-styles' )
				).resolves.toBeInTheDocument();

				await user.click( screen.getByText( '50%' ) );

				expect( setAttributes ).toHaveBeenCalledWith( { blockWidth: '50%' } );
			} );
		} );

		it( 'offers the delete toolbar button when a button exists', async () => {
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

			await expect(
				screen.findByTestId( 'toolbar-Delete payment link' )
			).resolves.toBeInTheDocument();
			expect( screen.queryByTestId( 'toolbar-Edit' ) ).not.toBeInTheDocument();
			expect( screen.queryByTestId( 'toolbar-Preview' ) ).not.toBeInTheDocument();
		} );

		// The form lives in the sidebar and the canvas draws the button, so both are
		// on screen at once - there is no edit mode to switch into.
		it( 'shows the form and the preview together', async () => {
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

			await expect( screen.findByLabelText( 'Product Name' ) ).resolves.toBeInTheDocument();
			expect( screen.getByTestId( 'paypal-button-preview' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'API Error Handling', () => {
		it( 'shows the API credentials instructions step when the connection check fails', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			render( <Edit attributes={ {} } setAttributes={ setAttributes } /> );

			// A failed check leaves partner referrals off, so the wizard opens on
			// the manual step instead of offering Connect PayPal.
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
