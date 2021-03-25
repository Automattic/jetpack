/**
 * External dependencies
 */
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { SubscriptionEdit } from '../edit';

const setAttributes = jest.fn();

const defaultAttributes = {
	borderRadius: 0,
	borderWeight: 0,
	padding: 0,
	spacing: 0,
	submitButtonText: 'Submit',
	subscribePlaceholder: 'Do it',
	showSubscribersTotal: false,
	buttonOnNewLine: false,
};

const defaultProps = {
	attributes: defaultAttributes,
	className: 'noodles',
	setAttributes,
	emailFieldBackgroundColor: '',
	buttonBackgroundColor: '',
	setButtonBackgroundColor: '',
	fallbackButtonBackgroundColo: '',
	textColor: '',
	fallbackTextColor: '',
	setTextColor: '',
	borderColor: '',
	fontSize: 12,
};

const originalFetch = window.fetch;

/**
 * Mock return value for a successful fetch JSON return value.
 *
 * @return {Promise} Mock return value.
 */
const RESOLVED_FETCH_PROMISE = Promise.resolve( { count: 100 } );
const DEFAULT_FETCH_MOCK_RETURN = Promise.resolve( {
	status: 200,
	json: () => RESOLVED_FETCH_PROMISE,
} );

jest.mock( '../constants', () => ( {
	IS_GRADIENT_AVAILABLE: true
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	__experimentalUseGradient: jest.fn().mockReturnValue( {
		gradientClass: undefined,
		gradientValue: undefined,
		setGradient: jest.fn()
	} ),
} ) );

describe( 'SubscriptionEdit', () => {
	beforeEach( () => {
		window.fetch = jest.fn();
		window.fetch.mockReturnValue( DEFAULT_FETCH_MOCK_RETURN );
	} );

	afterEach( async () => {
		await act( () => RESOLVED_FETCH_PROMISE );
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	test( 'adds correct classes to container', () => {
		const { container, rerender } = render( <SubscriptionEdit { ...defaultProps }  /> );

		expect( container.querySelector( `.${ defaultProps.className }` ) ).toBeInTheDocument();
	} );

	test( 'adds correct classes when button on new line', () => {
		const { container, rerender } = render( <SubscriptionEdit { ...defaultProps }  /> );

		expect( container.querySelector( '.wp-block-jetpack-subscriptions__use-newline' ) ).not.toBeInTheDocument();

		const updatedProps = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				buttonOnNewLine: true,
			},
		};
		rerender( <SubscriptionEdit { ...updatedProps }  /> );

		expect( container.querySelector( '.wp-block-jetpack-subscriptions__use-newline' ) ).toBeInTheDocument();
	} );

	test( 'renders text field with placeholder text', () => {
		render( <SubscriptionEdit { ...defaultProps }  /> );

		expect( screen.getByPlaceholderText( defaultAttributes.subscribePlaceholder ) ).toBeInTheDocument();
	} );

	test( 'renders button with default text', () => {
		render( <SubscriptionEdit { ...defaultProps }  /> );

		expect( screen.getByText( defaultAttributes.submitButtonText ) ).toBeInTheDocument();
	} );

	test( 'calls setAttributes handler on button when value changes', () => {
		render( <SubscriptionEdit { ...defaultProps }  /> );

		expect( screen.getByText( defaultAttributes.submitButtonText ) ).toBeInTheDocument();
	} );

	test( 'displays subscriber total', () => {
		render( <SubscriptionEdit { ...defaultProps }  /> );
		userEvent.type( screen.getByText( defaultAttributes.submitButtonText ), ' right now!' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			submitButtonText: `${ defaultAttributes.submitButtonText} right now!`,
		} );
	} );

	test( 'displays subscriber total', () => {
		const { container, rerender } = render( <SubscriptionEdit { ...defaultProps }  /> );
		expect( container.querySelector( 'p' ) ).not.toBeInTheDocument();
		expect( container.querySelector( '.wp-block-jetpack-subscriptions__show-subs' ) ).not.toBeInTheDocument();

		const updatedProps = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				showSubscribersTotal: true,
			},
		};
		rerender( <SubscriptionEdit { ...updatedProps }  /> );

		expect( container.querySelector( '.wp-block-jetpack-subscriptions__show-subs' ) ).toBeInTheDocument();
		expect( container.querySelector( 'p' ) ).toBeInTheDocument();
	} );
} );
