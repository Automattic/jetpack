// Mocks must precede module imports so Jest can hoist them above the
// component file's own dependency chain (which would otherwise drag in
// the full `@wordpress/components` + admin-ui stack at test time).
/* eslint-disable testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package; fireEvent is intentional. */
jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	Button: ( { children, disabled, onClick } ) => (
		<button disabled={ disabled } onClick={ onClick }>
			{ children }
		</button>
	),
	ColorPalette: ( { 'aria-label': ariaLabel, colors, onChange, value } ) => (
		<div aria-label={ ariaLabel } data-value={ value }>
			<label htmlFor="reader-chat-custom-accent">
				Custom accent color
				<input
					id="reader-chat-custom-accent"
					value={ value }
					onChange={ event => onChange( event.target.value ) }
				/>
			</label>
			{ colors.map( color => (
				<button key={ color.slug } onClick={ () => onChange( color.color ) }>
					{ color.name }
				</button>
			) ) }
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
	TextControl: ( { disabled, label, maxLength, onBlur, onChange, placeholder, value } ) => {
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

import { render, screen, fireEvent } from '@testing-library/react';
import ReaderChatControl from '../index.jsx';

const defaultProps = {
	isAvailable: true,
	isEnabled: false,
	isSaving: false,
	guidelinesUrl: 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
	updateOptions: jest.fn(),
};

describe( 'ReaderChatControl', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockStoredBrand = {
			name: '',
			accent: '',
			greeting: '',
		};
		mockDerivedBrand = {
			name: 'Example Site',
			accent: '#2271b1',
			greeting: 'Ask me anything about this blog.',
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
		expect( screen.getByText( 'Preview' ) ).toBeInTheDocument();
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
		expect( screen.queryByLabelText( 'Accent color' ) ).not.toBeInTheDocument();
	} );

	test( 'shows derived brand values as placeholders when enabled', () => {
		render( <ReaderChatControl { ...defaultProps } isEnabled /> );

		expect( screen.getByLabelText( 'Assistant name' ) ).toHaveAttribute(
			'placeholder',
			'Example Site'
		);
		expect( screen.getByLabelText( 'Greeting' ) ).toHaveAttribute(
			'placeholder',
			'Ask me anything about this blog.'
		);
		expect( screen.getByLabelText( 'Accent color' ) ).toHaveAttribute( 'data-value', '#2271b1' );
		expect( screen.getByRole( 'button', { name: 'Primary' } ) ).toBeInTheDocument();
	} );

	test( 'round-trips brand field changes through the settings update', () => {
		jest.useFakeTimers();
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		const nameField = screen.getByLabelText( 'Assistant name' );
		fireEvent.change( nameField, { target: { value: 'Ada' } } );
		fireEvent.blur( nameField );
		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				name: 'Ada',
				accent: '',
				greeting: '',
			},
		} );

		const greetingField = screen.getByLabelText( 'Greeting' );
		fireEvent.change( greetingField, { target: { value: 'How can I help?' } } );
		fireEvent.blur( greetingField );
		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				name: 'Ada',
				accent: '',
				greeting: 'How can I help?',
			},
		} );

		fireEvent.click( screen.getByRole( 'button', { name: 'Primary' } ) );
		expect( screen.getByRole( 'button', { name: 'Reset to theme' } ) ).toBeEnabled();
		jest.advanceTimersByTime( 500 );
		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				name: 'Ada',
				accent: '#2271b1',
				greeting: 'How can I help?',
			},
		} );
	} );

	test( 'saves only the final custom accent after the picker settles', () => {
		jest.useFakeTimers();
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		const picker = screen.getByLabelText( 'Custom accent color' );
		fireEvent.change( picker, { target: { value: '#111111' } } );
		fireEvent.change( picker, { target: { value: '#222222' } } );
		fireEvent.change( picker, { target: { value: '#333333' } } );

		expect( screen.getByLabelText( 'Accent color' ) ).toHaveAttribute( 'data-value', '#333333' );
		expect( screen.getByRole( 'button', { name: 'Reset to theme' } ) ).toBeEnabled();
		expect( updateOptions ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 499 );
		expect( updateOptions ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );
		expect( updateOptions ).toHaveBeenCalledTimes( 1 );
		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				name: '',
				accent: '#333333',
				greeting: '',
			},
		} );
	} );

	test( 'keeps a pending accent save across an update callback change', () => {
		jest.useFakeTimers();
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
		expect( screen.getByLabelText( 'Accent color' ) ).toHaveAttribute( 'data-value', '#333333' );
		jest.advanceTimersByTime( 500 );

		expect( firstUpdateOptions ).not.toHaveBeenCalled();
		expect( finalUpdateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				name: '',
				accent: '#333333',
				greeting: '',
			},
		} );
	} );

	test( 'includes a pending accent when a text field saves first', () => {
		jest.useFakeTimers();
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
				name: 'Ada',
				accent: '#333333',
				greeting: '',
			},
		} );

		jest.advanceTimersByTime( 500 );
		expect( updateOptions ).toHaveBeenLastCalledWith( {
			reader_chat_brand: {
				name: 'Ada',
				accent: '#333333',
				greeting: '',
			},
		} );
	} );

	test( 'flushes the final accent when the control unmounts', () => {
		jest.useFakeTimers();
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
				name: '',
				accent: '#333333',
				greeting: '',
			},
		} );
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
		jest.useFakeTimers();
		mockStoredBrand.accent = '#ff0000';
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } isEnabled updateOptions={ updateOptions } /> );

		expect( screen.getByLabelText( 'Accent color' ) ).toHaveAttribute( 'data-value', '#ff0000' );
		fireEvent.change( screen.getByLabelText( 'Custom accent color' ), {
			target: { value: '#00ff00' },
		} );
		fireEvent.click( screen.getByRole( 'button', { name: 'Reset to theme' } ) );
		jest.advanceTimersByTime( 500 );

		expect( updateOptions ).toHaveBeenCalledTimes( 1 );
		expect( screen.getByRole( 'button', { name: 'Reset to theme' } ) ).toBeDisabled();
		expect( updateOptions ).toHaveBeenCalledWith( {
			reader_chat_brand: {
				name: '',
				accent: '',
				greeting: '',
			},
		} );
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
		render( <ReaderChatControl { ...defaultProps } isEnabled isSaving /> );

		expect(
			screen.getByRole( 'checkbox', {
				name: /Enable Site Chat/i,
			} )
		).toBeDisabled();
		expect( screen.getByRole( 'button', { name: 'Reset to theme' } ) ).toBeDisabled();
	} );

	test( 'leaves text fields editable while settings are saving', () => {
		render( <ReaderChatControl { ...defaultProps } isEnabled isSaving /> );

		// Text fields save on blur, so a save is always in flight right after
		// the user leaves one. Disabling them would steal focus and drop
		// keystrokes when tabbing from one field straight into the next.
		expect( screen.getByLabelText( 'Assistant name' ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Greeting' ) ).toBeEnabled();
	} );
} );
