/* eslint-disable react/jsx-no-bind */

import { isSimpleSite } from '@automattic/jetpack-script-data';
import { TextareaControl, ToggleControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { home, link, seen } from '@wordpress/icons';
import { useSearch } from '@wordpress/route';
import { Button, Card, CollapsibleCard, Link, Notice, Stack, Text } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import StatusIndicator from '../../components/status-indicator';
import UpsellBanner from '../../components/upsell-banner';
import { isGated } from '../../data/is-gated';
import AdvancedCard from './advanced-card';
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
const sitemapViewLabel = __( 'View sitemap', 'jetpack-seo' );
// Figures are what search *displays*, not a limit we enforce — the field is
// deliberately uncapped. Google measures a pixel width (920px desktop / 680px
// mobile), which works out around 155 and 120 characters.
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

interface Props {
	form: SettingsForm;
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
	const sitemapEffectivelyOn = local.search_engines_visible && local.sitemap_active;
	const visibilityEnabledCount =
		( local.search_engines_visible ? 1 : 0 ) + ( sitemapEffectivelyOn ? 1 : 0 );

	// Module completion states for the card headers. Each module defines
	// "complete" for itself (see JETPACK-2051); the indicator is presentational.
	// Visibility counts its two toggles, the sitemap by its *effective* state
	// since it can't run while indexing is blocked.
	let visibilityStatus: SettingStatus = 'not-started';
	if ( visibilityEnabledCount === 2 ) {
		visibilityStatus = 'complete';
	} else if ( visibilityEnabledCount > 0 ) {
		visibilityStatus = 'in-progress';
	}

	// Count code points, not UTF-16 units, so an emoji or an astral character
	// counts once rather than twice.
	const descriptionLength = [ ...local.front_page_description ].length;

	// Single toggles and single fields are binary — they have no partial state,
	// so they move straight from not-started to complete.
	const canonicalStatus: SettingStatus = local.canonical_active ? 'complete' : 'not-started';
	const frontPageStatus: SettingStatus = local.front_page_description ? 'complete' : 'not-started';

	// On plan-gated sites (below-Premium WordPress.com) the Settings tab keeps only
	// the two always-valid sections (site visibility + verification, both backed by
	// core WordPress options) topped with the upsell banner. Schema, author profile,
	// canonical URLs, title structure and social previews are paid surfaces, hidden
	// here. The front-page description is the one exception: a site that set it back
	// when it was free for all WordPress.com Simple sites keeps editing it even when
	// gated (the value stays live), so its card is shown below in that case too.
	const gated = isGated();

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
						help={ frontPageHelp }
						value={ local.front_page_description }
						onChange={ next => setField( { front_page_description: next } ) }
						maxLength={ 300 }
						rows={ 3 }
						disabled={ isSaving }
						__nextHasNoMarginBottom
					/>
					{ /* Count and Save share a row, matching the title-structure footer. The
					     count is informational only — nothing here is capped. */ }
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Text variant="body-sm" className={ styles.charCount }>
							{ sprintf(
								/* translators: %d: number of characters currently in the front-page description. */
								_n( '%d character', '%d characters', descriptionLength, 'jetpack-seo' ),
								descriptionLength
							) }
						</Text>
						<Button
							onClick={ () => commitFields( [ 'front_page_description' ] ) }
							disabled={ isSaving || ! isDirty( [ 'front_page_description' ] ) }
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
			<div id="visibility" className={ styles.section }>
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header render={ <h2 /> }>
						<Stack direction="row" justify="space-between" align="center" gap="sm">
							<Card.Title>
								<CardTitleIcon icon={ seen } title={ __( 'Site visibility', 'jetpack-seo' ) } />
							</Card.Title>
							<CollapsibleCard.HeaderDescription>
								<StatusIndicator status={ visibilityStatus } />
							</CollapsibleCard.HeaderDescription>
						</Stack>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Stack direction="column" gap="lg">
							<ToggleControl
								label={ __( 'Allow search engines to index this site', 'jetpack-seo' ) }
								help={ __(
									'Turning this off asks search engines to stop indexing your site — Google and Bing honor it, others ignore it. Same setting as Settings → Reading.',
									'jetpack-seo'
								) }
								checked={ local.search_engines_visible }
								onChange={ next => commit( { search_engines_visible: next } ) }
								disabled={ isSaving }
								__nextHasNoMarginBottom
							/>
							<Stack direction="column" gap="xs">
								<ToggleControl
									label={ __( 'Generate an XML sitemap', 'jetpack-seo' ) }
									help={ local.search_engines_visible ? sitemapHelp : sitemapBlockedHelp }
									// Reflect the effective state: a sitemap can't be generated while
									// indexing is blocked, so show it off (the stored preference is kept
									// and restored when indexing is re-enabled).
									checked={ sitemapEffectivelyOn }
									onChange={ next => commit( { sitemap_active: next } ) }
									disabled={ isSaving || ! local.search_engines_visible }
									__nextHasNoMarginBottom
								/>
								{ sitemapEffectivelyOn && local.sitemap_url && (
									<Link
										className={ styles.sitemapLink }
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
					onToggle={ next => commit( { verification_tools_active: next } ) }
					onChange={ setVerification }
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
						<SchemaCard initialSettings={ local.schema } onSave={ setSchemaSettings } />
					</div>

					{ /* The signed-in user's Person / ProfilePage schema source — per-user,
				   unlike the site-level Schema card above. */ }
					<div id="author-profile" className={ styles.section }>
						<AuthorProfileCard />
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
								help={ __(
									"Points search engines to one preferred URL for archive pages, so duplicates aren't indexed separately.",
									'jetpack-seo'
								) }
								checked={ local.canonical_active }
								onChange={ next => commit( { canonical_active: next } ) }
								disabled={ isSaving }
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

					<SocialPreviewsCard description={ local.front_page_description } />
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
			{ /* Higher-risk settings last, after everything routine. Hidden on
			   WordPress.com Simple, where `Modules::is_active()` reports every module
			   active regardless of stored state, so turning SEO tools off would appear
			   to do nothing. Outside the `gated` branch: a gated site still has the
			   module and can still switch it off. */ }
			{ ! isSimpleSite() && <AdvancedCard /> }

			{ /* Not dismissible, so it sits below the settings rather than pushing them
			   down; the Stack's lg gap keeps space between it and the last section. */ }
			{ gated && <UpsellBanner /> }
		</Stack>
	);
};

export default SettingsScreen;
