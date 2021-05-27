/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, act, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { MailChimpBlockControls } from '../controls';

const originalFetch = window.fetch;

/**
 * Mock return value for a successful fetch JSON return value.
 *
 * @return {Promise} Mock return value.
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
		render( <MailChimpBlockControls { ...defaultProps } /> );
		userEvent.paste( screen.getByLabelText( 'Email Placeholder' ), 'Enter an email address' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			emailPlaceholder: 'Enter your emailEnter an email address',
		} );
	} );

	test( 'updates processing text attribute', async () => {
		render( <MailChimpBlockControls { ...defaultProps } /> );
		userEvent.paste( screen.getByLabelText( 'Processing text' ), ' Relax!' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			processingLabel: 'Processing ... Relax!',
		} );
	} );

	test( 'updates success text attribute', async () => {
		render( <MailChimpBlockControls { ...defaultProps } /> );
		userEvent.paste( screen.getByLabelText( 'Success text' ), ' It Worked!' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			successLabel: 'Woop woop! It Worked!',
		} );
	} );

	test( 'updates error text attribute', async () => {
		render( <MailChimpBlockControls { ...defaultProps } /> );
		userEvent.paste( screen.getByLabelText( 'Error text' ), ' Epic fail!' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			errorLabel: 'Dang! Epic fail!',
		} );
	} );

	test( 'updates signup field tag attribute', async () => {
		render( <MailChimpBlockControls { ...defaultProps } /> );
		userEvent.paste( screen.getByLabelText( 'Signup Field Tag' ), 'NOW' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			signupFieldTag: 'SIGNUPNOW',
		} );
	} );

	test( 'updates signup field value attribute', async () => {
		render( <MailChimpBlockControls { ...defaultProps } /> );
		userEvent.paste( screen.getByLabelText( 'Signup Field Value' ), ' please' );
		expect( setAttributes ).toHaveBeenCalledWith( {
			signupFieldValue: 'Sign up please',
		} );
	} );

	test( 'updates selected groups', async () => {
		render( <MailChimpBlockControls { ...defaultProps } /> );
		await waitFor( () => screen.getByLabelText( 'golf' ) );
		userEvent.click( screen.getByLabelText( 'golf' ) );
		expect( setAttributes ).toHaveBeenCalledWith( {
			interests: [ 1 ],
		} );
	} );
} );
