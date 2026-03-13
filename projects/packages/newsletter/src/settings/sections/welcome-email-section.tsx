/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import {
	Button,
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews/wp';
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

	// Track section save
	const handleSave = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
			site_type: siteType,
			section: 'welcome_email',
		} );
		onSave();
	}, [ onSave, siteType ] );

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
		<Card>
			<CardHeader>
				<Heading level={ 4 }>{ __( 'Welcome email message', 'jetpack-newsletter' ) }</Heading>
			</CardHeader>
			<CardBody>
				<p>
					<Text>
						{ __(
							'Sent to your email subscribers when they subscribe to your newsletter.',
							'jetpack-newsletter'
						) }
					</Text>
				</p>
				<fieldset disabled={ ! isNewsletterEnabled }>
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
				</fieldset>
			</CardBody>
			<CardFooter>
				<Button
					variant="primary"
					onClick={ handleSave }
					disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
					isBusy={ isSaving }
				>
					{ isSaving ? savingText : saveText }
				</Button>
			</CardFooter>
		</Card>
	);
}
