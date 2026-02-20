/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews/wp';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ToggleWithEditorLink } from '../components/toggle-with-link';
import type { NewsletterSettings, JetpackNewsletterSettings } from '../types';

interface FieldRenderProps {
	data: NewsletterSettings;
	field: Field< Record< string, unknown > >;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
}

interface SubscriptionsSectionProps {
	data: NewsletterSettings;
	jetpackSettings: JetpackNewsletterSettings | undefined;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
	isNewsletterEnabled: boolean;
}

/**
 * Subscriptions Section Component
 *
 * @param {SubscriptionsSectionProps} props - Component props
 * @return {JSX.Element} The subscriptions section
 */
export function SubscriptionsSection( {
	data,
	jetpackSettings,
	onChange,
	onSave,
	isSaving,
	hasChanges,
	isNewsletterEnabled,
}: SubscriptionsSectionProps ): JSX.Element {
	// Translation strings for save button
	const savingText = __( 'Saving…', 'jetpack-newsletter' );
	const saveText = __( 'Save', 'jetpack-newsletter' );

	// Helper to check if we can show editor links for block theme features
	const canShowBlockThemeEditorLinks =
		jetpackSettings?.isBlockTheme &&
		jetpackSettings?.siteAdminUrl &&
		jetpackSettings?.themeStylesheet;

	// Helper to check if we can show editor links for subscription site edit features
	const canShowSubscriptionEditorLinks =
		jetpackSettings?.isSubscriptionSiteEditSupported &&
		jetpackSettings?.siteAdminUrl &&
		jetpackSettings?.themeStylesheet;

	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'jetpack_subscriptions_subscribe_post_end_enabled',
			label: __( 'Add the Subscribe Block at the end of each post.', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowSubscriptionEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange }: FieldRenderProps ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template"
							templateId="single"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'sm_enabled',
			label: __( 'Show subscription pop-up when scrolling a post.', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowBlockThemeEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange }: FieldRenderProps ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template_part"
							templateId="jetpack-subscribe-modal"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscribe_overlay_enabled',
			label: __( 'Subscription overlay on homepage', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowBlockThemeEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange }: FieldRenderProps ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template_part"
							templateId="jetpack-subscribe-overlay"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscribe_floating_button_enabled',
			label: __( "Floating subscribe button on site's bottom corner", 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowBlockThemeEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange }: FieldRenderProps ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template_part"
							templateId="jetpack-subscribe-floating-button"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscriptions_subscribe_navigation_enabled',
			label: __( 'Add the Subscribe Block to the navigation', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowSubscriptionEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange }: FieldRenderProps ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template"
							templateId="index"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscriptions_login_navigation_enabled',
			label: __( 'Add the Subscriber Login Block to the navigation', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowSubscriptionEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange }: FieldRenderProps ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template"
							templateId="index"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'stb_enabled',
			label: __(
				'Enable the "Subscribe to site" option on your comment form',
				'jetpack-newsletter'
			),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
		{
			id: 'stc_enabled',
			label: __(
				'Enable the "Subscribe to comments" option on your comment form',
				'jetpack-newsletter'
			),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
	];

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Subscriptions', 'jetpack-newsletter' ) }
			</h3>
			<p className="newsletter-settings__section-description">
				{ __(
					'Automatically add subscription forms to your site and turn visitors into subscribers.',
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
							{
								id: 'homepage_and_posts',
								label: __( 'Homepage and posts', 'jetpack-newsletter' ),
								children: [
									'jetpack_subscriptions_subscribe_post_end_enabled',
									'sm_enabled',
									'jetpack_subscribe_overlay_enabled',
									'jetpack_subscribe_floating_button_enabled',
								],
							},
							{
								id: 'navigation',
								label: __( 'Navigation', 'jetpack-newsletter' ),
								children: [
									'jetpack_subscriptions_subscribe_navigation_enabled',
									'jetpack_subscriptions_login_navigation_enabled',
								],
							},
							{
								id: 'comments',
								label: __( 'Comments', 'jetpack-newsletter' ),
								children: [ 'stb_enabled', 'stc_enabled' ],
							},
						],
					} }
					onChange={ onChange }
				/>

				<div className="newsletter-settings__section-actions">
					<Button
						variant="primary"
						onClick={ onSave }
						disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
						isBusy={ isSaving }
					>
						{ isSaving ? savingText : saveText }
					</Button>
				</div>
			</fieldset>
		</div>
	);
}
