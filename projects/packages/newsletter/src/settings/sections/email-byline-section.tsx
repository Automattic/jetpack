/**
 * External dependencies
 */
import { getAdminUrl, getScriptData } from '@automattic/jetpack-script-data';
import {
	Card,
	CardHeader,
	CardBody,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews/wp';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { BylinePreview } from '../components/byline-preview';
import { ToggleWithLink } from '../components/toggle-with-link';
import { getNewsletterScriptData } from '../script-data';
import type { NewsletterSettings } from '../types';

interface EmailBylineSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	isNewsletterEnabled: boolean;
}

/**
 * Email Byline Section Component
 *
 * Handles the email byline settings (gravatar, author, date) with live preview.
 *
 * @param {EmailBylineSectionProps} props - Component props
 * @return {JSX.Element} The email byline section
 */
export function EmailBylineSection( {
	data,
	onChange,
	isNewsletterEnabled,
}: EmailBylineSectionProps ): JSX.Element {
	const newsletterScriptData = getNewsletterScriptData();
	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'jetpack_gravatar_in_email',
			label: __( 'Show author avatar on your emails', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: newsletterScriptData?.email
				? ( { data: fieldData, field, onChange: fieldOnChange } ) => (
						<ToggleWithLink
							data={ fieldData as Record< string, unknown > }
							field={ field as Field< Record< string, unknown > > }
							onChange={ fieldOnChange }
							url="https://gravatar.com/profile/avatars"
							linkText={ __( 'Update your Gravatar', 'jetpack-newsletter' ) }
						/>
				  )
				: ( 'toggle' as const ),
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
			Edit: ( { data: fieldData, field, onChange: fieldOnChange } ) => (
				<ToggleWithLink
					data={ fieldData as Record< string, unknown > }
					field={ field as Field< Record< string, unknown > > }
					onChange={ fieldOnChange }
					url={ getAdminUrl( 'options-general.php' ) }
					linkText={ __( 'Customize date format', 'jetpack-newsletter' ) }
					isExternal={ false }
				/>
			),
		},
	];

	return (
		<Card>
			<CardHeader>
				<Heading level={ 4 }>{ __( 'Email byline', 'jetpack-newsletter' ) }</Heading>
			</CardHeader>
			<CardBody>
				<p>
					<Text>
						{ __(
							'Customize the information you want to display below your post title in emails.',
							'jetpack-newsletter'
						) }
					</Text>
				</p>
				<fieldset disabled={ ! isNewsletterEnabled }>
					<DataForm
						data={ data }
						fields={ fields }
						form={ {
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
							fields: [
								'jetpack_gravatar_in_email',
								'jetpack_author_in_email',
								'jetpack_post_date_in_email',
							],
						} }
						onChange={ onChange }
					/>

					{ newsletterScriptData && (
						<BylinePreview
							isGravatarEnabled={ data.jetpack_gravatar_in_email }
							isAuthorEnabled={ data.jetpack_author_in_email }
							isPostDateEnabled={ data.jetpack_post_date_in_email }
							gravatar={ newsletterScriptData.gravatar }
							displayName={ getScriptData()?.user.current_user?.display_name ?? '' }
							dateExample={ newsletterScriptData.dateExample }
						/>
					) }
				</fieldset>
			</CardBody>
		</Card>
	);
}
