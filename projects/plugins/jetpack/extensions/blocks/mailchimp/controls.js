import { ExternalLink, PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { NOTIFICATION_PROCESSING, NOTIFICATION_SUCCESS, NOTIFICATION_ERROR } from './constants';
import MailchimpGroups from './mailchimp-groups';

export function MailChimpBlockControls( {
	auditionNotification,
	clearAudition,
	setAttributes,
	emailPlaceholder,
	processingLabel,
	successLabel,
	errorLabel,
	interests,
	signupFieldTag,
	signupFieldValue,
	connectURL,
} ) {
	const updateProcessingText = processing => {
		setAttributes( { processingLabel: processing } );
		auditionNotification( NOTIFICATION_PROCESSING );
	};

	const updateEmailPlaceholder = email => {
		setAttributes( { emailPlaceholder: email } );
		clearAudition();
	};

	const updateSuccessText = success => {
		setAttributes( { successLabel: success } );
		auditionNotification( NOTIFICATION_SUCCESS );
	};

	const updateErrorText = error => {
		setAttributes( { errorLabel: error } );
		auditionNotification( NOTIFICATION_ERROR );
	};

	return (
		<>
			<PanelBody title={ __( 'Text Elements', 'jetpack' ) }>
				<TextControl
					label={ __( 'Email Placeholder', 'jetpack' ) }
					value={ emailPlaceholder }
					onChange={ updateEmailPlaceholder }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Notifications', 'jetpack' ) }>
				<TextControl
					label={ __( 'Processing text', 'jetpack' ) }
					value={ processingLabel }
					onChange={ updateProcessingText }
				/>
				<TextControl
					label={ __( 'Success text', 'jetpack' ) }
					value={ successLabel }
					onChange={ updateSuccessText }
				/>
				<TextControl
					label={ __( 'Error text', 'jetpack' ) }
					value={ errorLabel }
					onChange={ updateErrorText }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Mailchimp Groups', 'jetpack' ) }>
				<MailchimpGroups
					interests={ interests }
					onChange={ ( id, checked ) => {
						// Create a Set to insure no duplicate interests
						const deDupedInterests = [ ...new Set( [ ...interests, id ] ) ];
						// Filter the clicked interest based on checkbox's state.
						const updatedInterests = deDupedInterests.filter( item =>
							item === id && ! checked ? false : item
						);
						setAttributes( {
							interests: updatedInterests,
						} );
					} }
				/>
				<ExternalLink href="https://mailchimp.com/help/send-groups-audience/">
					{ __( 'Learn about groups', 'jetpack' ) }
				</ExternalLink>
			</PanelBody>
			<PanelBody title={ __( 'Signup Location Tracking', 'jetpack' ) }>
				<TextControl
					label={ __( 'Signup Field Tag', 'jetpack' ) }
					placeholder={ __( 'SIGNUP', 'jetpack' ) }
					value={ signupFieldTag }
					onChange={ value => setAttributes( { signupFieldTag: value } ) }
				/>
				<TextControl
					label={ __( 'Signup Field Value', 'jetpack' ) }
					placeholder={ __( 'website', 'jetpack' ) }
					value={ signupFieldValue }
					onChange={ value => setAttributes( { signupFieldValue: value } ) }
				/>
				<ExternalLink href="https://mailchimp.com/help/determine-webpage-signup-location/">
					{ __( 'Learn about signup location tracking', 'jetpack' ) }
				</ExternalLink>
			</PanelBody>
			<PanelBody title={ __( 'Mailchimp Connection', 'jetpack' ) }>
				<ExternalLink href={ connectURL }>{ __( 'Manage Connection', 'jetpack' ) }</ExternalLink>
			</PanelBody>
		</>
	);
}
