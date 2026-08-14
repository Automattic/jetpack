/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getAdminUrl, getSiteType } from '@automattic/jetpack-script-data';
import { ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Fieldset, Link, Stack, Text } from '@wordpress/ui';
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

// Static map from setting key -> readable placement slug, used as the
// `placement` field on `jetpack_newsletter_placement_toggle` and
// `jetpack_newsletter_placement_preview_click` Tracks events. Hoisted out of
// render so the analytics callbacks below stay referentially stable across
// renders — building it inline made `handlePlacementChange` /
// `handlePlacementPreviewClick` recompute every render, defeating their
// `useCallback` memoization. Keep in sync with the `placements` array.
const PLACEMENT_SLUG_BY_KEY: Record< string, string > = {
	jetpack_subscribe_overlay_enabled: 'overlay',
	sm_enabled: 'modal',
	jetpack_subscriptions_subscribe_post_end_enabled: 'post_end',
	jetpack_subscribe_floating_button_enabled: 'floating_button',
};

interface SubscriptionsSectionProps {
	data: NewsletterSettings;
	/**
	 * Last *persisted* settings. A placement's "Preview and edit" link only
	 * shows when the placement is enabled here (saved), not merely toggled on
	 * in the optimistic `data` — otherwise the link opens an empty preview.
	 */
	savedData: NewsletterSettings | null;
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
	savedData,
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
	// template that backs the "Preview and edit" link. The stable analytics
	// slug lives in `PLACEMENT_SLUG_BY_KEY` at module scope.
	const placements: Array< {
		key: keyof NewsletterSettings;
		title: string;
		illustration: ReactNode;
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
			analytics.tracks.recordEvent( 'jetpack_newsletter_placement_toggle', {
				site_type: siteType,
				placement: PLACEMENT_SLUG_BY_KEY[ key ] ?? key,
				enabled: next,
			} );
			onChange( { [ key ]: next } as Partial< NewsletterSettings > );
		},
		[ onChange, siteType ]
	);

	const handlePlacementPreviewClick = useCallback(
		( key: string ) => {
			analytics.tracks.recordEvent( 'jetpack_newsletter_placement_preview_click', {
				site_type: siteType,
				placement: PLACEMENT_SLUG_BY_KEY[ key ] ?? key,
			} );
		},
		[ siteType ]
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
					<Fieldset.Root disabled={ ! isNewsletterEnabled }>
						<Stack gap="lg" direction="column">
							<Stack gap="sm" direction="column">
								<Text variant="heading-sm" render={ <h3 /> }>
									{ __( 'Homepage and posts', 'jetpack-newsletter' ) }
								</Text>
								<div className="jetpack-newsletter-placements-grid">
									{ placements.map( placement => {
										// Surface "Preview and edit" only when the placement is
										// enabled in the SAVED state AND still shown as checked —
										// otherwise the link opens an empty Site Editor preview.
										// Gating on `savedData` (the persisted baseline) rather than
										// "untouched since save" keeps the link reversible: toggle a
										// saved-on placement off then back on and it returns, while a
										// freshly enabled-but-unsaved placement stays linkless until
										// the save lands.
										const isEnabledAndSaved =
											Boolean( data[ placement.key ] ) && Boolean( savedData?.[ placement.key ] );
										return (
											<PlacementCard
												key={ placement.key }
												id={ `placement-${ placement.key }` }
												name={ String( placement.key ) }
												title={ placement.title }
												illustration={ placement.illustration }
												previewUrl={ isEnabledAndSaved ? placement.previewUrl : undefined }
												checked={ Boolean( data[ placement.key ] ) }
												onChange={ handlePlacementChange }
												onPreviewClick={ handlePlacementPreviewClick }
												disabled={ ! isNewsletterEnabled }
											/>
										);
									} ) }
								</div>
							</Stack>

							<Stack gap="sm" direction="column">
								<Text variant="heading-sm" render={ <h3 /> }>
									{ __( 'Navigation', 'jetpack-newsletter' ) }
								</Text>
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
							</Stack>

							<Stack gap="sm" direction="column">
								<Text variant="heading-sm" render={ <h3 /> }>
									{ __( 'Comments', 'jetpack-newsletter' ) }
								</Text>
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
							</Stack>
						</Stack>
					</Fieldset.Root>
				</Stack>
				<div className="newsletter-card-footer">
					<Button
						onClick={ handleSave }
						disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
						loading={ isSaving }
						loadingAnnouncement={ savingText }
					>
						{ saveText }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
