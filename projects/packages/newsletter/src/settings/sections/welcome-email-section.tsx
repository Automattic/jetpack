/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { NewsletterSettings } from '../types';

interface WelcomeEmailSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
	isNewsletterEnabled: boolean;
}

// Flattened data structure for DataForm
interface WelcomeEmailFormData {
	welcome_message: string;
}

/**
 * Welcome Email Section Component
 *
 * Handles the welcome email message configuration for new subscribers.
 *
 * @param {WelcomeEmailSectionProps} props - Component props
 * @return {JSX.Element} The welcome email section
 */
export function WelcomeEmailSection( {
	data,
	onChange,
	onSave,
	isSaving,
	hasChanges,
	isNewsletterEnabled,
}: WelcomeEmailSectionProps ): JSX.Element {
	// Flatten data for DataForm
	const formData: WelcomeEmailFormData = useMemo(
		() => ( {
			welcome_message: data.subscription_options?.welcome || '',
		} ),
		[ data.subscription_options?.welcome ]
	);

	const fields: Field< WelcomeEmailFormData >[] = [
		{
			id: 'welcome_message',
			label: __( 'Welcome message', 'jetpack-newsletter' ),
			type: 'text' as const,
			Edit: 'textarea' as const,
			description: __(
				'You can use plain text or HTML tags in this textarea for formatting.',
				'jetpack-newsletter'
			),
		},
	];

	const handleDataFormChange = useCallback(
		( updates: Partial< WelcomeEmailFormData > ) => {
			if ( updates.welcome_message !== undefined ) {
				// Preserve all properties of subscription_options when updating
				onChange( {
					subscription_options: {
						invitation: data.subscription_options?.invitation || '',
						welcome: updates.welcome_message,
						comment_follow: data.subscription_options?.comment_follow || '',
					},
				} );
			}
		},
		[ onChange, data.subscription_options ]
	);

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Welcome email message', 'jetpack-newsletter' ) }
			</h3>
			<p className="newsletter-settings__section-description">
				{ __(
					'Sent to your email subscribers when they subscribe to your newsletter.',
					'jetpack-newsletter'
				) }
			</p>
			<fieldset className="newsletter-settings__section-content" disabled={ ! isNewsletterEnabled }>
				<DataForm
					data={ formData }
					fields={ fields }
					form={ {
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
						fields: [ 'welcome_message' ],
					} }
					onChange={ handleDataFormChange }
				/>

				<div className="newsletter-settings__section-actions">
					<Button
						variant="primary"
						onClick={ onSave }
						disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
						isBusy={ isSaving }
					>
						{ isSaving
							? __( 'Saving…', 'jetpack-newsletter' )
							: __( 'Save', 'jetpack-newsletter' ) }
					</Button>
				</div>
			</fieldset>
		</div>
	);
}
