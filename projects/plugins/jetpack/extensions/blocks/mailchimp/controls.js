/**
 * External dependencies
 */

import { __ } from '@wordpress/i18n';
import { ExternalLink, PanelBody, TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MailchimpGroups from './mailchimp-groups';

export function MailChimpBlockControls( {
	emailPlaceholder,
	updateEmailPlaceholder,
	processingLabel,
	updateProcessingText,
	successLabel,
	updateSuccessText,
	errorLabel,
	updateErrorText,
	interests,
	setAttributes,
	signupFieldTag,
	signupFieldValue,
	connectURL,
} ) {
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
