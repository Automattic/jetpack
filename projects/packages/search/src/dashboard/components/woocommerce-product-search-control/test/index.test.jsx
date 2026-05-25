// Mocks must precede module imports so Jest can hoist them above the
// component file's own dependency chain (which would otherwise drag in
// the full `@wordpress/components` + admin-ui stack at test time).
/* eslint-disable testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package; fireEvent is intentional. */
const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: ( ...args ) => mockRecordEvent( ...args ) } },
} ) );

jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	ToggleControl: ( { checked, disabled, label, onChange } ) => (
		<input
			type="checkbox"
			checked={ !! checked }
			disabled={ !! disabled }
			aria-label={ label }
			onChange={ event => onChange( event.target.checked ) }
		/>
	),
	ExternalLink: ( { href, children } ) => <a href={ href }>{ children }</a>,
} ) );

import { render, screen, fireEvent } from '@testing-library/react';
import WooCommerceProductSearchControl from '../index.jsx';

const defaultProps = {
	isEnabled: false,
	isSaving: false,
	updateOptions: jest.fn(),
};

const getToggle = () =>
	screen.getByRole( 'checkbox', { name: /Use Jetpack Search for product search results/i } );

describe( 'WooCommerceProductSearchControl', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders the toggle reflecting the current stored value', () => {
		render( <WooCommerceProductSearchControl { ...defaultProps } isEnabled /> );

		expect( getToggle() ).toBeChecked();
	} );

	test( 'renders the toggle as off when the stored value is false', () => {
		render( <WooCommerceProductSearchControl { ...defaultProps } isEnabled={ false } /> );

		expect( getToggle() ).not.toBeChecked();
	} );

	test( 'dispatches a settings update and records an event when toggled on', () => {
		const updateOptions = jest.fn();
		render(
			<WooCommerceProductSearchControl { ...defaultProps } updateOptions={ updateOptions } />
		);

		fireEvent.click( getToggle() );

		expect( updateOptions ).toHaveBeenCalledWith( {
			override_woocommerce_search_template: true,
		} );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_search_woocommerce_search_template_override_toggle',
			{ override_woocommerce_search_template: true }
		);
	} );

	test( 'dispatches the inverse value when toggled off', () => {
		const updateOptions = jest.fn();
		render(
			<WooCommerceProductSearchControl
				{ ...defaultProps }
				isEnabled
				updateOptions={ updateOptions }
			/>
		);

		fireEvent.click( getToggle() );

		expect( updateOptions ).toHaveBeenCalledWith( {
			override_woocommerce_search_template: false,
		} );
	} );

	test( 'disables the toggle while saving', () => {
		render( <WooCommerceProductSearchControl { ...defaultProps } isSaving /> );

		expect( getToggle() ).toBeDisabled();
	} );

	test( 'shows the edit-template link only when enabled', () => {
		const url = 'https://example.com/wp-admin/site-editor.php?p=x';
		const { rerender } = render(
			<WooCommerceProductSearchControl { ...defaultProps } editTemplateUrl={ url } />
		);
		expect(
			screen.queryByRole( 'link', { name: /edit the product search template/i } )
		).not.toBeInTheDocument();

		rerender(
			<WooCommerceProductSearchControl { ...defaultProps } isEnabled editTemplateUrl={ url } />
		);
		expect(
			screen.getByRole( 'link', { name: /edit the product search template/i } )
		).toHaveAttribute( 'href', url );
	} );
} );
