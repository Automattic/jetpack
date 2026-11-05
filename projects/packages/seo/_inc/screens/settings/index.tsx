/* eslint-disable react/jsx-no-bind */

import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import { TextareaControl, ToggleControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { home, link, seen } from '@wordpress/icons';
import { useSearch } from '@wordpress/route';
import { Button, Card, CollapsibleCard, Link, Notice, Stack, Text, Tooltip } from '@wordpress/ui';
import clsx from 'clsx';
import CardTitleIcon from '../../components/card-title-icon';
import StatusIndicator from '../../components/status-indicator';
import UpsellBanner from '../../components/upsell-banner';
import { isGated } from '../../data/is-gated';
import isVerificationSwitchable from '../../data/is-verification-switchable';
import AuthorProfileCard from './author-profile-card';
import SchemaCard from './schema-card';
import SocialPreviewsCard from './social-previews-card';
import styles from './style.module.scss';
import TitleStructureField from './title-structure-field';
import VerificationCard from './verification-card';
import type { SettingStatus } from '../../components/status-indicator';
import type { SettingsForm } from '../../data/use-settings';
import type { FC } from 'react';

const saveLabel = __( 'Save', 'jetpack-seo' );
// The sitemap help swaps between these two, so both are pre-resolved: the
// production minifier folds an adjacent `cond ? __(A) : __(B)` into
// `__(cond ? A : B)`, which breaks i18n extraction. See
// feedback_i18n_ternary_minifier_fold.
const sitemapHelp = __(
	'Publishes a map of your posts and pages so search engines can find your content.',
	'jetpack-seo'
);
// Shown when indexing is blocked: a sitemap can't be generated or served while
// search engines are discouraged, so the toggle is disabled until that's lifted.
const sitemapBlockedHelp = __(
	'Allow search engines to index this site to generate a sitemap.',
	'jetpack-seo'
);
const indexingHelp = __(
	'Turning this off asks search engines to stop indexing your site — Google and Bing honor it, others ignore it. Same setting as Settings → Reading.',
	'jetpack-seo'
);
// Shown when the site is unpublished: on WordPress.com a private or Coming Soon
// site isn't hidden from search by a setting, so no SEO toggle can reveal it.
const indexingPrivateHelp = __(
	'Your site is private, so search engines cannot see it at all. Make it public in your site visibility settings to change this.',
	'jetpack-seo'
);
const indexingComingSoonHelp = __(
	'Your site is in Coming Soon mode, so search engines cannot see it yet. Launch it in your site visibility settings to change this.',
	'jetpack-seo'
);
const indexingLockedTooltip = __( 'Managed in your site visibility settings', 'jetpack-seo' );
const sitemapViewLabel = __( 'View sitemap', 'jetpack-seo' );
const platformManagedHelp = __(
	'This setting is managed by your hosting platform and cannot be changed here.',
	'jetpack-seo'
);
const simpleSitemapHelp = __(
	'WordPress.com manages sitemap generation for this site. Additional hosting features let you turn sitemap generation on or off.',
	'jetpack-seo'
);
const canonicalHelp = __(
	"Points search engines to one preferred URL for archive pages, so duplicates aren't indexed separately.",
	'jetpack-seo'
);
const canonicalConflictHelp = __(
	"Another SEO plugin is active, so Jetpack won't add canonical URLs to avoid conflicts. Deactivate that plugin to use this setting.",
	'jetpack-seo'
);
// Figures are what search *displays*, not a limit we enforce. Google measures a
// pixel width (920px desktop / 680px mobile), which works out around 155 and 120
// characters.
//
// No social figure is quoted on purpose. `functions.opengraph.php` truncates
// `og:description` at 197, but that happens *before* the `jetpack_open_graph_tags`
// filter, and `Jetpack_SEO::set_custom_og_tags()` runs on that filter and
// overwrites the value — so this field reaches social uncut, and each platform
// truncates on display by its own rules.
const frontPageHelp = __(
	'Shown under your site name in search results and social shares. About the first 155 characters display in search, or 120 on mobile.',
	'jetpack-seo'
);
const frontPageLockedHelp = __(
	'Locked while Jetpack SEO is disabled. Your saved description is retained.',
	'jetpack-seo'
);
// Keep in step with the 155 quoted in `frontPageHelp`.
const descriptionSearchLength = 155;
const descriptionMaxLength = 300;

interface Props {
	form: SettingsForm;
}

interface SeoHostingData {
	seo?: { hosting_options_url?: string };
}

type SettingsSearch = Record< string, unknown > & { focus?: string };

/**
 * Consolidated Settings screen. State + saving live in the `form` controller
 * (owned by the Settings route stage); this component is the presentation.
 * Saving is hybrid: toggle sections save on change, while the text-heavy
 * sections (title structure, front-page description) edit local state while
 * typing and persist on an explicit per-section Save button.
 *
 * @param props      - Component props.
 * @param props.form - The settings form controller from `useSettingsForm`.
 * @return The Settings tab content.
 */
const SettingsScreen: FC< Props > = ( { form } ) => {
	const {
		local,
		isSaving,
		setField,
		setSchemaSettings,
		setVerification,
		saveVerification,
		commit,
		commitFields,
		isDirty,
		commitTitleFormat,
		isTitleFormatDirty,
	} = form;

	// Overview deep links (`?focus=visibility|verification`) scroll the matching
	// section to its top. `scroll-margin-block-start` on the section's module clears
	// the fixed header + sticky tabs so the section title stays visible.
	// Bound to the Settings route id (`/settings`); the screen only renders there.
	const search = useSearch( {
		from: '/settings' as unknown as never,
		strict: false,
	} ) as SettingsSearch;
	const focus = search.focus;
	useEffect( () => {
		if ( focus !== 'visibility' && focus !== 'verification' ) {
			return;
		}
		const frame = requestAnimationFrame( () => {
			document.getElementById( focus )?.scrollIntoView( { block: 'start' } );
		} );
		return () => cancelAnimationFrame( frame );
	}, [ focus ] );

	// Expand the verification card when deep-linked to it, so the user lands on
	// the open section rather than a collapsed header.
	const [ verificationOpen, setVerificationOpen ] = useState( focus === 'verification' );
	useEffect( () => {
		if ( focus === 'verification' ) {
			setVerificationOpen( true );
		}
	}, [ focus ] );

	if ( ! local ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>{ __( 'Unable to load settings.', 'jetpack-seo' ) }</Notice.Description>
			</Notice.Root>
		);
	}

	// A sitemap only works when search engines are allowed, so its effective
	// state (and the toggle below) is gated on `search_engines_visible`.
	const simpleSite = isSimpleSite();
	const sitemapEffectivelyOn = ! simpleSite && local.search_engines_visible && local.sitemap_active;
	let sitemapHelpText: string = local.search_engines_visible ? sitemapHelp : sitemapBlockedHelp;
	if ( simpleSite ) {
		sitemapHelpText = simpleSitemapHelp;
	} else if ( ! local.sitemap_switchable ) {
		sitemapHelpText = platformManagedHelp;
	}
	const hostingOptionsUrl = simpleSite
		? ( getScriptData() as SeoHostingData )?.seo?.hosting_options_url
		: undefined;
	// Simple's module state cannot establish whether its platform sitemap is published.
	const visibilityEnabledCount =
		( local.search_engines_visible ? 1 : 0 ) +
		( ( simpleSite && local.search_engines_visible ) || sitemapEffectivelyOn ? 1 : 0 );

	// Module completion states for the card headers. Each module defines
	// "complete" for itself (see JETPACK-2051); the indicator is presentational.
	// Simple counts only indexing; other hosts also count the effective sitemap state.
	let visibilityStatus: SettingStatus = 'not-started';
	if ( visibilityEnabledCount === 2 ) {
		visibilityStatus = 'complete';
	} else if ( visibilityEnabledCount > 0 ) {
		visibilityStatus = 'in-progress';
	}

	// Count code points, not UTF-16 units, so an emoji or an astral character
	// counts once rather than twice.
	const descriptionLength = [ ...local.front_page_description ].length;
	// `maxLength` caps UTF-16 units, so test the cap in those: an emoji spends two.
	const descriptionAtMax = local.front_page_description.length >= descriptionMaxLength;
	const descriptionCount = sprintf(
		/* translators: %d: number of characters currently in the front-page description. */
		_n( '%d character', '%d characters', descriptionLength, 'jetpack-seo' ),
		descriptionLength
	);

	// Single toggles and single fields are binary — they have no partial state,
	// so they move straight from not-started to complete.
	const canonicalStatus: SettingStatus = local.canonical_active ? 'complete' : 'not-started';
	const frontPageStatus: SettingStatus = local.front_page_description ? 'complete' : 'not-started';

	let indexingHelpText: string = indexingHelp;
	if ( local.site_is_coming_soon ) {
		indexingHelpText = indexingComingSoonHelp;
	} else if ( local.site_is_private ) {
		indexingHelpText = indexingPrivateHelp;
	}

	let canonicalHelpText: string = canonicalHelp;
	if ( ! local.canonical_switchable ) {
		canonicalHelpText = platformManagedHelp;
	} else if ( local.canonical_conflicted ) {
		canonicalHelpText = canonicalConflictHelp;
	}

	// On plan-gated sites (below-Premium WordPress.com) the Settings tab keeps only
	// the two always-valid sections (site visibility + verification, both backed by
	// core WordPress options) topped with the upsell banner. Schema, author profile,
	// canonical URLs, title structure and social previews are paid surfaces, hidden
	// here. The front-page description is the one exception: a site that set it back
	// when it was free for all WordPress.com Simple sites keeps editing it even when
	// gated (the value stays live), so its card is shown below in that case too.
	const gated = isGated();

	// Another SEO plugin owns the output these fields feed, so they're locked. Gated sites
	// report the output off too, but keep their grandfathered description editable.
	const outputLocked = ! gated && ! local.title_formats_editable;
	const lockedNotice = local.conflicting_seo_plugin
		? sprintf(
				/* translators: %s: name of the SEO plugin that controls the site's SEO output, e.g. Yoast SEO. */
				__(
					'%s is managing your SEO output, so Jetpack’s title, description, schema and author profile settings are locked while it’s active.',
					'jetpack-seo'
				),
				local.conflicting_seo_plugin
			)
		: __(
				'Jetpack SEO is disabled on this site, so its title, description, schema and author profile settings are locked.',
				'jetpack-seo'
			);

	const schemaDisabledReason = local.conflicting_seo_plugin
		? sprintf(
				/* translators: %1$s: name of the active SEO plugin. */
				__(
					'%1$s is managing your structured data. Your saved Jetpack settings are shown here but are not being used. Deactivate %1$s to edit these settings in Jetpack.',
					'jetpack-seo'
				),
				local.conflicting_seo_plugin
			)
		: __(
				'Jetpack SEO is disabled on this site. Your saved settings are shown here but are not being used. Editing is unavailable while SEO tools are disabled.',
				'jetpack-seo'
			);

	const frontPageDescriptionCard = (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>
						<CardTitleIcon icon={ home } title={ __( 'Front-page description', 'jetpack-seo' ) } />
					</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<StatusIndicator status={ frontPageStatus } />
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="md">
					<TextareaControl
						// Short label: the design system renders control labels as 11px
						// all-caps, which a sentence-length label is unreadable in. The
						// explanation belongs in `help`, which renders in sentence case.
						// Named for the home page rather than just "Description", which
						// would collide with the Organization/Person description field
						// also on this tab and leave two controls indistinguishable to a
						// screen reader.
						label={ __( 'Home page description', 'jetpack-seo' ) }
						help={ outputLocked ? frontPageLockedHelp : frontPageHelp }
						value={ local.front_page_description }
						onChange={ next => setField( { front_page_description: next } ) }
						maxLength={ descriptionMaxLength }
						rows={ 3 }
						disabled={ isSaving || outputLocked }
						__nextHasNoMarginBottom
					/>
					{ /* Count and Save share a row, matching the title-structure footer. */ }
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Text
							variant="body-sm"
							className={ clsx( styles.charCount, {
								[ styles.charCountWarn ]:
									descriptionLength > descriptionSearchLength && ! descriptionAtMax,
								[ styles.charCountMax ]: descriptionAtMax,
							} ) }
						>
							{ descriptionAtMax
								? sprintf(
										/* translators: %s: the character count, e.g. "300 characters". */
										__( '%s — Maximum characters reached.', 'jetpack-seo' ),
										descriptionCount
									)
								: descriptionCount }
						</Text>
						<Button
							onClick={ () => commitFields( [ 'front_page_description' ] ) }
							disabled={ isSaving || outputLocked || ! isDirty( [ 'front_page_description' ] ) }
						>
							{ saveLabel }
						</Button>
					</Stack>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);

	return (
		<Stack direction="column" gap="lg" className={ styles.root }>
			{ outputLocked && (
				<Notice.Root intent="warning">
					<Notice.Description>{ lockedNotice }</Notice.Description>
				</Notice.Root>
			) }
			<div id="visibility" className={ styles.section }>
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header render={ <h2 /> }>
						<Stack direction="row" justify="space-between" align="center" gap="sm">
							<Card.Title>
								<CardTitleIcon icon={ seen } title={ __( 'Site visibility', 'jetpack-seo' ) } />
							</Card.Title>
							{ ! local.site_is_private && (
								<CollapsibleCard.HeaderDescription>
									<StatusIndicator status={ visibilityStatus } />
								</CollapsibleCard.HeaderDescription>
							) }
						</Stack>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Stack direction="column" gap="lg">
							<Stack direction="column" gap="xs">
								{ /* A div trigger: the default button can't wrap the toggle's input. */ }
								<Tooltip.Root disabled={ ! local.site_is_private }>
									<Tooltip.Trigger render={ <div /> }>
										<ToggleControl
											label={ __( 'Allow search engines to index this site', 'jetpack-seo' ) }
											help={ indexingHelpText }
											checked={ local.search_engines_visible }
											onChange={ next => commit( { search_engines_visible: next } ) }
											// A private site is unpublished, not de-indexed. Turning this on would
											// have to publish it, which is not this surface's decision to make.
											disabled={ isSaving || local.site_is_private }
											__nextHasNoMarginBottom
										/>
									</Tooltip.Trigger>
									<Tooltip.Popup positioner={ <Tooltip.Positioner align="start" /> }>
										{ indexingLockedTooltip }
									</Tooltip.Popup>
								</Tooltip.Root>
								{ local.site_is_private && (
									<Link className={ styles.toggleLink } href={ local.site_visibility_url }>
										{ __( 'Manage site visibility', 'jetpack-seo' ) }
									</Link>
								) }
							</Stack>
							<Stack direction="column" gap="xs">
								<ToggleControl
									label={ __( 'Generate an XML sitemap', 'jetpack-seo' ) }
									help={ sitemapHelpText }
									// Simple's disabled switch is not a sitemap publication-status indicator.
									// Other hosts display off while indexing is blocked, preserving the preference.
									checked={ sitemapEffectivelyOn }
									onChange={ next => commit( { sitemap_active: next } ) }
									disabled={
										simpleSite ||
										isSaving ||
										! local.search_engines_visible ||
										! local.sitemap_switchable
									}
									__nextHasNoMarginBottom
								/>
								{ hostingOptionsUrl && (
									<Link
										className={ styles.toggleLink }
										href={ hostingOptionsUrl }
										openInNewTab
										rel="noopener noreferrer"
									>
										{ __( 'Explore hosting options', 'jetpack-seo' ) }
									</Link>
								) }
								{ sitemapEffectivelyOn && local.sitemap_url && (
									<Link
										className={ styles.toggleLink }
										href={ local.sitemap_url }
										openInNewTab
										rel="noopener noreferrer"
									>
										{ sitemapViewLabel }
									</Link>
								) }
							</Stack>
						</Stack>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			</div>

			<div id="verification" className={ styles.section }>
				<VerificationCard
					value={ local.verification }
					active={ local.verification_tools_active }
					// Hidden where that module isn't present: it reads as active there no
					// matter what, so the toggle would be refused and snap back. The codes
					// themselves still save.
					onToggle={
						isVerificationSwitchable()
							? next => commit( { verification_tools_active: next } )
							: undefined
					}
					onChange={ setVerification }
					saveGoogleCode={ code => saveVerification( 'google', code ) }
					onCommit={ () => commitFields( [ 'verification' ] ) }
					disabled={ isSaving }
					open={ verificationOpen }
					onOpenChange={ setVerificationOpen }
				/>
			</div>

			{ ! gated && (
				<>
					{ /* Container for the site-level schema controls delivered by later
				   issues. Own `id` so it can be deep-linked like `#verification`. */ }
					<div id="schema" className={ styles.section }>
						<SchemaCard
							initialSettings={ local.schema }
							onSave={ setSchemaSettings }
							disabled={ outputLocked }
							disabledReason={ schemaDisabledReason }
						/>
					</div>

					{ /* The signed-in user's Person / ProfilePage schema source — per-user,
				   unlike the site-level Schema card above. */ }
					<div id="author-profile" className={ styles.section }>
						<AuthorProfileCard disabled={ outputLocked } disabledReason={ schemaDisabledReason } />
					</div>

					<CollapsibleCard.Root defaultOpen={ false }>
						<CollapsibleCard.Header render={ <h2 /> }>
							<Stack direction="row" justify="space-between" align="center" gap="sm">
								<Card.Title>
									<CardTitleIcon icon={ link } title={ __( 'Canonical URLs', 'jetpack-seo' ) } />
								</Card.Title>
								<CollapsibleCard.HeaderDescription>
									<StatusIndicator status={ canonicalStatus } />
								</CollapsibleCard.HeaderDescription>
							</Stack>
						</CollapsibleCard.Header>
						<CollapsibleCard.Content>
							<ToggleControl
								label={ __( 'Add canonical URLs to archive pages', 'jetpack-seo' ) }
								help={ canonicalHelpText }
								checked={ local.canonical_active }
								onChange={ next => commit( { canonical_active: next } ) }
								disabled={ isSaving || ! local.canonical_switchable || local.canonical_conflicted }
								__nextHasNoMarginBottom
							/>
						</CollapsibleCard.Content>
					</CollapsibleCard.Root>

					<TitleStructureField
						formats={ local.title_formats }
						onChange={ ( pageType, next ) =>
							setField( { title_formats: { ...local.title_formats, [ pageType ]: next } } )
						}
						onSaveFormat={ pageType => commitTitleFormat( pageType ) }
						isFormatDirty={ pageType => isTitleFormatDirty( pageType ) }
						titleSeparator={ local.title_separator }
						editable={ local.title_formats_editable }
						disabled={ isSaving }
					/>

					{ frontPageDescriptionCard }

					{ /* It previews Jetpack's tags, which aren't the ones a conflicting plugin outputs. */ }
					{ ! outputLocked && (
						<SocialPreviewsCard
							description={ local.front_page_description }
							frontPageTitleFormat={ local.title_formats.front_page ?? [] }
							titleSeparator={ local.title_separator }
						/>
					) }
				</>
			) }

			{ /* Grandfathered exception: a gated site that kept a front-page description
			   from the era it was free for all Simple sites keeps editing that one
			   field — the value is still live, and the platform still reads/writes it. */ }
			{ gated && local.has_legacy_front_page_meta && (
				<div id="front-page-description" className={ styles.section }>
					{ frontPageDescriptionCard }
				</div>
			) }

			{ /* Not dismissible, so it sits below the settings rather than pushing them
			   down; the Stack's lg gap keeps space between it and the last section. */ }
			{ gated && <UpsellBanner /> }
		</Stack>
	);
};

export default SettingsScreen;
