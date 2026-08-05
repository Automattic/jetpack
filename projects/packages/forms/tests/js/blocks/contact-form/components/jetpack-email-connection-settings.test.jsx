/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useState } from 'react';

const { default: JetpackEmailConnectionSettings } = await import(
	'../../../../../src/blocks/contact-form/components/jetpack-email-connection-settings.jsx'
);

/**
 * Stateful wrapper mirroring how the block editor feeds attributes back into the component.
 *
 * @param {object}   props               - Component props.
 * @param {Function} props.setAttributes - Spy invoked with each attribute change.
 * @param {string}   props.initialTo     - Starting value for the recipient attribute.
 * @return {import('react').JSX.Element} The settings component wired to local state.
 */
const Harness = ( { setAttributes, initialTo = '', ...props } ) => {
	const [ attributes, setLocalAttributes ] = useState( { to: initialTo, subject: '' } );

	const handleSetAttributes = useCallback(
		next => {
			setLocalAttributes( prev => ( { ...prev, ...next } ) );
			setAttributes( next );
		},
		[ setAttributes ]
	);

	return (
		<JetpackEmailConnectionSettings
			emailNotifications={ true }
			instanceId="test"
			autoRecipient="author@example.com"
			autoRecipientSource="post_author"
			autoSubject="[Test Blog] Test Post"
			{ ...props }
			emailAddress={ attributes.to }
			emailSubject={ attributes.subject }
			setAttributes={ handleSetAttributes }
		/>
	);
};

const renderSettings = ( props = {} ) => {
	const setAttributes = jest.fn();
	render( <Harness setAttributes={ setAttributes } { ...props } /> );
	return { setAttributes, field: screen.getByLabelText( 'Send email notifications to' ) };
};

describe( 'JetpackEmailConnectionSettings', () => {
	it( 'shows the fallback recipient as a placeholder rather than as a value', () => {
		const { field } = renderSettings();

		expect( field ).toHaveValue( '' );
		expect( field ).toHaveAttribute( 'placeholder', 'author@example.com' );
	} );

	it( 'explains which fallback applies', () => {
		renderSettings();

		expect(
			screen.getByText( /Leave empty to send responses to the post author/ )
		).toBeInTheDocument();
	} );

	it( 'shows the fallback subject as a placeholder', () => {
		renderSettings();

		expect( screen.getByLabelText( 'Email subject line' ) ).toHaveAttribute(
			'placeholder',
			'[Test Blog] Test Post'
		);
	} );

	it( 'saves an address identical to the fallback recipient', async () => {
		const user = userEvent.setup();
		const { setAttributes, field } = renderSettings();

		await user.type( field, 'author@example.com' );

		expect( setAttributes ).toHaveBeenLastCalledWith( { to: 'author@example.com' } );
	} );

	it( 'leaves the recipient empty when the field is cleared', async () => {
		const user = userEvent.setup();
		const { setAttributes, field } = renderSettings( { initialTo: 'someone@example.org' } );

		await user.clear( field );
		await user.tab();

		expect( setAttributes ).toHaveBeenLastCalledWith( { to: '' } );
		expect( setAttributes ).not.toHaveBeenCalledWith(
			expect.objectContaining( { to: 'author@example.com' } )
		);
	} );

	it( 'falls back to a generic placeholder when no address can be predicted', () => {
		const { field } = renderSettings( {
			autoRecipient: '',
			autoRecipientSource: 'embedding_post_author',
		} );

		expect( field ).toHaveAttribute( 'placeholder', 'name@example.com' );
		expect(
			screen.getByText( /the author of the page where this form appears/ )
		).toBeInTheDocument();
	} );
} );
