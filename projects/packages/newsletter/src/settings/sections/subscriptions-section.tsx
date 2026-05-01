/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getAdminUrl, getSiteType } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews/wp';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { ToggleWithEditorLink } from '../components/toggle-with-link';
import { getNewsletterScriptData } from '../script-data';
import { PlacementCard } from './placement-card';
import {
	OverlayIllustration,
	PopupIllustration,
	EndOfPostIllustration,
	FloatingIllustration,
} from './placement-illustrations';
import type { NewsletterSettings } from '../types';
import type { ReactNode } from 'react';

interface FieldRenderProps {
	data: NewsletterSettings;
	field: Field< Record< string, unknown > >;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
}

interface SubscriptionsSectionProps {
	data: NewsletterSettings;
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
	onChange,
	onSave,
	isSaving,
	hasChanges,
	isNewsletterEnabled,
}: SubscriptionsSectionProps ): JSX.Element {
	const siteType = getSiteType();
	const newsletterScriptData = getNewsletterScriptData();

	// Translation strings for save button
	const savingText = __( 'Saving…', 'jetpack-newsletter' );
	const saveText = __( 'Save', 'jetpack-newsletter' );

	// Track section save
	const handleSave = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
			site_type: siteType,
			section: 'subscriptions',
		} );
		onSave();
	}, [ onSave, siteType ] );

	// Helper to check if we can show editor links for block theme features
	const canShowBlockThemeEditorLinks =
		newsletterScriptData?.isBlockTheme && newsletterScriptData?.themeStylesheet;

	// Helper to check if we can show editor links for subscription site edit features
	const canShowSubscriptionEditorLinks =
		newsletterScriptData?.isSubscriptionSiteEditSupported && newsletterScriptData?.themeStylesheet;

	// "Pages and posts" placements rendered as a 2×2 grid of selectable
	// cards. Each entry carries the underlying boolean key + the site-editor
	// template that backs the "Preview and edit" link.
	const placements: Array< {
		key: keyof NewsletterSettings;
		title: string;
		illustration?: ReactNode;
		previewUrl?: string;
	} > = [
		{
			key: 'jetpack_subscribe_overlay_enabled',
			title: __( 'Subscription overlay on homepage', 'jetpack-newsletter' ),
			illustration: <OverlayIllustration />,
			previewUrl: canShowBlockThemeEditorLinks
				? addQueryArgs( getAdminUrl( 'site-editor.php' ), {
						postType: 'wp_template_part',
						postId: `${ newsletterScriptData.themeStylesheet }//jetpack-subscribe-overlay`,
						canvas: 'edit',
				  } )
				: undefined,
		},
		{
			key: 'sm_enabled',
			title: __( 'Subscription pop-up in post', 'jetpack-newsletter' ),
			illustration: <PopupIllustration />,
			previewUrl: canShowBlockThemeEditorLinks
				? addQueryArgs( getAdminUrl( 'site-editor.php' ), {
						postType: 'wp_template_part',
						postId: `${ newsletterScriptData.themeStylesheet }//jetpack-subscribe-modal`,
						canvas: 'edit',
				  } )
				: undefined,
		},
		{
			key: 'jetpack_subscriptions_subscribe_post_end_enabled',
			title: __( 'Subscribe block at the end of each post', 'jetpack-newsletter' ),
			illustration: <EndOfPostIllustration />,
			previewUrl: canShowSubscriptionEditorLinks
				? addQueryArgs( getAdminUrl( 'site-editor.php' ), {
						postType: 'wp_template',
						postId: `${ newsletterScriptData.themeStylesheet }//single`,
						canvas: 'edit',
				  } )
				: undefined,
		},
		{
			key: 'jetpack_subscribe_floating_button_enabled',
			title: __( 'Floating button on bottom corner', 'jetpack-newsletter' ),
			illustration: <FloatingIllustration />,
			previewUrl: canShowBlockThemeEditorLinks
				? addQueryArgs( getAdminUrl( 'site-editor.php' ), {
						postType: 'wp_template_part',
						postId: `${ newsletterScriptData.themeStylesheet }//jetpack-subscribe-floating-button`,
						canvas: 'edit',
				  } )
				: undefined,
		},
	];

	const handlePlacementChange = useCallback(
		( key: string, next: boolean ) => {
			onChange( { [ key ]: next } as Partial< NewsletterSettings > );
		},
		[ onChange ]
	);

	// DataForm carries only Navigation + Comments now. The Pages-and-posts
	// group lifted out into the card grid above.
	const fields: Field< NewsletterSettings >[] = [
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
				? ( { data: formData, field, onChange: fieldOnChange }: FieldRenderProps ) => (
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
					<Stack gap="lg" direction="column">
						<div className="jetpack-newsletter-placements-grid">
							{ placements.map( placement => (
								<PlacementCard
									key={ placement.key }
									id={ `placement-${ placement.key }` }
									name={ String( placement.key ) }
									title={ placement.title }
									illustration={ placement.illustration }
									previewUrl={ placement.previewUrl }
									checked={ Boolean( data[ placement.key ] ) }
									onChange={ handlePlacementChange }
									disabled={ ! isNewsletterEnabled }
								/>
							) ) }
						</div>

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
					</Stack>
				</fieldset>
				<Stack direction="row" justify="flex-end" className="newsletter-card-footer">
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ handleSave }
						disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
						isBusy={ isSaving }
					>
						{ isSaving ? savingText : saveText }
					</Button>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
