/**
 * External dependencies
 */
import { DataForm, type Field } from '@wordpress/dataviews/wp';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { BylinePreview } from '../components/byline-preview';
import { ToggleWithLink } from '../components/toggle-with-link';
import type { NewsletterSettings, JetpackNewsletterSettings } from '../types';

interface EmailBylineSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	jetpackSettings: JetpackNewsletterSettings | undefined;
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
	jetpackSettings,
	isNewsletterEnabled,
}: EmailBylineSectionProps ): JSX.Element {
	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'jetpack_gravatar_in_email',
			label: __( 'Show author avatar on your emails', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: jetpackSettings?.email
				? ( { data: fieldData, field, onChange: fieldOnChange } ) => (
						<ToggleWithLink
							data={ fieldData as Record< string, unknown > }
							field={ field as Field< Record< string, unknown > > }
							onChange={ fieldOnChange }
							url={ `https://gravatar.com/${ jetpackSettings.email }` }
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
			Edit: jetpackSettings?.siteAdminUrl
				? ( { data: fieldData, field, onChange: fieldOnChange } ) => (
						<ToggleWithLink
							data={ fieldData as Record< string, unknown > }
							field={ field as Field< Record< string, unknown > > }
							onChange={ fieldOnChange }
							url={ `${ jetpackSettings.siteAdminUrl }options-general.php` }
							linkText={ __( 'Customize date format', 'jetpack-newsletter' ) }
							isExternal={ false }
						/>
				  )
				: ( 'toggle' as const ),
		},
	];

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Email byline', 'jetpack-newsletter' ) }
			</h3>
			<p className="newsletter-settings__section-description">
				{ __(
					'Customize the information you want to display below your post title in emails.',
					'jetpack-newsletter'
				) }
			</p>
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
							'jetpack_gravatar_in_email',
							'jetpack_author_in_email',
							'jetpack_post_date_in_email',
						],
					} }
					onChange={ onChange }
				/>

				{ /* Byline Preview - positioned right after the toggles */ }
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
			</fieldset>
		</div>
	);
}
