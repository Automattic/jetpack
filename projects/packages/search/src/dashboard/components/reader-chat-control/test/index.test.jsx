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
	ToggleControl: ( { checked, disabled, label, onChange } ) => (
		<input
			type="checkbox"
			checked={ !! checked }
			disabled={ !! disabled }
			aria-label={ label }
			onChange={ event => onChange( event.target.checked ) }
		/>
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
		expect(
			screen.getByRole( 'link', {
				name: /Set guidelines/i,
			} )
		).toHaveAttribute( 'href', 'options-general.php?page=guidelines-wp-admin' );
		expect( screen.getByTestId( 'external-link-icon' ) ).toBeInTheDocument();
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
