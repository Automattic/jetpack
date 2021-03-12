/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { MailChimpBlockControls } from '../controls';

describe( '', () => {
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
		interests: 'Darning socks',
		signupFieldTag: 'SIGNUP',
		signupFieldValue: 'Sign up',
		connectURL: 'https://mailchimp.com',
	};

	beforeEach( () => {
		setAttributes.mockClear();
		auditionNotification.mockClear();
		clearAudition.mockClear();
	} );

	test( 'loads email placeholder input', async () => {
		render( <MailChimpBlockControls { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Email Placeholder' ) ).toBeInTheDocument();
	} );

	test( 'updates email placeholder attribute', async () => {
		render( <MailChimpBlockControls { ...defaultProps } /> );

		userEvent.paste( screen.getByLabelText( 'Email Placeholder' ), 'Enter an email address' );
		expect( setAttributes ).toHaveBeenCalledWith( {
			emailPlaceholder: 'Enter your emailEnter an email address',
		} );
	} );
} );
