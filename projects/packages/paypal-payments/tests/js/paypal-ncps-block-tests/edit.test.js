import { fireEvent, render, screen } from '@testing-library/react';
import Edit from '../../../src/paypal-ncps/edit';

// Mock WordPress dependencies
jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( { className: 'wp-block-pncps-paypal-ncps' } ),
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
	ExternalLink: ( { href, children } ) => (
		<a href={ href } data-testid="external-link">
			{ children }
		</a>
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
	SVG: props => <svg { ...props } />,
	Path: props => <path { ...props } />,
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
		createInterpolateElement: text => text,
	};
} );

describe( 'Edit', () => {
	const defaultProps = {
		attributes: {
			buttonType: 'stacked',
			codeHead: '',
			codeBody: '',
		},
		setAttributes: jest.fn(),
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
			/>
		);

		// With single button type, should have only 1 PlainText input (body)
		const singleInputs = screen.getAllByTestId( 'plain-text' );
		expect( singleInputs ).toHaveLength( 1 );
	} );

	it( 'updates buttonType when toggle is clicked', () => {
		const setAttributes = jest.fn();
		render( <Edit attributes={ defaultProps.attributes } setAttributes={ setAttributes } /> );

		fireEvent.click( screen.getByTestId( 'toggle-option-single' ) ); // eslint-disable-line testing-library/prefer-user-event
		expect( setAttributes ).toHaveBeenCalledWith( {
			buttonType: 'single',
		} );
	} );

	it( 'updates codeHead when text is entered', () => {
		const setAttributes = jest.fn();
		render(
			<Edit attributes={ { ...defaultProps.attributes } } setAttributes={ setAttributes } />
		);

		const inputs = screen.getAllByTestId( 'plain-text' );
		// First input should be the head code for stacked buttons
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.change( inputs[ 0 ], {
			target: { value: '<script src="test"></script>' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			codeHead: '<script src="test"></script>',
		} );
	} );

	it( 'updates codeBody when text is entered', () => {
		const setAttributes = jest.fn();
		render(
			<Edit attributes={ { ...defaultProps.attributes } } setAttributes={ setAttributes } />
		);

		const inputs = screen.getAllByTestId( 'plain-text' );
		// For stacked buttons, body code is the second input
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.change( inputs[ 1 ], {
			target: { value: '<div id="paypal-container"></div>' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			codeBody: '<div id="paypal-container"></div>',
		} );
	} );

	describe( 'Validation Notices', () => {
		it( 'shows error notice for invalid stacked button code', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						codeBody: '<button>Invalid PayPal Button</button>',
						codeHead: '',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'notice' ) ).toHaveAttribute( 'data-status', 'error' );
			expect(
				screen.getByText( 'This does not look like a valid PayPal button.' )
			).toBeInTheDocument();
		} );

		it( 'shows no notice for valid stacked button code', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						codeBody: '<div id="paypal-container-test"></div>',
						codeHead: '<script src="https://www.paypal.com/sdk/js?client-id=test"></script>',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			expect( screen.queryByTestId( 'notice' ) ).not.toBeInTheDocument();
		} );

		it( 'shows warning notice for stacked button missing SDK script', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						codeBody: '<div id="paypal-container-test"></div>',
						codeHead: 'missing sdk script',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'notice' ) ).toHaveAttribute( 'data-status', 'warning' );
			expect( screen.getByText( /Missing PayPal head script/ ) ).toBeInTheDocument();
		} );

		it( 'shows error notice for single button not containing three PayPal domains', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'single',
						codeBody: `
                            <form action="https://www.sandbox.example.com/ncp/payment/123" method="post">
                                <input type="submit" value="Buy Now" />
                                <img src="https://www.paypalobjects.com/image1.svg" />
                                <img src="https://www.paypalobjects.com/image2.svg" />
                            </form>
                        `,
						codeHead: '',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'notice' ) ).toHaveAttribute( 'data-status', 'error' );
		} );

		it( 'shows no notice for valid single button containing three PayPal domains', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'single',
						codeBody: `
                            <form action="https://www.paypal.com/123" method="post">
                                <input type="submit" value="Buy Now" />
                                <img src="https://www.paypalobjects.com/image.svg" />
                                <section>Powered by <img src="https://www.paypalobjects.com/logo.svg" /></section>
                            </form>
                        `,
						codeHead: '',
					} }
					setAttributes={ jest.fn() }
					isSelected={ false }
				/>
			);

			expect( screen.queryByTestId( 'notice' ) ).not.toBeInTheDocument();
		} );

		it( 'does not show notice when block is selected', () => {
			render(
				<Edit
					attributes={ {
						buttonType: 'stacked',
						codeBody: '<button>Invalid PayPal Button</button>', // Invalid code
						codeHead: '',
					} }
					setAttributes={ jest.fn() }
					isSelected={ true } // Block is selected
				/>
			);

			expect( screen.queryByTestId( 'notice' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'renders external link to PayPal buttons page', () => {
		render( <Edit { ...defaultProps } /> );
		const link = screen.getByTestId( 'external-link' );
		expect( link ).toBeInTheDocument();
		expect( link ).toHaveAttribute( 'href', 'https://www.paypal.com/buttons/' );
		expect( link ).toHaveTextContent( 'Go to PayPal NCPS to get your button code' );
	} );
} );
