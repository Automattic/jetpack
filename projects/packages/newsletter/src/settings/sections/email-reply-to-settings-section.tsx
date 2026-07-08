/**
 * External dependencies
 */
import { DataForm, type Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import type { NewsletterSettings } from '../types';

interface EmailReplyToSettingsSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	isNewsletterEnabled: boolean;
}

/**
 * Email Reply-to Settings Section Component
 *
 * Handles the reply-to configuration for newsletter emails.
 *
 * @param {EmailReplyToSettingsSectionProps} props - Component props
 * @return {JSX.Element} The email reply-to settings section
 */
export function EmailReplyToSettingsSection( {
	data,
	onChange,
	isNewsletterEnabled,
}: EmailReplyToSettingsSectionProps ): JSX.Element {
	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'jetpack_subscriptions_reply_to',
			label: __( 'Reply-to settings', 'jetpack-newsletter' ),
			type: 'text' as const,
			Edit: 'radio' as const,
			elements: [
				{
					value: 'comment',
					label: __( 'Replies will be a public comment on the post', 'jetpack-newsletter' ),
				},
				{
					value: 'author',
					label: __( "Replies will be sent to the post author's email", 'jetpack-newsletter' ),
				},
				{ value: 'no-reply', label: __( 'Replies are not allowed', 'jetpack-newsletter' ) },
			],
			description: __(
				"Choose who receives emails when subscribers reply to your newsletter. The author's account must be connected to WordPress.com to use their email as the reply-to address.",
				'jetpack-newsletter'
			),
		},
	];

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Reply-to settings', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<fieldset disabled={ ! isNewsletterEnabled }>
					<DataForm
						data={ data }
						fields={ fields }
						form={ {
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
							fields: [ 'jetpack_subscriptions_reply_to' ],
						} }
						onChange={ onChange }
					/>
				</fieldset>
			</Card.Content>
		</Card.Root>
	);
}
