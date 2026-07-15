import { TextControl, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { validate as emailValidatorValidate } from 'email-validator';

const JetpackEmailConnectionSettings = ( {
	emailAddress = '',
	emailSubject = '',
	emailNotifications = true,
	instanceId,
	setAttributes,
	postAuthorEmail,
} ) => {
	const [ emailErrors, setEmailErrors ] = useState( false );

	const validateEmail = email => {
		email = email.trim();

		if ( email.length === 0 ) {
			return false; // ignore the empty emails
		}

		if ( ! emailValidatorValidate( email ) ) {
			return { email };
		}

		return false;
	};

	const hasEmailErrors = () => {
		return emailErrors && emailErrors.length > 0;
	};

	const getEmailErrors = () => {
		if ( emailErrors ) {
			if ( emailErrors.length === 1 ) {
				if ( emailErrors[ 0 ] && emailErrors[ 0 ].email ) {
					return sprintf(
						/* translators: %s: an email address. */
						__( '%s is not a valid email address.', 'jetpack-forms' ),
						emailErrors[ 0 ].email
					);
				}
				return emailErrors[ 0 ];
			}

			if ( emailErrors.length === 2 ) {
				return sprintf(
					/* translators: %1$s, %2$s: email addresses. */
					__( '%1$s and %2$s are not valid email addresses.', 'jetpack-forms' ),
					emailErrors[ 0 ].email,
					emailErrors[ 1 ].email
				);
			}

			const inValidEmails = emailErrors.map( error => error.email );

			return sprintf(
				/* translators: %s: a list of email addresses. */
				__( '%s are not valid email addresses.', 'jetpack-forms' ),
				inValidEmails.join( ', ' )
			);
		}

		return null;
	};

	const onBlurEmailField = e => {
		if ( e.target.value.length === 0 ) {
			setEmailErrors( false );
			setAttributes( { to: postAuthorEmail } );
			return;
		}

		const error = e.target.value.split( ',' ).map( validateEmail ).filter( Boolean );

		if ( error && error.length ) {
			setEmailErrors( error );
		}
	};

	const onChangeEmailField = email => {
		setEmailErrors( false );
		setAttributes( { to: email.trim() } );
	};

	return (
		<>
			<ToggleControl
				label={ __( 'Email me new responses', 'jetpack-forms' ) }
				checked={ emailNotifications }
				onChange={ value => setAttributes( { emailNotifications: value } ) }
				__nextHasNoMarginBottom={ true }
			/>
			{ emailNotifications && (
				<>
					<TextControl
						aria-describedby={ `contact-form-${ instanceId }-email-${
							hasEmailErrors() ? 'error' : 'help'
						}` }
						label={ __( 'Send email notifications to', 'jetpack-forms' ) }
						placeholder={ __( 'name@example.com', 'jetpack-forms' ) }
						onKeyDown={ e => {
							if ( event.key === 'Enter' ) {
								e.preventDefault();
								e.stopPropagation();
							}
						} }
						value={ emailAddress }
						onBlur={ onBlurEmailField }
						onChange={ onChangeEmailField }
						help={ __(
							'You can enter multiple email addresses separated by commas.',
							'jetpack-forms'
						) }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>

					{ hasEmailErrors() && (
						<Notice.Root
							intent="error"
							id={ `contact-form-${ instanceId }-email-error` }
							style={ { marginBottom: '16px' } }
						>
							<Notice.Description>{ getEmailErrors() }</Notice.Description>
						</Notice.Root>
					) }

					<TextControl
						label={ __( 'Email subject line', 'jetpack-forms' ) }
						value={ emailSubject }
						placeholder={ __( 'Enter a subject', 'jetpack-forms' ) }
						onChange={ newSubject => setAttributes( { subject: newSubject } ) }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
				</>
			) }
		</>
	);
};

export default JetpackEmailConnectionSettings;
