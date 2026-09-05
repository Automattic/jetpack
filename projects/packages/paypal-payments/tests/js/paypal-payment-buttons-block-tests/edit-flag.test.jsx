import { render, screen } from '@testing-library/react';
import Edit, { API_MANAGED_BUTTONS_FLAG } from '../../../src/paypal-payment-buttons/edit';

const mockHasFeatureFlag = jest.fn();
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: flag => mockHasFeatureFlag( flag ),
} ) );

jest.mock( '../../../src/paypal-payment-buttons/edit-api-managed', () => () => (
	<div data-testid="api-managed-edit" />
) );
jest.mock( '../../../src/paypal-payment-buttons/edit-paste-code', () => () => (
	<div data-testid="paste-code-edit" />
) );
jest.mock(
	'../../../src/paypal-payment-buttons/components/paypal-button-preview',
	() =>
		( { productName } ) => <div data-testid="button-preview">{ productName }</div>
);

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( { className: 'wp-block-jetpack-paypal-payment-buttons' } ),
} ) );
jest.mock( '@wordpress/components', () => ( {
	Notice: ( { children, status } ) => (
		<div data-testid="notice" data-status={ status }>
			{ children }
		</div>
	),
} ) );
jest.mock( '@wordpress/i18n', () => ( { __: text => text } ) );

const apiManagedAttributes = {
	isApiManaged: true,
	resourceId: 'PLB-123',
	paymentLink: 'https://www.paypal.com/ncp/payment/PLB-123',
	productName: 'Coffee',
	price: '5.00',
	currencyCode: 'USD',
};

describe( 'PayPal Payment Buttons edit switch', () => {
	beforeEach( () => {
		mockHasFeatureFlag.mockReset();
	} );

	test( 'reads the API-managed buttons flag', () => {
		mockHasFeatureFlag.mockReturnValue( false );

		render( <Edit attributes={ {} } setAttributes={ jest.fn() } /> );

		expect( mockHasFeatureFlag ).toHaveBeenCalledWith( API_MANAGED_BUTTONS_FLAG );
		expect( API_MANAGED_BUTTONS_FLAG ).toBe( 'paypal-payments-api-managed-buttons' );
	} );

	test( 'renders the paste-code editor while the flag is off', () => {
		mockHasFeatureFlag.mockReturnValue( false );

		render( <Edit attributes={ {} } setAttributes={ jest.fn() } /> );

		expect( screen.getByTestId( 'paste-code-edit' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'api-managed-edit' ) ).not.toBeInTheDocument();
	} );

	test( 'renders the API-managed editor while the flag is on', () => {
		mockHasFeatureFlag.mockReturnValue( true );

		render( <Edit attributes={ {} } setAttributes={ jest.fn() } /> );

		expect( screen.getByTestId( 'api-managed-edit' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'paste-code-edit' ) ).not.toBeInTheDocument();
	} );

	test( 'renders a paste-code block in the API-managed editor while the flag is on', () => {
		mockHasFeatureFlag.mockReturnValue( true );

		render(
			<Edit
				attributes={ { hostedButtonId: 'ABC123', buttonType: 'single' } }
				setAttributes={ jest.fn() }
			/>
		);

		expect( screen.getByTestId( 'api-managed-edit' ) ).toBeInTheDocument();
	} );

	test( 'shows a read-only preview of an API-managed button while the flag is off', () => {
		mockHasFeatureFlag.mockReturnValue( false );

		render( <Edit attributes={ apiManagedAttributes } setAttributes={ jest.fn() } /> );

		expect( screen.getByTestId( 'button-preview' ) ).toHaveTextContent( 'Coffee' );
		expect( screen.getByTestId( 'notice' ) ).toHaveTextContent( 'cannot be edited right now' );
		expect( screen.queryByTestId( 'paste-code-edit' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'api-managed-edit' ) ).not.toBeInTheDocument();
	} );

	test( 'falls back to the paste-code editor for an API-managed block without a resource', () => {
		mockHasFeatureFlag.mockReturnValue( false );

		render(
			<Edit attributes={ { isApiManaged: true, resourceId: '' } } setAttributes={ jest.fn() } />
		);

		expect( screen.getByTestId( 'paste-code-edit' ) ).toBeInTheDocument();
	} );
} );
