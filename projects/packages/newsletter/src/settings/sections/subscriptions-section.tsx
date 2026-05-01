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
	// cards (Image #5). Each entry carries the underlying boolean key + the
	// site-editor template that backs the "Preview and edit" link. The
	// `illustration` slot is left empty for now — designs are being mocked
	// separately and will be slotted in via this prop without touching the
	// surrounding chassis.
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

	// Single change handler shared across the whole placement grid. The
	// PlacementCard's `name` prop carries the setting key, so we don't need
	// to bind a closure per row in render.
	const handlePlacementChange = useCallback(
		( key: string, next: boolean ) => {
			onChange( { [ key ]: next } as Partial< NewsletterSettings > );
		},
		[ onChange ]
	);

	// Per-toggle stable handlers for the Navigation + Comments groups. Each
	// memoizes a single boolean -> updates the corresponding setting key.
	// Defining them upfront keeps `react/jsx-no-bind` happy (no closures
	// allocated per render) while letting each ToggleControl take a stable
	// `onChange` reference.
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
				{ /* One vertical rhythm for the whole card body so the intro,
				     placement grid, navigation/comments toggles, and Save row
				     all sit on consistent spacing. The `<fieldset>` only
				     carries the `disabled` semantic — its native browser
				     border + padding are reset in the package stylesheet. */ }
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
					<Stack direction="row" justify="flex-end">
						<Button
							size="compact"
							variant="primary"
							onClick={ handleSave }
							disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
							isBusy={ isSaving }
						>
							{ isSaving ? savingText : saveText }
						</Button>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
