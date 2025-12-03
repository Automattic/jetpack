/**
 * External dependencies
 */
import { Button, ExternalLink } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { BylinePreview } from '../components/byline-preview';
import type { NewsletterSettings, JetpackNewsletterSettings } from '../types';

interface EmailConfigurationSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	jetpackSettings: JetpackNewsletterSettings | undefined;
	senderName: string;
	onSenderNameChange: ( e: React.ChangeEvent< HTMLInputElement > ) => void;
	onSenderNameSave: () => void;
	isSavingSenderName: boolean;
	hasSenderNameChanged: boolean;
	isNewsletterEnabled: boolean;
}

/**
 * Email Configuration Section Component
 *
 * @param {EmailConfigurationSectionProps} props - Component props
 * @return {JSX.Element} The email configuration section
 */
export function EmailConfigurationSection( {
	data,
	onChange,
	jetpackSettings,
	senderName,
	onSenderNameChange,
	onSenderNameSave,
	isSavingSenderName,
	hasSenderNameChanged,
	isNewsletterEnabled,
}: EmailConfigurationSectionProps ): JSX.Element {
	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'wpcom_featured_image_in_email',
			label: __( 'Enable featured image on your new post emails', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
			description: __(
				"Includes your post's featured image in the email sent out to your readers.",
				'jetpack-newsletter'
			),
		},
		{
			id: 'wpcom_subscription_emails_use_excerpt',
			label: __( 'For each new post email, include', 'jetpack-newsletter' ),
			type: 'integer' as const,
			Edit: 'radio' as const,
			elements: [
				{
					value: 0,
					label: __( 'Full text', 'jetpack-newsletter' ),
				},
				{
					value: 1,
					label: __( 'Excerpt', 'jetpack-newsletter' ),
				},
			],
			description: __(
				'Sets whether email subscribers can read full posts in emails or just an excerpt and link to the full version of the post.',
				'jetpack-newsletter'
			),
		},
		{
			id: 'jetpack_gravatar_in_email',
			label: __( 'Show author avatar on your emails', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
			description: __(
				'We use Gravatar, a service that associates an avatar image with your primary email address.',
				'jetpack-newsletter'
			),
		},
		{
			id: 'jetpack_author_in_email',
			label: __( 'Show author display name', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
		{
			id: 'jetpack_post_date_in_email',
			label: __( 'Add the post date', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
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
				'Chooses who receives emails when subscribers reply to your newsletter. The author’s account must be connected to WordPress.com to use their email as the reply-to address.',
				'jetpack-newsletter'
			),
		},
	];

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Email configuration', 'jetpack-newsletter' ) }
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
						fields: [
							'wpcom_featured_image_in_email',
							{
								id: 'email_content_settings',
								label: __( 'For each new post email, include', 'jetpack-newsletter' ),
								children: [ 'wpcom_subscription_emails_use_excerpt' ],
							},
							{
								id: 'email_byline',
								label: __( 'Email byline', 'jetpack-newsletter' ),
								children: [
									'jetpack_gravatar_in_email',
									'jetpack_author_in_email',
									'jetpack_post_date_in_email',
								],
							},
							{
								id: 'reply_to_settings',
								children: [ 'jetpack_subscriptions_reply_to' ],
							},
						],
					} }
					onChange={ onChange }
				/>

				{ /* Featured image learn more link */ }
				<div className="newsletter-settings__help-text">
					<ExternalLink href="https://wordpress.com/support/featured-images/">
						{ __( 'Learn more about featured images', 'jetpack-newsletter' ) }
					</ExternalLink>
				</div>

				{ /* Byline Preview */ }
				{ jetpackSettings && (
					<BylinePreview
						isGravatarEnabled={ data.jetpack_gravatar_in_email }
						isAuthorEnabled={ data.jetpack_author_in_email }
						isPostDateEnabled={ data.jetpack_post_date_in_email }
						gravatar={ jetpackSettings.gravatar }
						displayName={ jetpackSettings.displayName }
						dateExample={ jetpackSettings.dateExample }
					/>
				) }

				{ /* Date format customization link */ }
				<div className="newsletter-settings__help-text">
					{ createInterpolateElement(
						__(
							"You can customize the date format in your <link>site's general settings</link>.",
							'jetpack-newsletter'
						),
						{
							link: <a href={ jetpackSettings?.siteAdminUrl + 'options-general.php' }>{ '' }</a>,
						}
					) }
				</div>

				{ /* Gravatar link */ }
				{ data.jetpack_gravatar_in_email && jetpackSettings?.email && (
					<div className="newsletter-settings__link">
						<ExternalLink href={ `https://gravatar.com/${ jetpackSettings.email }` }>
							{ __( 'Update my Gravatar', 'jetpack-newsletter' ) }
						</ExternalLink>
					</div>
				) }

				{ /* Reply-to learn more link */ }
				<div className="newsletter-settings__help-text">
					<ExternalLink href="https://wordpress.com/support/subscriptions-and-newsletters/">
						{ __( 'Learn more about subscriptions and newsletters', 'jetpack-newsletter' ) }
					</ExternalLink>
				</div>

				{ /* Sender name field with inline save */ }
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
