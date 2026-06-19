/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { ToggleWithEditorLink } from '../components/toggle-with-link';
import { getNewsletterScriptData } from '../script-data';
import type { NewsletterSettings } from '../types';

interface LegacySubscriptionsSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
	isNewsletterEnabled: boolean;
}

/**
 * Legacy Subscriptions Section Component — flat `ToggleWithEditorLink` list
 * grouped into Homepage/Navigation/Comments subgroups. Used only by the
 * flag-OFF surface, so the legacy `wp-admin/admin.php?page=jetpack-newsletter`
 * page keeps its existing layout while modernized users see the placement
 * card grid (in `subscriptions-section.tsx`). Retires together with
 * `NewsletterSection` in #48613.
 *
 * @param {LegacySubscriptionsSectionProps} props - Component props.
 * @return {JSX.Element} The legacy subscriptions section.
 */
export function LegacySubscriptionsSection( {
	data,
	onChange,
	onSave,
	isSaving,
	hasChanges,
	isNewsletterEnabled,
}: LegacySubscriptionsSectionProps ): JSX.Element {
	const siteType = getSiteType();
	const newsletterScriptData = getNewsletterScriptData();

	const savingText = __( 'Saving…', 'jetpack-newsletter' );
	const saveText = __( 'Save', 'jetpack-newsletter' );

	const handleSave = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
			site_type: siteType,
			section: 'subscriptions',
		} );
		onSave();
	}, [ onSave, siteType ] );

	const canShowBlockThemeEditorLinks =
		newsletterScriptData?.isBlockTheme && newsletterScriptData?.themeStylesheet;

	const canShowSubscriptionEditorLinks =
		newsletterScriptData?.isSubscriptionSiteEditSupported && newsletterScriptData?.themeStylesheet;

	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'jetpack_subscriptions_subscribe_post_end_enabled',
			label: __( 'Add the Subscribe Block at the end of each post', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowSubscriptionEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							themeStylesheet={ newsletterScriptData.themeStylesheet }
							postType="wp_template"
							templateId="single"
							siteType={ siteType }
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'sm_enabled',
			label: __( 'Show subscription pop-up when scrolling a post', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowBlockThemeEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							themeStylesheet={ newsletterScriptData.themeStylesheet }
							postType="wp_template_part"
							templateId="jetpack-subscribe-modal"
							siteType={ siteType }
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscribe_overlay_enabled',
			label: __( 'Subscription overlay on homepage', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowBlockThemeEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							themeStylesheet={ newsletterScriptData.themeStylesheet }
							postType="wp_template_part"
							templateId="jetpack-subscribe-overlay"
							siteType={ siteType }
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscribe_floating_button_enabled',
			label: __( "Floating subscribe button on site's bottom corner", 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowBlockThemeEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							themeStylesheet={ newsletterScriptData.themeStylesheet }
							postType="wp_template_part"
							templateId="jetpack-subscribe-floating-button"
							siteType={ siteType }
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscriptions_subscribe_navigation_enabled',
			label: __( 'Add the Subscribe Block to the navigation', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowSubscriptionEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							themeStylesheet={ newsletterScriptData.themeStylesheet }
							postType="wp_template"
							templateId="index"
							siteType={ siteType }
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscriptions_login_navigation_enabled',
			label: __( 'Add the Subscriber Login Block to the navigation', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowSubscriptionEditorLinks
				? ( { data: formData, field, onChange: fieldOnChange } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ fieldOnChange }
							themeStylesheet={ newsletterScriptData.themeStylesheet }
							postType="wp_template"
							templateId="index"
							siteType={ siteType }
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
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Subscriptions', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<p>
					<Text>
						{ __(
							'Automatically add subscription forms to your site and turn visitors into subscribers.',
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
				</fieldset>
				<div className="newsletter-card-footer">
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ handleSave }
						disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
						isBusy={ isSaving }
					>
						{ isSaving ? savingText : saveText }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
