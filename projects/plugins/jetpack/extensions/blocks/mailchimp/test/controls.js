import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MailChimpBlockControls } from '../controls';

const originalFetch = window.fetch;

/**
 * Mock return value for a successful fetch JSON return value.
 *
 * @returns {Promise} Mock return value.
 */
const RESOLVED_FETCH_PROMISE = Promise.resolve( {
	interest_categories: [
		{
			interests: [
				{ id: 1, name: 'golf' },
				{ id: 2, name: 'baseball' },
			],
		},
	],
} );
const DEFAULT_FETCH_MOCK_RETURN = Promise.resolve( {
	status: 200,
	json: () => RESOLVED_FETCH_PROMISE,
} );

describe( 'Mailchimp block controls component', () => {
	beforeEach( () => {
		// eslint-disable-next-line jest/prefer-spy-on -- Nothing to spy on.
		window.fetch = jest.fn();
		window.fetch.mockReturnValue( DEFAULT_FETCH_MOCK_RETURN );
	} );

	afterEach( async () => {
		await act( () => RESOLVED_FETCH_PROMISE );
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	const setAttributes = jest.fn();
	const auditionNotification = jest.fn();
	const clearAudition = jest.fn();

	const defaultProps = {
		auditionNotification,
		clearAudition,
		setAttributes,
		emailPlaceholder: 'Enter your email',
		processingLabel: 'Processing ...',
		successLabel: 'Woop woop!',
		errorLabel: 'Dang!',
		interests: [],
		signupFieldTag: 'SIGNUP',
		signupFieldValue: 'Sign up',
		connectURL: 'https://mailchimp.com',
	};

	beforeEach( () => {
		setAttributes.mockClear();
		auditionNotification.mockClear();
		clearAudition.mockClear();
	} );

	test( 'updates email placeholder attribute', async () => {
		const user = userEvent.setup();
		render( <MailChimpBlockControls { ...defaultProps } /> );
		await user.click( screen.getByLabelText( 'Email Placeholder' ) );
		await user.paste( 'Enter an email address' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			emailPlaceholder: 'Enter your emailEnter an email address',
		} );
	} );

	test( 'updates processing text attribute', async () => {
		const user = userEvent.setup();
		render( <MailChimpBlockControls { ...defaultProps } /> );
		await user.click( screen.getByLabelText( 'Processing text' ) );
		await user.paste( ' Relax!' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			processingLabel: 'Processing ... Relax!',
		} );
	} );

	test( 'updates success text attribute', async () => {
		const user = userEvent.setup();
		render( <MailChimpBlockControls { ...defaultProps } /> );
		await user.click( screen.getByLabelText( 'Success text' ) );
		await user.paste( ' It Worked!' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			successLabel: 'Woop woop! It Worked!',
		} );
	} );

	test( 'updates error text attribute', async () => {
		const user = userEvent.setup();
		render( <MailChimpBlockControls { ...defaultProps } /> );
		await user.click( screen.getByLabelText( 'Error text' ) );
		await user.paste( ' Epic fail!' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			errorLabel: 'Dang! Epic fail!',
		} );
	} );

	test( 'updates signup field tag attribute', async () => {
		const user = userEvent.setup();
		render( <MailChimpBlockControls { ...defaultProps } /> );
		await user.click( screen.getByLabelText( 'Signup Field Tag' ) );
		await user.paste( 'NOW' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			signupFieldTag: 'SIGNUPNOW',
		} );
	} );

	test( 'updates signup field value attribute', async () => {
		const user = userEvent.setup();
		render( <MailChimpBlockControls { ...defaultProps } /> );
		await user.click( screen.getByLabelText( 'Signup Field Value' ) );
		await user.paste( ' please' );
		expect( setAttributes ).toHaveBeenCalledWith( {
			signupFieldValue: 'Sign up please',
		} );
	} );

	test( 'updates selected groups', async () => {
		const user = userEvent.setup();
		render( <MailChimpBlockControls { ...defaultProps } /> );
		await user.click( await screen.findByLabelText( 'golf' ) );
		expect( setAttributes ).toHaveBeenCalledWith( {
			interests: [ 1 ],
		} );
	} );
} );
