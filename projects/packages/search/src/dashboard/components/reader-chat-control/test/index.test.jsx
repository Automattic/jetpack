// Mocks must precede module imports so Jest can hoist them above the
// component file's own dependency chain (which would otherwise drag in
// the full `@wordpress/components` + admin-ui stack at test time).
/* eslint-disable testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package; fireEvent is intentional. */
jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	Button: ( { 'aria-label': ariaLabel, children, disabled, onClick } ) => (
		<button aria-label={ ariaLabel } disabled={ disabled } onClick={ onClick }>
			{ children }
		</button>
	),
	ColorIndicator: ( { colorValue } ) => <span data-color={ colorValue } />,
	ColorPalette: ( { 'aria-label': ariaLabel, colors, onChange, value } ) => {
		const id = `reader-chat-custom-${ ariaLabel.toLowerCase() }`;

		return (
			<div aria-label={ ariaLabel } data-value={ value }>
				<label htmlFor={ id }>
					{ `Custom ${ ariaLabel.toLowerCase() } color` }
					<input id={ id } value={ value } onChange={ event => onChange( event.target.value ) } />
				</label>
				{ colors.map( color => (
					<button key={ color.slug } onClick={ () => onChange( color.color ) }>
						{ color.name }
					</button>
				) ) }
			</div>
		);
	},
	Dropdown: ( { onToggle, renderContent, renderToggle } ) => (
		<div>
			{ renderToggle( { isOpen: true, onToggle: () => onToggle?.( false ) } ) }
			<button data-testid="open-color-picker" onClick={ () => onToggle?.( true ) }>
				Open picker
			</button>
			{ renderContent() }
		</div>
	),
	ExternalLink: ( { children, className, href } ) => (
		<a className={ className } href={ href }>
			{ children }
			<span
				aria-hidden="true"
				className="components-external-link__icon"
				data-testid="external-link-icon"
			/>
		</a>
	),
	ToggleControl: ( { checked, disabled, label, onChange } ) => {
		const id = 'reader-chat-toggle';

		return (
			<>
				<input
					id={ id }
					type="checkbox"
					checked={ !! checked }
					disabled={ !! disabled }
					onChange={ event => onChange( event.target.checked ) }
				/>
				<label htmlFor={ id }>{ label }</label>
			</>
		);
	},
	SelectControl: ( { disabled, help, label, onChange, options, value } ) => {
		const id = `reader-chat-${ label.toLowerCase().replaceAll( ' ', '-' ) }`;

		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<select
					id={ id }
					disabled={ disabled }
					onChange={ event => onChange( event.target.value ) }
					value={ value }
				>
					{ options.map( option => (
						<option key={ option.value } value={ option.value }>
							{ option.label }
						</option>
					) ) }
				</select>
				{ help && <p>{ help }</p> }
			</>
		);
	},
	TextControl: ( { disabled, help, label, maxLength, onBlur, onChange, placeholder, value } ) => {
		const id = `reader-chat-${ label.toLowerCase().replaceAll( ' ', '-' ) }`;

		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					disabled={ disabled }
					maxLength={ maxLength }
					onBlur={ onBlur }
					onChange={ event => onChange( event.target.value ) }
					placeholder={ placeholder }
					value={ value }
				/>
				{ help && <p>{ help }</p> }
			</>
		);
	},
} ) );

let mockStoredBrand;
let mockDerivedBrand;
let mockThemePalette;

jest.mock( '@wordpress/data', () => ( {
	useSelect: callback =>
		callback( () => ( {
			getReaderChatBrand: () => mockStoredBrand,
			getReaderChatBrandDefaults: () => mockDerivedBrand,
			getReaderChatBrandPalette: () => mockThemePalette,
		} ) ),
} ) );

jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Badge: ( { children, className, intent } ) => (
		<span className={ className } data-intent={ intent }>
			{ children }
		</span>
	),
} ) );

jest.mock(
	'components/card',
	() => ( { __esModule: true, default: ( { children } ) => <div>{ children }</div> } ),
	{ virtual: true }
);

jest.mock( 'store', () => ( {
	STORE_ID: 'jetpack-search-plugin',
} ) );

import { render, screen, fireEvent, within } from '@testing-library/react';
import ReaderChatControl from '../index.jsx';

const defaultProps = {
	isAvailable: true,
	isEnabled: false,
	isSaving: false,
	guidelinesUrl: 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
	updateOptions: jest.fn(),
};
const emptyBrand = {
	name: '',
	accent: '',
	greeting: '',
	help: '',
	background: '',
	outline: '',
	fontFamily: '',
};

describe( 'ReaderChatControl', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockStoredBrand = { ...emptyBrand };
		mockDerivedBrand = {
			name: 'Example Site',
			accent: '#2271b1',
			greeting: 'Ask me anything about this blog.',
			logoUrl: 'https://example.com/site-logo.png',
			siteFontFamily: 'Manrope, sans-serif',
		};
		mockThemePalette = [
			{
				name: 'Primary',
				slug: 'primary',
				color: '#2271b1',
			},
		];
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	test( 'renders nothing when the setting is not available', () => {
		const { container } = render( <ReaderChatControl { ...defaultProps } isAvailable={ false } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders the toggle reflecting the current stored value (true)', () => {
		render( <ReaderChatControl { ...defaultProps } isEnabled /> );

		const toggle = screen.getByRole( 'checkbox', {
			name: /Enable Site Chat/i,
		} );

		expect( toggle ).toBeChecked();
		expect( screen.getByRole( 'heading', { name: 'Preview' } ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', {
				name: /Set guidelines/i,
			} )
		).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin'
		);
		expect( screen.getByTestId( 'external-link-icon' ) ).toBeInTheDocument();
	} );

	test( 'does not render the guidelines link when the guidelines page is unavailable', () => {
		render( <ReaderChatControl { ...defaultProps } isEnabled guidelinesUrl="" /> );

		expect(
			screen.queryByRole( 'link', {
				name: /Set guidelines/i,
			} )
		).not.toBeInTheDocument();
	} );

	test( 'renders the toggle as off when the stored value is false', () => {
		render( <ReaderChatControl { ...defaultProps } isEnabled={ false } /> );

		const toggle = screen.getByRole( 'checkbox', {
			name: /Enable Site Chat/i,
		} );

		expect( toggle ).not.toBeChecked();
		expect(
			screen.queryByRole( 'link', {
				name: /Set guidelines/i,
			} )
		).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Assistant name' ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Greeting' ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Help text' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Accent:/ } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'img', { name: /Site Chat preview/ } ) ).not.toBeInTheDocument();
	} );

	test( 'shows the grouped identity, welcome, and appearance controls when enabled', () => {
		render( <ReaderChatControl { ...defaultProps } isEnabled /> );

		expect( screen.getByRole( 'heading', { name: 'Identity' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { name: 'Welcome message' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { name: 'Appearance' } ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Assistant name' ) ).toHaveAttribute(
			'placeholder',
			'Example Site'
		);
		expect( screen.getByLabelText( 'Greeting' ) ).toHaveAttribute(
			'placeholder',
			'Ask me anything about this blog.'
		);
		expect( screen.getByLabelText( 'Help text' ) ).toHaveAttribute(
			'placeholder',
			'Or type your own question below.'
		);
		expect( screen.getByLabelText( 'Accent' ) ).toHaveAttribute( 'data-value', '#2271b1' );
		expect( screen.getByLabelText( 'Background' ) ).toHaveAttribute( 'data-value', '#fcfcfc' );
		expect( screen.getByLabelText( 'Outline' ) ).toHaveAttribute( 'data-value', '#e9e9e9' );
		expect( screen.queryByLabelText( 'Text' ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Text size' ) ).not.toBeInTheDocument();
		expect(
			screen.getByText( 'Text color is selected automatically for readable contrast.' )
		).toBeInTheDocument();
		expect( screen.getByLabelText( 'Font' ) ).toHaveValue( 'system' );
		expect(
			within( screen.getByLabelText( 'Font' ) ).queryByText( 'Rounded' )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Reset appearance to defaults' } ) ).toBeDisabled();
		expect(
			within( screen.getByLabelText( 'Accent' ) ).getByRole( 'button', { name: 'Primary' } )
		).toBeInTheDocument();
	} );

	test( 'previews resolved defaults and updates local drafts before they are saved', () => {
		jest.useFakeTimers();
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		const preview = screen.getByRole( 'img', { name: 'Site Chat preview for Example Site' } );
		expect( within( preview ).getByText( 'Example Site' ) ).toBeInTheDocument();
		expect( within( preview ).getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://example.com/site-logo.png'
		);
		expect( within( preview ).getByText( 'Ask me anything about this blog.' ) ).toBeInTheDocument();
		expect( within( preview ).getByText( 'Or type your own question below.' ) ).toBeInTheDocument();
		expect( preview.style.getPropertyValue( '--jp-reader-chat-preview-background' ) ).toBe(
			'#fcfcfc'
		);
		expect( preview.style.getPropertyValue( '--jp-reader-chat-preview-foreground' ) ).toBe(
			'#000000'
		);
		expect( preview.style.getPropertyValue( '--jp-reader-chat-preview-accent-foreground' ) ).toBe(
			'#ffffff'
		);

		fireEvent.change( screen.getByLabelText( 'Assistant name' ), {
			target: { value: 'Ada' },
		} );
		fireEvent.change( screen.getByLabelText( 'Greeting' ), {
			target: { value: 'How can I help?' },
		} );
		fireEvent.change( screen.getByLabelText( 'Custom background color' ), {
			target: { value: '#112233' },
		} );
		fireEvent.change( screen.getByLabelText( 'Custom accent color' ), {
			target: { value: '#fea' },
		} );

		expect( within( preview ).getByText( 'Ada' ) ).toBeInTheDocument();
		expect( within( preview ).getByText( 'How can I help?' ) ).toBeInTheDocument();
		expect( preview.style.getPropertyValue( '--jp-reader-chat-preview-background' ) ).toBe(
			'#112233'
		);
		expect( preview.style.getPropertyValue( '--jp-reader-chat-preview-foreground' ) ).toBe(
			'#ffffff'
		);
		expect( preview.style.getPropertyValue( '--jp-reader-chat-preview-accent-foreground' ) ).toBe(
			'#000000'
		);
		expect( updateOptions ).not.toHaveBeenCalled();

		// The picker no longer saves on a timer; closing it is the commit boundary.
		jest.advanceTimersByTime( 500 );
		expect( updateOptions ).not.toHaveBeenCalled();
		fireEvent.click( screen.getByRole( 'button', { name: /Accent color:/ } ) );
		expect( updateOptions ).toHaveBeenCalledTimes( 1 );
		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				accent: '#fea',
				background: '#112233',
			},
		} );
	} );

	test( 'round-trips brand field changes through the settings update', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		const nameField = screen.getByLabelText( 'Assistant name' );
		fireEvent.change( nameField, { target: { value: 'Ada' } } );
		fireEvent.blur( nameField );
		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				name: 'Ada',
			},
		} );

		const greetingField = screen.getByLabelText( 'Greeting' );
		fireEvent.change( greetingField, { target: { value: 'How can I help?' } } );
		fireEvent.blur( greetingField );
		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				name: 'Ada',
				greeting: 'How can I help?',
			},
		} );

		const helpField = screen.getByLabelText( 'Help text' );
		fireEvent.change( helpField, { target: { value: 'Choose a prompt or ask below.' } } );
		fireEvent.blur( helpField );
		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				name: 'Ada',
				greeting: 'How can I help?',
				help: 'Choose a prompt or ask below.',
			},
		} );

		fireEvent.click(
			within( screen.getByLabelText( 'Accent' ) ).getByRole( 'button', { name: 'Primary' } )
		);
		expect( screen.getByRole( 'button', { name: 'Reset Accent to default' } ) ).toBeEnabled();
		fireEvent.click( screen.getByRole( 'button', { name: /Accent color:/ } ) );
		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				name: 'Ada',
				accent: '#2271b1',
				greeting: 'How can I help?',
				help: 'Choose a prompt or ask below.',
			},
		} );
	} );

	test( 'saves all pending color changes when the picker closes', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		fireEvent.change( screen.getByLabelText( 'Custom background color' ), {
			target: { value: '#112233' },
		} );
		fireEvent.change( screen.getByLabelText( 'Custom outline color' ), {
			target: { value: '#f2eff6' },
		} );

		expect( updateOptions ).not.toHaveBeenCalled();
		fireEvent.click( screen.getByRole( 'button', { name: /Outline color:/ } ) );

		expect( updateOptions ).toHaveBeenCalledTimes( 1 );
		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				background: '#112233',
				outline: '#f2eff6',
			},
		} );
	} );

	test( 'does not save when a picker opens or closes without a pending color', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		fireEvent.click( screen.getAllByTestId( 'open-color-picker' )[ 0 ] );
		fireEvent.click( screen.getByRole( 'button', { name: /Accent color:/ } ) );

		expect( updateOptions ).not.toHaveBeenCalled();
	} );

	test( 'saves a font preset as a discrete appearance change', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		fireEvent.change( screen.getByLabelText( 'Font' ), { target: { value: 'serif' } } );

		expect( screen.getByRole( 'img', { name: /Site Chat preview/ } ) ).toHaveAttribute(
			'data-font',
			'serif'
		);
		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				fontFamily: 'serif',
			},
		} );
	} );

	test( 'saves and previews the resolved site font family', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		fireEvent.change( screen.getByLabelText( 'Font' ), { target: { value: 'site' } } );

		const preview = screen.getByRole( 'img', { name: /Site Chat preview/ } );
		expect( preview ).toHaveAttribute( 'data-font', 'site' );
		expect( preview.style.getPropertyValue( '--jp-reader-chat-preview-site-font-family' ) ).toBe(
			'Manrope, sans-serif'
		);
		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				fontFamily: 'site',
			},
		} );
	} );

	test( 'does not preview an unsafe resolved site font family', () => {
		mockDerivedBrand.siteFontFamily = 'Arial; color: red';
		render( <ReaderChatControl { ...defaultProps } isEnabled /> );

		fireEvent.change( screen.getByLabelText( 'Font' ), { target: { value: 'site' } } );

		expect(
			screen
				.getByRole( 'img', { name: /Site Chat preview/ } )
				.style.getPropertyValue( '--jp-reader-chat-preview-site-font-family' )
		).toBe( '' );
	} );

	test( 'saves only the final custom accent when the picker closes', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		const picker = screen.getByLabelText( 'Custom accent color' );
		fireEvent.change( picker, { target: { value: '#111111' } } );
		fireEvent.change( picker, { target: { value: '#222222' } } );
		fireEvent.change( picker, { target: { value: '#333333' } } );

		expect( screen.getByLabelText( 'Accent' ) ).toHaveAttribute( 'data-value', '#333333' );
		expect( screen.getByRole( 'button', { name: 'Reset Accent to default' } ) ).toBeEnabled();
		expect( updateOptions ).not.toHaveBeenCalled();

		fireEvent.click( screen.getByRole( 'button', { name: /Accent color:/ } ) );
		expect( updateOptions ).toHaveBeenCalledTimes( 1 );
		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				accent: '#333333',
			},
		} );
	} );

	test( 'keeps a pending accent save across an update callback change', () => {
		const firstUpdateOptions = jest.fn();
		const finalUpdateOptions = jest.fn();
		const { rerender } = render(
			<ReaderChatControl { ...defaultProps } isEnabled updateOptions={ firstUpdateOptions } />
		);

		fireEvent.change( screen.getByLabelText( 'Custom accent color' ), {
			target: { value: '#333333' },
		} );
		mockDerivedBrand = { ...mockDerivedBrand, accent: '#444444' };
		rerender(
			<ReaderChatControl { ...defaultProps } isEnabled updateOptions={ finalUpdateOptions } />
		);
		expect( screen.getByLabelText( 'Accent' ) ).toHaveAttribute( 'data-value', '#333333' );
		expect( finalUpdateOptions ).not.toHaveBeenCalled();
		fireEvent.click( screen.getByRole( 'button', { name: /Accent color:/ } ) );

		expect( firstUpdateOptions ).not.toHaveBeenCalled();
		expect( finalUpdateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				accent: '#333333',
			},
		} );
	} );

	test( 'includes a pending accent when a text field saves first', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		fireEvent.change( screen.getByLabelText( 'Custom accent color' ), {
			target: { value: '#333333' },
		} );
		const nameField = screen.getByLabelText( 'Assistant name' );
		fireEvent.change( nameField, { target: { value: 'Ada' } } );
		fireEvent.blur( nameField );

		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				name: 'Ada',
				accent: '#333333',
			},
		} );
	} );

	test( 'keeps committed text across a referential-only store update', () => {
		const updateOptions = jest.fn();
		const { rerender } = render(
			<ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } />
		);

		const nameField = screen.getByLabelText( 'Assistant name' );
		fireEvent.change( nameField, { target: { value: 'Ada' } } );
		fireEvent.blur( nameField );
		mockStoredBrand = { ...mockStoredBrand };
		rerender( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );
		fireEvent.change( screen.getByLabelText( 'Custom accent color' ), {
			target: { value: '#333333' },
		} );
		fireEvent.click( screen.getByRole( 'button', { name: /Accent color:/ } ) );

		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				name: 'Ada',
				accent: '#333333',
			},
		} );
	} );

	test( 'flushes the final accent when the control unmounts', () => {
		const updateOptions = jest.fn();
		const { unmount } = render(
			<ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } />
		);

		fireEvent.change( screen.getByLabelText( 'Custom accent color' ), {
			target: { value: '#333333' },
		} );
		unmount();

		expect( updateOptions ).toHaveBeenCalledTimes( 1 );
		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				accent: '#333333',
			},
		} );
	} );

	test( 'does not save when the control unmounts without pending colors', () => {
		const updateOptions = jest.fn();
		const { unmount } = render(
			<ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } />
		);

		unmount();

		expect( updateOptions ).not.toHaveBeenCalled();
	} );

	test( 'saves text fields once on blur, not on every keystroke', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		const nameField = screen.getByLabelText( 'Assistant name' );
		fireEvent.change( nameField, { target: { value: 'A' } } );
		fireEvent.change( nameField, { target: { value: 'Ad' } } );
		fireEvent.change( nameField, { target: { value: 'Ada' } } );

		// Each updateOptions call is a REST save, a re-fetch, and a notice.
		expect( updateOptions ).not.toHaveBeenCalled();

		fireEvent.blur( nameField );
		expect( updateOptions ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'does not save on blur when the value is unchanged', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		fireEvent.blur( screen.getByLabelText( 'Assistant name' ) );

		expect( updateOptions ).not.toHaveBeenCalled();
	} );

	test( 'resets an accent override to the derived theme value', () => {
		mockStoredBrand.accent = '#ff0000';
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		expect( screen.getByLabelText( 'Accent' ) ).toHaveAttribute( 'data-value', '#ff0000' );
		fireEvent.change( screen.getByLabelText( 'Custom accent color' ), {
			target: { value: '#00ff00' },
		} );
		fireEvent.click( screen.getByRole( 'button', { name: 'Reset Accent to default' } ) );

		expect( updateOptions ).toHaveBeenCalledTimes( 1 );
		expect( screen.getByRole( 'button', { name: 'Reset Accent to default' } ) ).toBeDisabled();
		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: emptyBrand,
		} );
	} );

	test( 'resets all appearance overrides without changing welcome or identity fields', () => {
		mockStoredBrand = {
			...emptyBrand,
			name: 'Ada',
			greeting: 'How can I help?',
			help: 'Choose a prompt or ask below.',
			accent: '#ff0000',
			background: '#112233',
			outline: '#f2eff6',
			fontFamily: 'serif',
		};
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Reset appearance to defaults' } ) );

		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				...emptyBrand,
				name: 'Ada',
				greeting: 'How can I help?',
				help: 'Choose a prompt or ask below.',
			},
		} );
		expect( screen.getByLabelText( 'Accent' ) ).toHaveAttribute( 'data-value', '#2271b1' );
		expect( screen.getByLabelText( 'Background' ) ).toHaveAttribute( 'data-value', '#fcfcfc' );
		expect( screen.getByLabelText( 'Outline' ) ).toHaveAttribute( 'data-value', '#e9e9e9' );
		expect( screen.getByLabelText( 'Font' ) ).toHaveValue( 'system' );
		expect( screen.getByRole( 'button', { name: 'Reset appearance to defaults' } ) ).toBeDisabled();
	} );

	test( 'resets appearance after committing a picker close', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		fireEvent.change( screen.getByLabelText( 'Custom background color' ), {
			target: { value: '#112233' },
		} );
		const resetButton = screen.getByRole( 'button', { name: 'Reset appearance to defaults' } );
		fireEvent.click( screen.getByRole( 'button', { name: /Background color:/ } ) );
		fireEvent.click( resetButton );

		expect( updateOptions ).toHaveBeenCalledTimes( 2 );
		expect( updateOptions ).toHaveBeenLastCalledWith( { reader_chat_brand: emptyBrand } );
	} );

	test( 'resets a pending appearance without persisting the draft color first', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		fireEvent.change( screen.getByLabelText( 'Custom background color' ), {
			target: { value: '#112233' },
		} );
		fireEvent.click( screen.getByRole( 'button', { name: 'Reset appearance to defaults' } ) );

		expect( updateOptions ).toHaveBeenCalledTimes( 1 );
		expect( updateOptions ).toHaveBeenCalledWith( { reader_chat_brand: emptyBrand } );
	} );

	test( 'enables the appearance reset for a font-only override', () => {
		mockStoredBrand = { ...emptyBrand, fontFamily: 'serif' };
		render( <ReaderChatControl { ...defaultProps } isEnabled /> );

		expect( screen.getByRole( 'button', { name: 'Reset appearance to defaults' } ) ).toBeEnabled();
	} );

	test( 'dispatches a settings update when toggled', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } updateOptions={ updateOptions } /> );

		const toggle = screen.getByRole( 'checkbox', {
			name: /Enable Site Chat/i,
		} );
		fireEvent.click( toggle );

		expect( updateOptions ).toHaveBeenCalledWith( { reader_chat: true } );
	} );

	test( 'disables discrete controls while settings are saving', () => {
		mockStoredBrand.accent = '#ff0000';
		const updateOptions = jest.fn();
		render(
			<ReaderChatControl { ...defaultProps } isEnabled isSaving updateOptions={ updateOptions } />
		);

		expect(
			screen.getByRole( 'checkbox', {
				name: /Enable Site Chat/i,
			} )
		).toBeDisabled();
		expect( screen.getByRole( 'button', { name: 'Reset Accent to default' } ) ).toBeDisabled();
		expect( screen.getByLabelText( 'Font' ) ).toBeDisabled();
		expect( screen.getByRole( 'button', { name: 'Reset appearance to defaults' } ) ).toBeDisabled();
		fireEvent.change( screen.getByLabelText( 'Custom accent color' ), {
			target: { value: '#00ff00' },
		} );
		fireEvent.click( screen.getByRole( 'button', { name: /Accent color:/ } ) );
		expect( updateOptions ).not.toHaveBeenCalled();
	} );

	test( 'leaves text fields editable while settings are saving', () => {
		render( <ReaderChatControl { ...defaultProps } isEnabled isSaving /> );

		// Text fields save on blur, so a save is always in flight right after
		// the user leaves one. Disabling them would steal focus and drop
		// keystrokes when tabbing from one field straight into the next.
		expect( screen.getByLabelText( 'Assistant name' ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Greeting' ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Help text' ) ).toBeEnabled();
	} );
} );
