/* eslint-disable react/jsx-no-bind */

import { TextareaControl, ToggleControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import { Badge, Button, Card, CollapsibleCard, Link, Notice, Stack } from '@wordpress/ui';
import AuthorProfileCard from './author-profile-card';
import SchemaCard from './schema-card';
import SocialPreviewsCard from './social-previews-card';
import TitleStructureField from './title-structure-field';
import VerificationCard from './verification-card';
import './style.scss';
import type { SettingsForm } from '../../data/use-settings';
import type { FC } from 'react';

// Pre-resolved so the production minifier can't fold adjacent ternary `__()`
// calls (breaks i18n extraction). See feedback_i18n_ternary_minifier_fold.
const setLabel = __( 'Set', 'jetpack-seo' );
const notSetLabel = __( 'Not set', 'jetpack-seo' );
const enabledLabel = __( 'Enabled', 'jetpack-seo' );
const disabledLabel = __( 'Disabled', 'jetpack-seo' );
const saveLabel = __( 'Save', 'jetpack-seo' );
const sitemapHelp = __(
	"Publishes an XML sitemap that search engines crawl to discover your content, generated automatically from your site's published posts, pages, and custom post types.",
	'jetpack-seo'
);
// Shown when indexing is blocked: a sitemap can't be generated or served while
// search engines are discouraged, so the toggle is disabled until that's lifted.
const sitemapBlockedHelp = __(
	'Allow search engines to index this site to generate a sitemap.',
	'jetpack-seo'
);
const sitemapViewLabel = __( 'View sitemap', 'jetpack-seo' );
// Shown while the sitemap is enabled but Jetpack's cron hasn't built the file
// yet, so there's no reachable URL to link to (avoids a 404 link).
const sitemapGeneratingLabel = __( 'Generating…', 'jetpack-seo' );

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
	// section to its top. `scroll-margin-top` on the section (style.scss) clears
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

	return (
		<div className="jetpack-seo-settings">
			<div id="visibility" className="jetpack-seo-settings__section">
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Stack direction="row" justify="space-between" align="center" gap="sm">
							<Card.Title>{ __( 'Site visibility', 'jetpack-seo' ) }</Card.Title>
							<Badge intent={ visibilityEnabledCount === 2 ? 'stable' : 'draft' }>
								{ sprintf(
									/* translators: %1$d: number of enabled visibility settings, %2$d: total. */
									__( '%1$d of %2$d enabled', 'jetpack-seo' ),
									visibilityEnabledCount,
									2
								) }
							</Badge>
						</Stack>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Stack direction="column" gap="lg">
							<ToggleControl
								label={ __( 'Allow search engines to index this site', 'jetpack-seo' ) }
								help={ __(
									'Mirrors Settings → Reading → "Discourage search engines from indexing this site". Turning this off asks search engines to stop indexing your site; honored by Google and Bing, ignored by others. Use only for staging or pre-launch sites.',
									'jetpack-seo'
								) }
								checked={ local.search_engines_visible }
								onChange={ next => commit( { search_engines_visible: next } ) }
								disabled={ isSaving }
								__nextHasNoMarginBottom
							/>
							<div className="jetpack-seo-settings__sitemap-field">
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
								{ sitemapEffectivelyOn &&
									( local.sitemap_url ? (
										<Link
											className="jetpack-seo-settings__sitemap-link"
											href={ local.sitemap_url }
											openInNewTab
											rel="noopener noreferrer"
										>
											{ sitemapViewLabel }
										</Link>
									) : (
										<span className="jetpack-seo-settings__sitemap-hint">
											{ sitemapGeneratingLabel }
										</span>
									) ) }
							</div>
						</Stack>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			</div>

			<div id="verification" className="jetpack-seo-settings__section">
				<VerificationCard
					value={ local.verification }
					onChange={ setVerification }
					onCommit={ () => commitFields( [ 'verification' ] ) }
					disabled={ isSaving }
					open={ verificationOpen }
					onOpenChange={ setVerificationOpen }
				/>
			</div>

			{ /* Container for the site-level schema controls delivered by later
			   issues. Own `id` so it can be deep-linked like `#verification`. */ }
			<div id="schema" className="jetpack-seo-settings__section">
				<SchemaCard initialSettings={ local.schema } onSave={ setSchemaSettings } />
			</div>

			{ /* The signed-in user's Person / ProfilePage schema source — per-user,
			   unlike the site-level Schema card above. */ }
			<div id="author-profile" className="jetpack-seo-settings__section">
				<AuthorProfileCard />
			</div>

			<CollapsibleCard.Root defaultOpen={ false }>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title>{ __( 'Canonical URLs', 'jetpack-seo' ) }</Card.Title>
						<Badge intent={ local.canonical_active ? 'stable' : 'draft' }>
							{ local.canonical_active ? enabledLabel : disabledLabel }
						</Badge>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<ToggleControl
						label={ __( 'Add canonical URLs to archive pages', 'jetpack-seo' ) }
						help={ __(
							'Adds a rel="canonical" link to archive pages, helping search engines identify the preferred URL and avoid indexing duplicate content.',
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
				disabled={ isSaving }
			/>

			<CollapsibleCard.Root defaultOpen={ false }>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title>{ __( 'Front-page description', 'jetpack-seo' ) }</Card.Title>
						<Badge intent={ local.front_page_description ? 'stable' : 'draft' }>
							{ local.front_page_description ? setLabel : notSetLabel }
						</Badge>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Stack direction="column" gap="md">
						<TextareaControl
							label={ __( 'Meta description shown on the home page', 'jetpack-seo' ) }
							value={ local.front_page_description }
							onChange={ next => setField( { front_page_description: next } ) }
							rows={ 3 }
							disabled={ isSaving }
							__nextHasNoMarginBottom
						/>
						<div className="jetpack-seo-settings__save">
							<Button
								onClick={ () => commitFields( [ 'front_page_description' ] ) }
								disabled={ isSaving || ! isDirty( [ 'front_page_description' ] ) }
							>
								{ saveLabel }
							</Button>
						</div>
					</Stack>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>

			<SocialPreviewsCard description={ local.front_page_description } />
		</div>
	);
};

export default SettingsScreen;
