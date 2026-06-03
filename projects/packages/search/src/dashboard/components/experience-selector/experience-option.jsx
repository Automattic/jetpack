// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- ConfirmDialog is the canonical WP confirm pattern; still under the experimental flag in @wordpress/components 33.
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Icon, cancelCircleFilled } from '@wordpress/icons';
import { Badge, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { STORE_ID } from 'store';
import CardLink from './card-link';
import { EXPERIENCE, getCardTitle } from './constants';
import EmbeddedPreview from './previews/embedded-preview';
import InlinePreview from './previews/inline-preview';
import OffPreview from './previews/off-preview';
import OverlayBlocksPreview from './previews/overlay-blocks-preview';
import OverlayPreview from './previews/overlay-preview';
import SingletonTemplateActions from './singleton-template-actions';
import './experience-option.scss';

const SEARCH_CUSTOMIZE_URL = 'admin.php?page=jetpack-search-configure';
const WIDGETS_EDITOR_URL = 'widgets.php';
// The Site Editor identifies templates by `<theme-stylesheet>//<template-slug>`
// even for plugin-registered ones, so the active theme is part of the URL. Built
// at render time so the link follows theme switches without a re-deploy. Falls
// back to the Templates list when the stylesheet is missing from initial state.
const buildSearchTemplateUrl = stylesheet =>
	stylesheet
		? `site-editor.php?p=%2Fwp_template%2F${ encodeURIComponent(
				stylesheet
		  ) }%2F%2Fjetpack-search&canvas=edit`
		: 'site-editor.php?p=%2Ftemplate';
const PATTERNS_URL = 'site-editor.php?p=%2Fpattern&search=jetpack-search';

const PREVIEWS = {
	[ EXPERIENCE.EMBEDDED ]: EmbeddedPreview,
	[ EXPERIENCE.OVERLAY_BLOCKS ]: OverlayBlocksPreview,
	[ EXPERIENCE.OVERLAY ]: OverlayPreview,
	[ EXPERIENCE.INLINE ]: InlinePreview,
	[ EXPERIENCE.OFF ]: OffPreview,
};

const getCommitLabel = experience => {
	switch ( experience ) {
		case EXPERIENCE.EMBEDDED:
			return _x(
				'Use Embedded search',
				'Button label that activates the Embedded search experience',
				'jetpack-search-pkg'
			);
		case EXPERIENCE.OVERLAY_BLOCKS:
			return _x(
				'Use Overlay search (blocks)',
				'Button label that activates the blocks-powered Overlay search experience',
				'jetpack-search-pkg'
			);
		case EXPERIENCE.OVERLAY:
			return _x(
				'Use Overlay search',
				'Button label that activates the Overlay search experience',
				'jetpack-search-pkg'
			);
		case EXPERIENCE.INLINE:
			return _x(
				'Use Theme search',
				"Button label that activates the theme's built-in search",
				'jetpack-search-pkg'
			);
		case EXPERIENCE.OFF:
			return _x(
				'Turn off Jetpack Search',
				'Button label that disables Jetpack Search entirely',
				'jetpack-search-pkg'
			);
		default:
			return __( 'Use', 'jetpack-search-pkg' );
	}
};

const getHoverHint = experience => {
	if ( experience === EXPERIENCE.OFF ) {
		return _x(
			'Click to turn off Jetpack Search',
			'Hover hint on the OFF card explaining what clicking the card does',
			'jetpack-search-pkg'
		);
	}
	return sprintf(
		/* translators: %s — the human-readable experience name (e.g. "Embedded search"). */
		_x(
			'Click to switch to %s',
			'Hover hint on a non-active experience card explaining what clicking the card does',
			'jetpack-search-pkg'
		),
		getCardTitle( experience )
	);
};

/**
 * One card in the experience-selector grid.
 *
 * Inactive cards behave as a single button — a transparent `<button>` is
 * stretched across the card so clicking anywhere on it opens the confirm
 * dialog. The card's text content (title, description, action labels) sits
 * underneath visually but is non-interactive while the card itself is
 * inactive, so the click-anywhere target doesn't compete with anything.
 *
 * Active cards skip the overlay button: their action links (Customize /
 * Edit widgets / Edit search template / Insert pattern) are the primary
 * CTAs and need to be reachable.
 *
 * @param {object}  props            - Props.
 * @param {string}  props.experience - One of the EXPERIENCE values.
 * @param {boolean} props.disabled   - True if the user's plan doesn't support this experience.
 * @return {import('react').Element} - The card.
 */
export default function ExperienceOption( { experience, disabled = false } ) {
	const {
		active,
		isUpdating,
		activeThemeStylesheet,
		isBlockTheme,
		blockTemplateOverlay,
		searchTemplate,
	} = useSelect(
		select => ( {
			active: select( STORE_ID ).getActiveExperience(),
			isUpdating: select( STORE_ID ).isUpdatingJetpackSettings(),
			activeThemeStylesheet: select( STORE_ID ).getActiveThemeStylesheet(),
			isBlockTheme: select( STORE_ID ).isBlockTheme(),
			blockTemplateOverlay: select( STORE_ID ).getBlockTemplateOverlayConfig(),
			searchTemplate: select( STORE_ID ).getSearchTemplateConfig(),
		} ),
		[]
	);
	const { saveExperience } = useDispatch( STORE_ID );
	const [ isConfirmOpen, setConfirmOpen ] = useState( false );

	const isActive = active === experience;
	const isBeta = experience === EXPERIENCE.OVERLAY_BLOCKS || experience === EXPERIENCE.EMBEDDED;
	const linksDisabled = isUpdating || ! isActive;

	const Preview = PREVIEWS[ experience ];

	const className = clsx( 'jp-search-experience-option', {
		'is-active': isActive,
		'is-disabled': disabled,
	} );

	const upsellHint = __( 'Upgrade your plan to unlock this option.', 'jetpack-search-pkg' );

	// `role="group"` makes the surrounding `<div>` an ARIA-recognised landmark
	// so its `aria-label` / `aria-disabled` actually announce. The card's `<h3>`
	// is named via `aria-labelledby`, which is the announce-by-content pattern
	// preferred when the label is already on-screen.
	const titleId = `jp-search-experience-option-title-${ experience }`;
	const commitButtonDisabled = disabled || isUpdating;

	return (
		<Stack
			role="group"
			direction="column"
			gap="lg"
			className={ className }
			aria-labelledby={ titleId }
			aria-disabled={ disabled || undefined }
			// `aria-current="true"` is the right pattern for "this is the
			// currently-selected option in a set" — pairs the visible
			// brand-tinted background + "Active" badge with a semantic cue
			// for AT users navigating between the cards.
			aria-current={ isActive || undefined }
		>
			{ isActive && (
				<span className="jp-search-experience-option__active-badge">
					<Badge intent="stable">{ __( 'Active', 'jetpack-search-pkg' ) }</Badge>
				</span>
			) }
			<Preview />
			<Stack direction="column" gap="lg" className="jp-search-experience-option__content">
				<Stack direction="row" gap="sm" align="center" wrap="wrap">
					<h3 id={ titleId } className="jp-search-experience-option__title">
						{ getCardTitle( experience ) }
					</h3>
					{ isBeta && <Badge intent="informational">{ __( 'Beta', 'jetpack-search-pkg' ) }</Badge> }
				</Stack>
				<CardCopy experience={ experience } />
			</Stack>
			{ experience === EXPERIENCE.EMBEDDED && isBlockTheme && (
				// Block themes get the Site-Editor entry points — the FSE
				// template editor is the native customization surface and
				// integrates with theme parts / global styles. The classic-
				// theme arm below uses the singleton-CPT path instead.
				<Stack
					direction="row"
					gap="sm"
					align="start"
					className="jp-search-experience-option__actions"
				>
					<CardLink
						label={ __( 'Edit search template', 'jetpack-search-pkg' ) }
						href={ buildSearchTemplateUrl( activeThemeStylesheet ) }
						disabled={ linksDisabled }
					/>
					<CardLink
						label={ __( 'Insert pattern', 'jetpack-search-pkg' ) }
						href={ PATTERNS_URL }
						disabled={ linksDisabled }
					/>
				</Stack>
			) }
			{ experience === EXPERIENCE.EMBEDDED && ! isBlockTheme && (
				// Classic themes have no Site Editor — route customization
				// through the `Search_Template` singleton CPT instead.
				// Same `post.php`-on-a-hidden-CPT pattern as the blocks
				// Overlay below.
				<SingletonTemplateActions
					config={ searchTemplate }
					editLabel={ __( 'Edit search template', 'jetpack-search-pkg' ) }
					restoreConfirmMessage={ __(
						'Restore the bundled Search template? Your customizations will be deleted.',
						'jetpack-search-pkg'
					) }
					successMessage={ __(
						'The Search template has been restored to the bundled default.',
						'jetpack-search-pkg'
					) }
					errorMessage={ __( 'Could not restore the Search template.', 'jetpack-search-pkg' ) }
					linksDisabled={ linksDisabled }
				/>
			) }
			{ /*
			   SEARCH-216 — the blocks-powered Overlay renders from a
			   separate bundled template the Site Editor cannot reach.
			   "Edit the Search overlay" lands the admin in the standard
			   block editor on a hidden singleton CPT seeded from that
			   bundled template, with "Restore default" appearing once the
			   admin has saved a customization. Works on classic themes
			   too because `post.php` predates the Site Editor.
			*/ }
			{ experience === EXPERIENCE.OVERLAY_BLOCKS && (
				<SingletonTemplateActions
					config={ blockTemplateOverlay }
					editLabel={ __( 'Edit the Search overlay', 'jetpack-search-pkg' ) }
					restoreConfirmMessage={ __(
						'Restore the bundled Search overlay template? Your customizations will be deleted.',
						'jetpack-search-pkg'
					) }
					successMessage={ __(
						'The Search overlay template has been restored to the bundled default.',
						'jetpack-search-pkg'
					) }
					errorMessage={ __(
						'Could not restore the Search overlay template.',
						'jetpack-search-pkg'
					) }
					linksDisabled={ linksDisabled }
				/>
			) }
			{ /*
			   The product-overlay variant's "Edit … / Restore default" lives on
			   the WooCommerce product-search toggle in Settings (gated by the
			   override), not here — keeping it on the card too would duplicate it.
			*/ }
			{ experience === EXPERIENCE.OVERLAY && (
				<Stack
					direction="row"
					gap="sm"
					align="start"
					className="jp-search-experience-option__actions"
				>
					<CardLink
						label={ __( 'Customize', 'jetpack-search-pkg' ) }
						href={ SEARCH_CUSTOMIZE_URL }
						disabled={ linksDisabled }
					/>
					<CardLink
						label={ __( 'Edit widgets', 'jetpack-search-pkg' ) }
						href={ WIDGETS_EDITOR_URL }
						disabled={ linksDisabled }
					/>
				</Stack>
			) }
			{ ! isActive && (
				// Transparent button stretched across the card — clicking
				// anywhere on the card opens the confirm dialog. Native
				// `<button>`, but with `aria-disabled` (not native `disabled`)
				// when paywalled so it stays in the tab order and AT can read
				// the upsell hint. `aria-disabled` doesn't block click events,
				// so guard the handler too.
				//
				// `title` adds a very weak native-browser tooltip — "Click to
				// switch to <X>" — that surfaces after the OS's hover delay.
				// Intentionally not a custom-styled chip; the goal is the
				// browser-default treatment, not a CTA. Suppressed on
				// paywalled cards so we don't tease an inaccessible action.
				<button
					type="button"
					className="jp-search-experience-option__commit-overlay"
					aria-disabled={ commitButtonDisabled }
					title={ commitButtonDisabled ? undefined : getHoverHint( experience ) }
					onClick={ () => {
						if ( commitButtonDisabled ) {
							return;
						}
						setConfirmOpen( true );
					} }
					aria-label={
						disabled
							? `${ getCommitLabel( experience ) }. ${ upsellHint }`
							: getCommitLabel( experience )
					}
				/>
			) }
			<ConfirmDialog
				isOpen={ isConfirmOpen }
				onConfirm={ () => {
					saveExperience( experience );
					setConfirmOpen( false );
				} }
				onCancel={ () => setConfirmOpen( false ) }
				confirmButtonText={ getCommitLabel( experience ) }
			>
				{ sprintf(
					/* translators: %s — the human-readable experience name (e.g. "Embedded search"). */
					__( 'Switch the visitor-facing search experience to %s?', 'jetpack-search-pkg' ),
					getCardTitle( experience )
				) }
			</ConfirmDialog>
		</Stack>
	);
}

const CardCopy = ( { experience } ) => {
	if ( experience === EXPERIENCE.EMBEDDED ) {
		return (
			<p className="jp-search-experience-option__description">
				{ __(
					'A search-as-you-type customizable search page built with blocks. Filters, sorting, pagination — all themable in the Site Editor.',
					'jetpack-search-pkg'
				) }
			</p>
		);
	}
	if ( experience === EXPERIENCE.OVERLAY_BLOCKS ) {
		return (
			<p className="jp-search-experience-option__description">
				{ __(
					'In beta — a search-as-you-type overlay rendered from your Search blocks. Same filters, sorting, and store as Embedded, but opens over your existing pages just like former Instant Search overlay.',
					'jetpack-search-pkg'
				) }
			</p>
		);
	}
	if ( experience === EXPERIENCE.OVERLAY ) {
		return (
			<p className="jp-search-experience-option__description">
				{ __(
					'A search-as-you-type overlay that opens from any search box on your site (formerly Instant Search).',
					'jetpack-search-pkg'
				) }
			</p>
		);
	}
	if ( experience === EXPERIENCE.INLINE ) {
		return (
			<>
				<p className="jp-search-experience-option__description">
					{ __(
						"Keeps your theme's search layout. We just make the results faster and more relevant behind the scenes, no UI changes. Search blocks are still available to drop into any page or template.",
						'jetpack-search-pkg'
					) }
				</p>
				<p className="jp-search-experience-option__description">
					{ __(
						'No additional settings — this mode is set-it-and-forget-it.',
						'jetpack-search-pkg'
					) }
				</p>
			</>
		);
	}
	const offLosses = [
		__(
			'<strong>Fast and smart results</strong> — slower database-powered search, no typo tolerance or language-aware matching',
			'jetpack-search-pkg'
		),
		__(
			'<strong>Offloaded search</strong> — every query now hits your database',
			'jetpack-search-pkg'
		),
	];
	return (
		<>
			<p className="jp-search-experience-option__description">
				{ __( 'Visitors use WordPress default search, and you lose:', 'jetpack-search-pkg' ) }
			</p>
			<ul className="jp-search-experience-option__loss-list">
				{ offLosses.map( ( loss, index ) => (
					<li key={ index }>
						<Icon
							className="jp-search-experience-option__loss-icon"
							icon={ cancelCircleFilled }
							size={ 18 }
						/>
						<span>{ createInterpolateElement( loss, { strong: <strong /> } ) }</span>
					</li>
				) ) }
			</ul>
		</>
	);
};
