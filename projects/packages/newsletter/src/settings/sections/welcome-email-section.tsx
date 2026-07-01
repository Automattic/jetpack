/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Fieldset, Text } from '@wordpress/ui';
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
	/** Setting keys staged in this section's changeset, fed into section_save analytics. */
	changedKeys?: string[];
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
	changedKeys,
	isNewsletterEnabled,
}: WelcomeEmailSectionProps ): JSX.Element {
	const siteType = getSiteType();

	// Flatten data for DataForm
	const formData: WelcomeEmailFormData = useMemo(
		() => ( {
			welcome_message: data.subscription_options?.welcome || '',
		} ),
		[ data.subscription_options?.welcome ]
	);

	// Translation strings for save button
	const savingText = __( 'Saving…', 'jetpack-newsletter' );
	const saveText = __( 'Save', 'jetpack-newsletter' );

	// Track section save with the keys that changed since the last save.
	const handleSave = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
			site_type: siteType,
			section: 'welcome_email',
			changed_keys: ( changedKeys ?? [] ).join( ',' ),
			change_count: ( changedKeys ?? [] ).length,
		} );
		onSave();
	}, [ changedKeys, onSave, siteType ] );

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
						subscribe_modal_heading: data.subscription_options?.subscribe_modal_heading || '',
					},
				} );
			}
		},
		[ onChange, data.subscription_options ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Welcome email message', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<p>
					<Text>
						{ __(
							'Sent to your email subscribers when they subscribe to your newsletter.',
							'jetpack-newsletter'
						) }
					</Text>
				</p>
				<Fieldset.Root disabled={ ! isNewsletterEnabled }>
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
				</Fieldset.Root>
				<div className="newsletter-card-footer">
					<Button
						onClick={ handleSave }
						disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
						loading={ isSaving }
						loadingAnnouncement={ savingText }
					>
						{ saveText }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
