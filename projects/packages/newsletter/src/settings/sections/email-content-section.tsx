/**
 * External dependencies
 */
import { DataForm, type Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { Card, Fieldset, Notice, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { getNewsletterScriptData } from '../script-data';
import type { NewsletterSettings } from '../types';

interface EmailContentSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	isNewsletterEnabled: boolean;
}

/**
 * Email Content Section Component
 *
 * Handles featured image and full text/excerpt settings for newsletter emails.
 *
 * @param {EmailContentSectionProps} props - Component props
 * @return {JSX.Element} The email content section
 */
export function EmailContentSection( {
	data,
	onChange,
	isNewsletterEnabled,
}: EmailContentSectionProps ): JSX.Element {
	const isSitePublic = getNewsletterScriptData()?.isSitePublic ?? true;
	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'wpcom_featured_image_in_email',
			label: __( "Include the post's featured image in the new post emails", 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
		{
			id: 'wpcom_subscription_emails_use_excerpt',
			label: __( 'For each new post email, include', 'jetpack-newsletter' ),
			type: 'text' as const,
			Edit: 'radio' as const,
			elements: [
				{
					value: '0',
					label: __( 'Full text', 'jetpack-newsletter' ),
				},
				{
					value: '1',
					label: __( 'Excerpt', 'jetpack-newsletter' ),
				},
			],
			description: __(
				'Sets whether email subscribers can read full posts in emails or just an excerpt and link to the full version of the post.',
				'jetpack-newsletter'
			),
		},
	];

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Email content', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Fieldset.Root disabled={ ! isNewsletterEnabled }>
					<Stack gap="lg" direction="column">
						{ ! isSitePublic && (
							<Notice.Root intent="warning">
								<Notice.Description>
									{ __(
										'Featured images will not be used in your emails until the site is public, because access to the images is restricted to your site only.',
										'jetpack-newsletter'
									) }
								</Notice.Description>
							</Notice.Root>
						) }

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
									'wpcom_subscription_emails_use_excerpt',
								],
							} }
							onChange={ onChange }
						/>
					</Stack>
				</Fieldset.Root>
			</Card.Content>
		</Card.Root>
	);
}
