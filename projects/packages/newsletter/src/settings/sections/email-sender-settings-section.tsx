/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { JetpackNewsletterSettings } from '../types';

interface EmailSenderSettingsSectionProps {
	jetpackSettings: JetpackNewsletterSettings | undefined;
	senderName: string;
	onSenderNameChange: ( e: React.ChangeEvent< HTMLInputElement > ) => void;
	onSenderNameSave: () => void;
	isSavingSenderName: boolean;
	hasSenderNameChanged: boolean;
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
	jetpackSettings,
	senderName,
	onSenderNameChange,
	onSenderNameSave,
	isSavingSenderName,
	hasSenderNameChanged,
	isNewsletterEnabled,
}: EmailSenderSettingsSectionProps ): JSX.Element {
	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Sender settings', 'jetpack-newsletter' ) }
			</h3>
			<fieldset className="newsletter-settings__section-content" disabled={ ! isNewsletterEnabled }>
				<div className="newsletter-settings__sender-name">
					<label htmlFor="sender-name-input" className="newsletter-settings__field-label">
						{ __( 'Sender name', 'jetpack-newsletter' ) }
					</label>
					<div className="newsletter-settings__sender-name-controls">
						<input
							id="sender-name-input"
							type="text"
							className="newsletter-settings__text-input"
							value={ senderName }
							onChange={ onSenderNameChange }
						/>
						{ hasSenderNameChanged && (
							<Button
								variant="primary"
								onClick={ onSenderNameSave }
								disabled={ ! isNewsletterEnabled || isSavingSenderName }
								isBusy={ isSavingSenderName }
							>
								{ isSavingSenderName
									? __( 'Saving…', 'jetpack-newsletter' )
									: __( 'Save', 'jetpack-newsletter' ) }
							</Button>
						) }
					</div>
					<p className="newsletter-settings__field-description">
						{ __( 'Preview:', 'jetpack-newsletter' ) }{ ' ' }
						<strong>
							{ senderName ||
								jetpackSettings?.displayName ||
								__( 'Your Name', 'jetpack-newsletter' ) }
						</strong>{ ' ' }
						&lt;comment-reply@wordpress.com&gt;
					</p>
					<p className="newsletter-settings__field-description">
						{ __(
							"This is the name that appears in subscribers' inboxes. It's usually the name of your newsletter or the author.",
							'jetpack-newsletter'
						) }
					</p>
				</div>
			</fieldset>
		</div>
	);
}
