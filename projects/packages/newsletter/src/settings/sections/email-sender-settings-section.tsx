/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews/wp';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { NewsletterSettings, JetpackNewsletterSettings } from '../types';

interface EmailSenderSettingsSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
	jetpackSettings: JetpackNewsletterSettings | undefined;
	isNewsletterEnabled: boolean;
}

/**
 * Email Sender Settings Section Component
 *
 * Handles the sender name configuration for newsletter emails.
 *
 * @param {EmailSenderSettingsSectionProps} props - Component props
 * @return {JSX.Element} The email sender settings section
 */
export function EmailSenderSettingsSection( {
	data,
	onChange,
	onSave,
	isSaving,
	hasChanges,
	jetpackSettings,
	isNewsletterEnabled,
}: EmailSenderSettingsSectionProps ): JSX.Element {
	// Translation strings for save button
	const savingText = __( 'Saving…', 'jetpack-newsletter' );
	const saveText = __( 'Save', 'jetpack-newsletter' );

	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'jetpack_subscriptions_from_name',
			label: __( 'Sender name', 'jetpack-newsletter' ),
			type: 'text' as const,
			description: __(
				"This is the name that appears in subscribers' inboxes. It's usually the name of your newsletter or the author.",
				'jetpack-newsletter'
			),
		},
	];

	// Get the current sender name value
	const senderName = data.jetpack_subscriptions_from_name || '';

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Sender settings', 'jetpack-newsletter' ) }
			</h3>
			<fieldset className="newsletter-settings__section-content" disabled={ ! isNewsletterEnabled }>
				<DataForm
					data={ data }
					fields={ fields }
					form={ {
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
						fields: [ 'jetpack_subscriptions_from_name' ],
					} }
					onChange={ onChange }
				/>

				{ /* Inline preview of how the sender name appears in email */ }
				<div className="newsletter-settings__sender-preview">
					<p className="newsletter-settings__field-description">
						{ __( 'Preview:', 'jetpack-newsletter' ) }{ ' ' }
						<strong>
							{ senderName ||
								jetpackSettings?.displayName ||
								__( 'Your Name', 'jetpack-newsletter' ) }
						</strong>{ ' ' }
						&lt;comment-reply@wordpress.com&gt;
					</p>
				</div>

				<div className="newsletter-settings__section-actions">
					<Button
						variant="primary"
						onClick={ onSave }
						disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
						isBusy={ isSaving }
					>
						{ isSaving ? savingText : saveText }
					</Button>
				</div>
			</fieldset>
		</div>
	);
}
