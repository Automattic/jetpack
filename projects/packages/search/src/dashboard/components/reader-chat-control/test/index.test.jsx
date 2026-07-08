// Mocks must precede module imports so Jest can hoist them above the
// component file's own dependency chain (which would otherwise drag in
// the full `@wordpress/components` + admin-ui stack at test time).
/* eslint-disable testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package; fireEvent is intentional. */
jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
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
	} );

	test( 'renders nothing when the setting is not available', () => {
		const { container } = render( <ReaderChatControl { ...defaultProps } isAvailable={ false } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders the toggle reflecting the current stored value (true)', () => {
		render( <ReaderChatControl { ...defaultProps } isEnabled /> );

		const toggle = screen.getByRole( 'checkbox', {
			name: /Enable Reader Chat/i,
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
			name: /Enable Reader Chat/i,
		} );

		expect( toggle ).not.toBeChecked();
		expect(
			screen.queryByRole( 'link', {
				name: /Set guidelines/i,
			} )
		).not.toBeInTheDocument();
	} );

	test( 'dispatches a settings update when toggled', () => {
		const updateOptions = jest.fn();
		render( <ReaderChatControl { ...defaultProps } updateOptions={ updateOptions } /> );

		const toggle = screen.getByRole( 'checkbox', {
			name: /Enable Reader Chat/i,
		} );
		fireEvent.click( toggle );

		expect( updateOptions ).toHaveBeenCalledWith( { reader_chat: true } );
	} );

	test( 'disables the toggle while settings are saving', () => {
		render( <ReaderChatControl { ...defaultProps } isSaving /> );

		expect(
			screen.getByRole( 'checkbox', {
				name: /Enable Reader Chat/i,
			} )
		).toBeDisabled();
	} );
} );
