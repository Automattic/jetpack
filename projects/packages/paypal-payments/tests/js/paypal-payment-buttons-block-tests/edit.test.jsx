import { fireEvent, render, screen } from '@testing-library/react';
import Edit from '../../../src/paypal-payment-buttons/edit';

// Mock Jetpack script data
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: jest.fn( () => false ), // Default to WordPress.org for tests
} ) );

// Mock WordPress dependencies
jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( { className: 'wp-block-paypal-payment-buttons' } ),
	PlainText: ( { value, onChange, placeholder, 'aria-label': ariaLabel } ) => (
		<input
			data-testid="plain-text"
			value={ value || '' }
			onChange={ e => onChange( e.target.value ) }
			placeholder={ placeholder }
			aria-label={ ariaLabel }
		/>
	),
} ) );

// Mock WordPress components
jest.mock( '@wordpress/components', () => ( {
	Notice: ( { children, status, isDismissible } ) => (
		<span data-testid="notice" data-status={ status } data-dismissible={ isDismissible }>
			{ children }
		</span>
	),
	Placeholder: ( { icon, label, instructions, notices, children } ) => (
		<div data-testid="placeholder">
			{ icon && <span data-testid="placeholder-icon"></span> }
			<h2>{ label }</h2>
			{ instructions && <p>{ instructions }</p> }
			{ notices }
			<div>{ children }</div>
		</div>
	),
	__experimentalToggleGroupControl: ( { value, onChange } ) => {
		// Mock implementation that doesn't use React.Children methods
		return (
			<div data-testid="toggle-group">
				<div>
					{ /* Simplified rendering for tests */ }
					<button
						data-testid={ `toggle-option-stacked` }
						data-selected={ value === 'stacked' }
						onClick={ () => onChange( 'stacked' ) }
					>
						Stacked Buttons
					</button>
					<button
						data-testid={ `toggle-option-single` }
						data-selected={ value === 'single' }
						onClick={ () => onChange( 'single' ) }
					>
						Single Button
					</button>
				</div>
			</div>
		);
	},
	__experimentalToggleGroupControlOption: () => null, // We're not using the actual implementation
	__experimentalItemGroup: ( { children } ) => <div data-testid="item-group">{ children }</div>,
	__experimentalItem: ( { children } ) => <div data-testid="item">{ children }</div>,
	SVG: props => <svg { ...props } />,
	Path: props => <path { ...props } />,
} ) );

// Mock @wordpress/ui
jest.mock( '@wordpress/ui', () => ( {
	Link: ( { href, children } ) => (
		<a href={ href } data-testid="link">
			{ children }
		</a>
	),
} ) );

// Mock i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	_x: text => text,
} ) );

// Mock element
jest.mock( '@wordpress/element', () => {
	const React = require( 'react' );
	return {
		createElement: React.createElement,
		useState: jest.fn().mockImplementation( initialValue => {
			const [ state, setState ] = React.useState( initialValue );
			return [ state, setState ];
		} ),
		useEffect: jest.fn().mockImplementation( ( callback, deps ) => {
			React.useEffect( () => callback(), deps ); // eslint-disable-line react-hooks/exhaustive-deps
		} ),
		createInterpolateElement: ( text, elements ) => {
			// Simple mock implementation for createInterpolateElement
			// Replace the text with actual React elements
			let result = text;

			// Replace SignupLink and LoginLink with actual Link components
			if ( elements.SignupLink ) {
				result = React.createElement(
					React.Fragment,
					null,
					'1. ',
					React.cloneElement(
						elements.SignupLink,
						{ 'data-testid': 'link' },
						React.createElement( 'strong', null, 'Sign up' )
					),
					' or ',
					React.cloneElement(
						elements.LoginLink,
						{ 'data-testid': 'link' },
						React.createElement( 'strong', null, 'log in' )
					),
					' to PayPal to get your Payment Button code.'
				);
			}

			return result;
		},
	};
} );

describe( 'Edit', () => {
	const defaultProps = {
		attributes: {
			buttonType: 'stacked',
			scriptSrc: '',
			hostedButtonId: '',
			buttonText: '',
		},
		setAttributes: jest.fn(),
		isSelected: true,
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders without crashing', () => {
		render( <Edit { ...defaultProps } /> );
		expect( screen.getByTestId( 'placeholder' ) ).toBeInTheDocument();
	} );

	it( 'displays the button type toggle control', () => {
		render( <Edit { ...defaultProps } /> );
		expect( screen.getByTestId( 'toggle-group' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'toggle-option-stacked' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'toggle-option-single' ) ).toBeInTheDocument();
	} );

	it( 'shows head code input only when stacked button type is selected', () => {
		const { rerender } = render( <Edit { ...defaultProps } /> );

		// With stacked button type, should have 2 PlainText inputs (head and body)
		const inputs = screen.getAllByTestId( 'plain-text' );
		expect( inputs ).toHaveLength( 2 );

		// Rerender with single button type
		rerender(
			<Edit
				attributes={ {
					...defaultProps.attributes,
					buttonType: 'single',
				} }
				setAttributes={ defaultProps.setAttributes }
				isSelected={ true }
			/>
		);

		// With single button type, should have only 1 PlainText input (body)
		const singleInputs = screen.getAllByTestId( 'plain-text' );
		expect( singleInputs ).toHaveLength( 1 );
	} );

	it( 'updates buttonType when toggle is clicked', () => {
		const setAttributes = jest.fn();
		render(
			<Edit
				attributes={ defaultProps.attributes }
				setAttributes={ setAttributes }
				isSelected={ true }
			/>
		);

		fireEvent.click( screen.getByTestId( 'toggle-option-single' ) ); // eslint-disable-line testing-library/prefer-user-event
		expect( setAttributes ).toHaveBeenCalledWith( {
			buttonType: 'single',
			scriptSrc: '',
			buttonText: '',
			hostedButtonId: '',
		} );
	} );

	it( 'updates scriptSrc when head code is entered', () => {
		const setAttributes = jest.fn();
		render(
			<Edit
				attributes={ { ...defaultProps.attributes } }
				setAttributes={ setAttributes }
				isSelected={ true }
			/>
		);

		const inputs = screen.getAllByTestId( 'plain-text' );
		// First input should be the head code for stacked buttons
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.change( inputs[ 0 ], {
			target: { value: '<script src="https://www.paypal.com/sdk/js?client-id=test"></script>' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
		} );
	} );

	it( 'updates hostedButtonId when body code is entered', () => {
		const setAttributes = jest.fn();
		render(
			<Edit
				attributes={ { ...defaultProps.attributes } }
				setAttributes={ setAttributes }
				isSelected={ true }
			/>
		);

		const inputs = screen.getAllByTestId( 'plain-text' );
		// For stacked buttons, body code is the second input
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.change( inputs[ 1 ], {
			target: {
				value:
					'(window.paypal_payment_buttons || window.paypal).HostedButtons({ hostedButtonId: "ABC123DEF", }).render("#paypal-container-ABC123DEF")',
			},
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			hostedButtonId: 'ABC123DEF',
			buttonText: '',
		} );
	} );

	it( 'extracts payment ID and button text from single button code', () => {
		const setAttributes = jest.fn();
		render(
			<Edit
				attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
				setAttributes={ setAttributes }
				isSelected={ true }
			/>
		);

		const inputs = screen.getAllByTestId( 'plain-text' );
		// For single buttons, there's only one input (no head code)
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.change( inputs[ 0 ], {
			target: {
				value:
					'<form action="https://www.paypal.com/ncp/payment/9J2U2LUWM4SUY" method="post"><input type="submit" value="Pay Now" /></form>',
			},
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			hostedButtonId: '9J2U2LUWM4SUY',
			buttonText: 'Pay Now',
		} );
	} );

	describe( 'PayPal Code Snippet Parsing', () => {
		it( 'parses original PayPal single button snippet correctly', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const originalSnippet = `<style>.pp-HLDQA6NDL5TLG{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}</style> <form action="https://www.paypal.com/ncp/payment/HLDQA6NDL5TLG" method="post" target="_blank" style="display:inline-grid;justify-items:center;align-content:start;gap:0.5rem;">   <input class="pp-HLDQA6NDL5TLG" type="submit" value="Buy Now" />   <img src=https://www.paypalobjects.com/images/Debit_Credit_APM.svg alt="cards" />   <section style="font-size: 0.75rem;"> Powered by <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="paypal" style="height:0.875rem;vertical-align:middle;"/></section> </form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: originalSnippet },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'HLDQA6NDL5TLG',
				buttonText: 'Buy Now',
			} );
		} );

		it( 'parses PayPal snippet with query parameters and div wrapper', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippetWithQueryParams = `<div><style>.pp-HLDQA6NDL5TLG{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}</style><form action="https://www.paypal.com/ncp/payment/HLDQA6NDL5TLG?at_code=WooNCPS_Ecom_Wordpress" method="post" target="_blank" style="display:inline-grid;justify-items:center;align-content:start;gap:0.5rem;">
  <input class="pp-HLDQA6NDL5TLG" type="submit" value="Buy Now">
  <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards">
  <section style="font-size: 0.75rem;"> Powered by <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="paypal" style="height:0.875rem;vertical-align:middle;"></section>
</form></div>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippetWithQueryParams },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'HLDQA6NDL5TLG',
				buttonText: 'Buy Now',
			} );
		} );

		it( 'parses non-self-terminating input tags correctly', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippetNonSelfTerminating = `<form action="https://www.paypal.com/ncp/payment/ABC123DEF" method="post">
				<input class="pp-ABC123DEF" type="submit" value="Purchase Item">
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippetNonSelfTerminating },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'ABC123DEF',
				buttonText: 'Purchase Item',
			} );
		} );

		it( 'handles URL with multiple query parameters', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippetMultipleParams = `<form action="https://www.paypal.com/ncp/payment/XYZ789GHI?at_code=WooNCPS_Ecom_Wordpress&utm_source=wordpress&campaign=test" method="post">
				<input type="submit" value="Subscribe" />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippetMultipleParams },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'XYZ789GHI',
				buttonText: 'Subscribe',
			} );
		} );

		it( 'handles multi-line input with various formatting', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const multiLineSnippet = `<style>
				.pp-MULTILINE123 {
					text-align: center;
				}
			</style>
			<form
				action="https://www.paypal.com/ncp/payment/MULTILINE123"
				method="post"
				target="_blank">
				<input
					class="pp-MULTILINE123"
					type="submit"
					value="Multi Line Button" />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: multiLineSnippet },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'MULTILINE123',
				buttonText: 'Multi Line Button',
			} );
		} );
	} );

	describe( 'Edge Cases Handling', () => {
		it( 'handles lowercase button IDs', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippet = `<form action="https://www.paypal.com/ncp/payment/abc123def" method="post">
				<input type="submit" value="Buy" />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippet },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'abc123def',
				buttonText: 'Buy',
			} );
		} );

		it( 'handles button IDs with hyphens and underscores', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippet = `<style>.pp-ABC-123_DEF{}</style>
				<form action="https://www.paypal.com/ncp/payment/ABC-123_DEF" method="post">
					<input class="pp-ABC-123_DEF" type="submit" value="Purchase" />
				</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippet },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'ABC-123_DEF',
				buttonText: 'Purchase',
			} );
		} );

		it( 'handles international PayPal domains', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippetUK = `<form action="https://www.paypal.co.uk/ncp/payment/UK123ABC" method="post">
				<input type="submit" value="Buy from UK" />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippetUK },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'UK123ABC',
				buttonText: 'Buy from UK',
			} );
		} );

		it( 'handles German PayPal domain', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippetDE = `<form action="https://www.paypal.de/ncp/payment/DE789XYZ" method="post">
				<input type="submit" value="Jetzt kaufen" />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippetDE },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'DE789XYZ',
				buttonText: 'Jetzt kaufen',
			} );
		} );

		it( 'handles sandbox PayPal domain', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippetSandbox = `<style>.pp-FHK6SXBKZXM4A{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}</style>
<form action="https://www.sandbox.paypal.com/ncp/payment/FHK6SXBKZXM4A" method="post" target="_blank" style="display:inline-grid;justify-items:center;align-content:start;gap:0.5rem;">
  <input class="pp-FHK6SXBKZXM4A" type="submit" value="Buy Now" />
  <img src=https://www.paypalobjects.com/images/Debit_Credit_APM.svg alt="cards" />
  <section style="font-size: 0.75rem;"> Powered by <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="paypal" style="height:0.875rem;vertical-align:middle;"/></section>
</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippetSandbox },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'FHK6SXBKZXM4A',
				buttonText: 'Buy Now',
			} );
		} );

		it( 'handles spaces around equals sign in attributes', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippet = `<form action = "https://www.paypal.com/ncp/payment/SPACES123" method="post">
				<input type="submit" value = "Buy Now" />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippet },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'SPACES123',
				buttonText: 'Buy Now',
			} );
		} );

		it( 'trims whitespace from extracted values', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippet = `<form action="https://www.paypal.com/ncp/payment/TRIM123  " method="post">
				<input type="submit" value="  Buy Now  " />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippet },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'TRIM123',
				buttonText: 'Buy Now',
			} );
		} );

		it( 'handles multiple buttons - extracts only the first', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippet = `<form action="https://www.paypal.com/ncp/payment/FIRST123" method="post">
				<input type="submit" value="First Button" />
			</form>
			<form action="https://www.paypal.com/ncp/payment/SECOND456" method="post">
				<input type="submit" value="Second Button" />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippet },
			} );

			// Should extract only the first button
			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'FIRST123',
				buttonText: 'First Button',
			} );
		} );

		it( 'handles protocol-relative URLs', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippet = `<form action="//www.paypal.com/ncp/payment/PROTOCOL123" method="post">
				<input type="submit" value="Buy" />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippet },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'PROTOCOL123',
				buttonText: 'Buy',
			} );
		} );

		it( 'handles mixed case in domain names', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ { ...defaultProps.attributes, buttonType: 'single' } }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			const snippet = `<form action="https://www.PayPal.COM/ncp/payment/MIXEDCASE123" method="post">
				<input type="submit" value="Buy" />
			</form>`;

			const inputs = screen.getAllByTestId( 'plain-text' );
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change( inputs[ 0 ], {
				target: { value: snippet },
			} );

			expect( setAttributes ).toHaveBeenCalledWith( {
				hostedButtonId: 'MIXEDCASE123',
				buttonText: 'Buy',
			} );
		} );
	} );

	describe( 'Validation Notices', () => {
		it( 'shows error notice for invalid script URL', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						scriptSrc: 'https://invalid-url.com/script.js',
						hostedButtonId: 'ABC123',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'notice' ) ).toHaveAttribute( 'data-status', 'error' );
			expect( screen.getByText( 'Invalid PayPal script URL.' ) ).toBeInTheDocument();
		} );

		it( 'shows no notice for valid stacked button data', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
						hostedButtonId: 'ABC123DEF',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			expect( screen.queryByTestId( 'notice' ) ).not.toBeInTheDocument();
		} );

		it( 'shows error notice for invalid hosted button ID', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
						hostedButtonId: 'invalid@button#id!123', // Contains invalid characters
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'notice' ) ).toHaveAttribute( 'data-status', 'error' );
			expect( screen.getByText( 'Invalid PayPal button ID.' ) ).toBeInTheDocument();
		} );

		it( 'shows error notice for invalid button text', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'single',
						hostedButtonId: 'ABC123DEF',
						buttonText: 'This is a really long button text that exceeds the maximum length allowed',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'notice' ) ).toHaveAttribute( 'data-status', 'error' );
			expect(
				screen.getByText( 'Button text must be between 1 and 50 characters.' )
			).toBeInTheDocument();
		} );

		it( 'shows validation errors even when block is selected', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						scriptSrc: 'https://invalid-url.com/script.js', // Invalid URL
						hostedButtonId: 'ABC123',
					} }
					setAttributes={ jest.fn() }
					isSelected={ true } // Block is selected
				/>
			);

			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'notice' ) ).toHaveAttribute( 'data-status', 'error' );
		} );
	} );

	it( 'renders external links to PayPal signup and login pages for WordPress.org', () => {
		render( <Edit { ...defaultProps } /> );
		const links = screen.getAllByTestId( 'link' );
		expect( links ).toHaveLength( 2 );

		// Check signup link
		expect( links[ 0 ] ).toHaveAttribute(
			'href',
			'https://www.paypal.com/bizsignup/entry?product=payment_button&utm_source=wp_org&at_code=wp_org'
		);
		expect( links[ 0 ] ).toHaveTextContent( 'Sign up' );

		// Check login link
		expect( links[ 1 ] ).toHaveAttribute(
			'href',
			'https://www.paypal.com/ncp/buttons/create?utm_source=wp_org&at_code=wp_org'
		);
		expect( links[ 1 ] ).toHaveTextContent( 'log in' );
	} );

	it( 'renders external links to PayPal signup and login pages for WordPress.com', () => {
		// Mock WordPress.com platform
		const { isWpcomPlatformSite } = require( '@automattic/jetpack-script-data' );
		isWpcomPlatformSite.mockReturnValue( true );

		render( <Edit { ...defaultProps } /> );
		const links = screen.getAllByTestId( 'link' );
		expect( links ).toHaveLength( 2 );

		// Check signup link
		expect( links[ 0 ] ).toHaveAttribute(
			'href',
			'https://www.paypal.com/bizsignup/entry?product=payment_button&utm_source=wp_com&at_code=wp_com'
		);
		expect( links[ 0 ] ).toHaveTextContent( 'Sign up' );

		// Check login link
		expect( links[ 1 ] ).toHaveAttribute(
			'href',
			'https://www.paypal.com/ncp/buttons/create?utm_source=wp_com&at_code=wp_com'
		);
		expect( links[ 1 ] ).toHaveTextContent( 'log in' );

		// Reset mock
		isWpcomPlatformSite.mockReturnValue( false );
	} );

	describe( 'Parameter Clearing on Button Type Toggle', () => {
		it( 'clears all parameters when switching from stacked to single', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
						hostedButtonId: 'ABC123DEF',
						buttonText: '',
					} }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			fireEvent.click( screen.getByTestId( 'toggle-option-single' ) ); // eslint-disable-line testing-library/prefer-user-event

			expect( setAttributes ).toHaveBeenCalledWith( {
				buttonType: 'single',
				scriptSrc: '',
				buttonText: '',
				hostedButtonId: '',
			} );
		} );

		it( 'clears all parameters when switching from single to stacked', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ {
						buttonType: 'single',
						scriptSrc: '',
						hostedButtonId: 'ABC123DEF',
						buttonText: 'Pay Now',
					} }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			fireEvent.click( screen.getByTestId( 'toggle-option-stacked' ) ); // eslint-disable-line testing-library/prefer-user-event

			expect( setAttributes ).toHaveBeenCalledWith( {
				buttonType: 'stacked',
				scriptSrc: '',
				buttonText: '',
				hostedButtonId: '',
			} );
		} );

		it( 'clears all parameters when switching to the same type', () => {
			const setAttributes = jest.fn();
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
						hostedButtonId: 'ABC123DEF',
						buttonText: '',
					} }
					setAttributes={ setAttributes }
					isSelected={ true }
				/>
			);

			fireEvent.click( screen.getByTestId( 'toggle-option-stacked' ) ); // eslint-disable-line testing-library/prefer-user-event

			// Should clear all parameters even when switching to the same type
			expect( setAttributes ).toHaveBeenCalledWith( {
				buttonType: 'stacked',
				scriptSrc: '',
				buttonText: '',
				hostedButtonId: '',
			} );
		} );
	} );

	describe( 'Preview Functionality', () => {
		it( 'shows no preview for stacked buttons', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
						hostedButtonId: 'ABC123DEF',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			// Should show the configuration form since stacked button previews are disabled
			expect( screen.getByTestId( 'placeholder' ) ).toBeInTheDocument();
			expect( screen.queryByTitle( 'PayPal Button Preview' ) ).not.toBeInTheDocument();
		} );

		it( 'shows direct button preview when block is not selected and has valid single button data', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'single',
						hostedButtonId: 'ABC123DEF',
						buttonText: 'Buy Now',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			// Single button should render directly, not in iframe
			const button = screen.getByDisplayValue( 'Buy Now' );
			expect( button ).toBeInTheDocument();
			expect( button ).toHaveAttribute( 'type', 'button' );
			expect( screen.queryByTitle( 'PayPal Button Preview' ) ).not.toBeInTheDocument();
		} );

		it( 'shows placeholder when block is not selected but data is invalid', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'single',
						hostedButtonId: '',
						buttonText: '',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			// Should show the configuration form, not the preview
			expect( screen.getByTestId( 'placeholder' ) ).toBeInTheDocument();
			expect( screen.queryByTitle( 'PayPal Button Preview' ) ).not.toBeInTheDocument();
		} );

		it( 'shows settings form when block is selected', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'single',
						hostedButtonId: 'ABC123DEF',
						buttonText: 'Buy Now',
					} }
					setAttributes={ jest.fn() }
					isSelected={ true }
				/>
			);

			expect( screen.getByTestId( 'placeholder' ) ).toBeInTheDocument();
			expect( screen.queryByTitle( 'PayPal Button Preview' ) ).not.toBeInTheDocument();
		} );

		it( 'shows preview placeholder message when data is incomplete', () => {
			// Mock the preview component to show up, but with incomplete data
			render(
				<Edit
					attributes={ {
						buttonType: 'single',
						hostedButtonId: '', // Missing button ID
						buttonText: '',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			// Should show the configuration form since data is incomplete
			expect( screen.getByTestId( 'placeholder' ) ).toBeInTheDocument();
			expect( screen.queryByTitle( 'PayPal Button Preview' ) ).not.toBeInTheDocument();
		} );
	} );
} );
