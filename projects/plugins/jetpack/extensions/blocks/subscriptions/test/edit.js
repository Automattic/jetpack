import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

jest.mock( '../api', () => ( {
	__esModule: true,
	getSubscriberCount: jest.fn( successCallback => {
		successCallback( 100 );
	} ),
} ) );

jest.mock( '../constants', () => ( {
	IS_GRADIENT_AVAILABLE: true,
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	__experimentalUseGradient: jest.fn().mockReturnValue( {
		gradientClass: undefined,
		gradientValue: undefined,
		setGradient: jest.fn(),
	} ),
} ) );

describe( 'SubscriptionEdit', () => {
	test( 'adds correct classes to container', async () => {
		const { container } = render( <SubscriptionEdit { ...defaultProps } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( `.${ defaultProps.className }` ) ).toBeInTheDocument();
	} );

	test( 'adds correct classes when button on new line', async () => {
		const { container, rerender } = render( <SubscriptionEdit { ...defaultProps } /> );

		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( '.wp-block-jetpack-subscriptions__use-newline' )
		).not.toBeInTheDocument();

		const updatedProps = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				buttonOnNewLine: true,
			},
		};
		rerender( <SubscriptionEdit { ...updatedProps } /> );

		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( '.wp-block-jetpack-subscriptions__use-newline' )
		).toBeInTheDocument();
	} );

	test( 'renders text field with placeholder text', async () => {
		render( <SubscriptionEdit { ...defaultProps } /> );

		expect(
			screen.getByPlaceholderText( defaultAttributes.subscribePlaceholder )
		).toBeInTheDocument();
	} );

	test( 'renders button with default text', async () => {
		render( <SubscriptionEdit { ...defaultProps } /> );

		expect( screen.getByText( defaultAttributes.submitButtonText ) ).toBeInTheDocument();
	} );

	test( 'calls setAttributes handler on button when value changes', async () => {
		render( <SubscriptionEdit { ...defaultProps } /> );

		expect( screen.getByText( defaultAttributes.submitButtonText ) ).toBeInTheDocument();
	} );

	test( 'displays subscriber total', async () => {
		const user = userEvent.setup();
		render( <SubscriptionEdit { ...defaultProps } /> );
		await user.type( screen.getByText( defaultAttributes.submitButtonText ), '-right-now!' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			submitButtonText: `${ defaultAttributes.submitButtonText }-right-now!`,
		} );
	} );

	test( 'displays subscriber total after update', async () => {
		const { container, rerender } = render( <SubscriptionEdit { ...defaultProps } /> );
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( '.wp-block-jetpack-subscriptions__subscount' )
		).not.toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( '.wp-block-jetpack-subscriptions__show-subs' )
		).not.toBeInTheDocument();

		const updatedProps = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				showSubscribersTotal: true,
			},
		};
		rerender( <SubscriptionEdit { ...updatedProps } /> );

		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( '.wp-block-jetpack-subscriptions__show-subs' )
		).toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( '.wp-block-jetpack-subscriptions__subscount' )
		).toBeInTheDocument();
	} );
} );
