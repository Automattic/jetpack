import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { MailChimpBlockControls } from '../controls';

// Mock @wordpress/api-fetch
jest.mock( '@wordpress/api-fetch' );

// Mock API response for mailchimp groups
const MAILCHIMP_GROUPS_RESPONSE = {
	interest_categories: [
		{
			interests: [
				{ id: 1, name: 'golf' },
				{ id: 2, name: 'baseball' },
			],
		},
	],
};

describe( 'Mailchimp block controls component', () => {
	beforeEach( () => {
		apiFetch.mockClear();
		// Mock the mailchimp groups API call
		apiFetch.mockResolvedValue( MAILCHIMP_GROUPS_RESPONSE );
	} );

	afterEach( async () => {
		// Wait for any pending API calls to resolve
		await act( async () => {
			await Promise.resolve();
		} );
	} );

	afterAll( () => {
		jest.clearAllMocks();
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
		apiFetch.mockClear();
		apiFetch.mockResolvedValue( MAILCHIMP_GROUPS_RESPONSE );
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
