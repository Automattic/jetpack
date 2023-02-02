import { TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import emailValidator from 'email-validator';
import HelpMessage from '../components/help-message';
import InspectorHint from '../components/inspector-hint';

const JetpackEmailConnectionSettings = ( {
	emailAddress = '',
	emailSubject = '',
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

		if ( ! emailValidator.validate( email ) ) {
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
						/* translators: placeholder is an email address. */
						__( '%s is not a valid email address.', 'jetpack-forms' ),
						emailErrors[ 0 ].email
					);
				}
				return emailErrors[ 0 ];
			}

			if ( emailErrors.length === 2 ) {
				return sprintf(
					/* translators: placeholders are email addresses. */
					__( '%1$s and %2$s are not a valid email address.', 'jetpack-forms' ),
					emailErrors[ 0 ].email,
					emailErrors[ 1 ].email
				);
			}

			const inValidEmails = emailErrors.map( error => error.email );

			return sprintf(
				/* translators: placeholder is a list of email addresses. */
				__( '%s are not a valid email address.', 'jetpack-forms' ),
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
			<InspectorHint>
				{ __( 'Get incoming form responses sent to your email inbox:', 'jetpack-forms' ) }
			</InspectorHint>
			<TextControl
				aria-describedby={ `contact-form-${ instanceId }-email-${
					hasEmailErrors() ? 'error' : 'help'
				}` }
				label={ __( 'Email address to send to', 'jetpack-forms' ) }
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
			/>

			<HelpMessage isError id={ `contact-form-${ instanceId }-email-error` }>
				{ getEmailErrors() }
			</HelpMessage>

			<TextControl
				label={ __( 'Email subject line', 'jetpack-forms' ) }
				value={ emailSubject }
				placeholder={ __( 'Enter a subject', 'jetpack-forms' ) }
				onChange={ newSubject => setAttributes( { subject: newSubject } ) }
			/>
		</>
	);
};

export default JetpackEmailConnectionSettings;
