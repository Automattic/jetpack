/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getAdminUrl, getSiteType } from '@automattic/jetpack-script-data';
import { Button, ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Link, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
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

interface SubscriptionsSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
	/** Setting keys staged in this section's changeset, fed into section_save analytics. */
	changedKeys?: string[];
	isNewsletterEnabled: boolean;
}

/**
 * Subscriptions Section Component
 *
 * Renders the four "Homepage and posts" placements as a 2×2 grid of
 * `PlacementCard`s, plus inline Navigation / Comments toggle subgroups
 * inside the same card. Per-placement Tracks events fire alongside the
 * state update so we can see toggle activity before any save.
 *
 * @param {SubscriptionsSectionProps} props - Component props.
 * @return {JSX.Element} The subscriptions section.
 */
export function SubscriptionsSection( {
	data,
	onChange,
	onSave,
	isSaving,
	hasChanges,
	changedKeys,
	isNewsletterEnabled,
}: SubscriptionsSectionProps ): JSX.Element {
	const siteType = getSiteType();
	const newsletterScriptData = getNewsletterScriptData();

	// Translation strings for save button.
	const savingText = __( 'Saving…', 'jetpack-newsletter' );
	const saveText = __( 'Save', 'jetpack-newsletter' );

	// Track section save with the keys that changed since the last save so
	// we can see what's actually in each user's batch (which placements
	// flipped, which navigation toggles moved) without firing a per-toggle
	// event on every click.
	const handleSave = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
			site_type: siteType,
			section: 'subscriptions',
			changed_keys: ( changedKeys ?? [] ).join( ',' ),
			change_count: ( changedKeys ?? [] ).length,
		} );
		onSave();
	}, [ changedKeys, onSave, siteType ] );

	const canShowBlockThemeEditorLinks =
		newsletterScriptData?.isBlockTheme && newsletterScriptData?.themeStylesheet;
	const canShowSubscriptionEditorLinks =
		newsletterScriptData?.isSubscriptionSiteEditSupported && newsletterScriptData?.themeStylesheet;

	// "Homepage and posts" placements rendered as a 2×2 grid of selectable
	// cards. Each entry carries the underlying boolean key + the site-editor
	// template that backs the "Preview and edit" link, plus a stable
	// analytics slug so Tracks events stay readable when the underlying
	// setting key churns.
	const placements: Array< {
		key: keyof NewsletterSettings;
		slug: string;
		title: string;
		illustration: ReactNode;
		previewUrl?: string;
	} > = [
		{
			key: 'jetpack_subscribe_overlay_enabled',
			slug: 'overlay',
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
			slug: 'modal',
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
			slug: 'post_end',
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
			slug: 'floating_button',
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

	// Map setting key -> placement slug for analytics. The PlacementCard's
	// onChange/onPreviewClick callbacks identify the row by its setting key,
	// so we resolve back to the readable slug here.
	const placementSlugByKey: Record< string, string > = Object.fromEntries(
		placements.map( p => [ String( p.key ), p.slug ] )
	);

	const handlePlacementChange = useCallback(
		( key: string, next: boolean ) => {
			analytics.tracks.recordEvent( 'jetpack_newsletter_placement_toggle', {
				site_type: siteType,
				placement: placementSlugByKey[ key ] ?? key,
				enabled: next,
			} );
			onChange( { [ key ]: next } as Partial< NewsletterSettings > );
		},
		[ onChange, placementSlugByKey, siteType ]
	);

	const handlePlacementPreviewClick = useCallback(
		( key: string ) => {
			analytics.tracks.recordEvent( 'jetpack_newsletter_placement_preview_click', {
				site_type: siteType,
				placement: placementSlugByKey[ key ] ?? key,
			} );
		},
		[ placementSlugByKey, siteType ]
	);

	const handleSubscribeNavToggle = useCallback(
		( next: boolean ) => onChange( { jetpack_subscriptions_subscribe_navigation_enabled: next } ),
		[ onChange ]
	);
	const handleLoginNavToggle = useCallback(
		( next: boolean ) => onChange( { jetpack_subscriptions_login_navigation_enabled: next } ),
		[ onChange ]
	);
	const handleSubscribeToSiteToggle = useCallback(
		( next: boolean ) => onChange( { stb_enabled: next } ),
		[ onChange ]
	);
	const handleSubscribeToCommentsToggle = useCallback(
		( next: boolean ) => onChange( { stc_enabled: next } ),
		[ onChange ]
	);

	// Editor link for the navigation block templates. Both Navigation toggles
	// open the same `index` template — the Subscribe block and the Subscriber
	// Login block are inserted side-by-side via the same template part.
	const navTemplateUrl = canShowSubscriptionEditorLinks
		? addQueryArgs( getAdminUrl( 'site-editor.php' ), {
				postType: 'wp_template',
				postId: `${ newsletterScriptData.themeStylesheet }//index`,
				canvas: 'edit',
		  } )
		: undefined;

	const handleNavLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_edit_link_click', {
			site_type: siteType,
			template: 'index',
		} );
	}, [ siteType ] );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Subscriptions', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack gap="lg" direction="column">
					<Text>
						{ __(
							'Automatically add subscription forms to your site and turn visitors into subscribers.',
							'jetpack-newsletter'
						) }
					</Text>
					<fieldset
						className="jetpack-newsletter-section__fieldset"
						disabled={ ! isNewsletterEnabled }
					>
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
										onPreviewClick={ handlePlacementPreviewClick }
										disabled={ ! isNewsletterEnabled }
									/>
								) ) }
							</div>

							<div className="jetpack-newsletter-subgroup">
								<h3 className="jetpack-newsletter-subgroup__title">
									{ __( 'Navigation', 'jetpack-newsletter' ) }
								</h3>
								<Stack gap="md" direction="column">
									<ToggleControl
										__nextHasNoMarginBottom
										checked={ Boolean( data.jetpack_subscriptions_subscribe_navigation_enabled ) }
										onChange={ handleSubscribeNavToggle }
										label={
											<span>
												{ __( 'Add the Subscribe block to the navigation', 'jetpack-newsletter' ) }
												{ navTemplateUrl && (
													<>
														{ ' ' }
														<Link href={ navTemplateUrl } onClick={ handleNavLinkClick }>
															{ __( 'Preview and edit', 'jetpack-newsletter' ) }
														</Link>
													</>
												) }
											</span>
										}
									/>
									<ToggleControl
										__nextHasNoMarginBottom
										checked={ Boolean( data.jetpack_subscriptions_login_navigation_enabled ) }
										onChange={ handleLoginNavToggle }
										label={
											<span>
												{ __(
													'Add the Subscriber Login block to the navigation',
													'jetpack-newsletter'
												) }
												{ navTemplateUrl && (
													<>
														{ ' ' }
														<Link href={ navTemplateUrl } onClick={ handleNavLinkClick }>
															{ __( 'Preview and edit', 'jetpack-newsletter' ) }
														</Link>
													</>
												) }
											</span>
										}
									/>
								</Stack>
							</div>

							<div className="jetpack-newsletter-subgroup">
								<h3 className="jetpack-newsletter-subgroup__title">
									{ __( 'Comments', 'jetpack-newsletter' ) }
								</h3>
								<Stack gap="md" direction="column">
									<ToggleControl
										__nextHasNoMarginBottom
										checked={ Boolean( data.stb_enabled ) }
										onChange={ handleSubscribeToSiteToggle }
										label={ __(
											'Enable the "Subscribe to site" option on your comment form',
											'jetpack-newsletter'
										) }
									/>
									<ToggleControl
										__nextHasNoMarginBottom
										checked={ Boolean( data.stc_enabled ) }
										onChange={ handleSubscribeToCommentsToggle }
										label={ __(
											'Enable the "Subscribe to comments" option on your comment form',
											'jetpack-newsletter'
										) }
									/>
								</Stack>
							</div>
						</Stack>
					</fieldset>
				</Stack>
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
