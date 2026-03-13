/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteData, getSiteType } from '@automattic/jetpack-script-data';
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { NewsletterSettings } from '../types';

interface EmailSenderSettingsSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
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
	isNewsletterEnabled,
}: EmailSenderSettingsSectionProps ): JSX.Element {
	const siteType = getSiteType();

	// Translation strings for save button
	const savingText = __( 'Saving…', 'jetpack-newsletter' );
	const saveText = __( 'Save', 'jetpack-newsletter' );

	// Track section save
	const handleSave = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
			site_type: siteType,
			section: 'sender_settings',
		} );
		onSave();
	}, [ onSave, siteType ] );

	const siteName = getSiteData()?.title;

	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'jetpack_subscriptions_from_name',
			label: __( 'Sender name', 'jetpack-newsletter' ),
			type: 'text' as const,
			placeholder: siteName,
			description: __(
				"This is the name that appears in subscribers' inboxes. It's usually the name of your newsletter or the author.",
				'jetpack-newsletter'
			),
		},
	];

	// Get the current sender name value
	const senderName = data.jetpack_subscriptions_from_name || '';

	return (
		<Card>
			<CardHeader>
				<Heading level={ 4 }>{ __( 'Sender settings', 'jetpack-newsletter' ) }</Heading>
			</CardHeader>
			<CardBody>
				<fieldset disabled={ ! isNewsletterEnabled }>
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
					<p>
						<Text>
							{ createInterpolateElement(
								sprintf(
									/* translators: %1$s is the sender name that will appear in subscriber inboxes */
									__(
										'Preview: <strong>%1$s</strong> <author-name@example.com>',
										'jetpack-newsletter'
									),
									senderName || siteName || __( 'Your Name', 'jetpack-newsletter' )
								),
								{
									strong: <strong />,
								}
							) }
						</Text>
					</p>
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
