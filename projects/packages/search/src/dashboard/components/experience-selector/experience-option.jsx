// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- ConfirmDialog is the canonical WP confirm pattern; still under the experimental flag in @wordpress/components 33.
import { Button, Modal, __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Icon, cancelCircleFilled } from '@wordpress/icons';
import { Badge, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { STORE_ID } from 'store';
import { EXPERIENCE, getExperienceLabel } from './constants';
import EmbeddedPreview from './previews/embedded-preview';
import InlinePreview from './previews/inline-preview';
import OffPreview from './previews/off-preview';
import OverlayPreview from './previews/overlay-preview';
import './experience-option.scss';

const SEARCH_CUSTOMIZE_URL = 'admin.php?page=jetpack-search-configure';
const WIDGETS_EDITOR_URL = 'widgets.php';
const THEMES_URL = 'themes.php';
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
		getExperienceLabel( experience )
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
	const { active, isUpdating, activeThemeStylesheet, isBlockTheme } = useSelect(
		select => ( {
			active: select( STORE_ID ).getActiveExperience(),
			isUpdating: select( STORE_ID ).isUpdatingJetpackSettings(),
			activeThemeStylesheet: select( STORE_ID ).getActiveThemeStylesheet(),
			isBlockTheme: select( STORE_ID ).isBlockTheme(),
		} ),
		[]
	);
	const { saveExperience } = useDispatch( STORE_ID );
	const [ isConfirmOpen, setConfirmOpen ] = useState( false );

	const isActive = active === experience;
	const isRecommended = experience === EXPERIENCE.EMBEDDED;
	const linksDisabled = isUpdating || ! isActive;

	// Embedded search is built and customized in the Site Editor, which
	// classic themes don't have. The card stays clickable so the click opens
	// an explanatory modal instead of silently doing nothing — but the switch
	// itself is never committed.
	const isEmbeddedBlockedByTheme = experience === EXPERIENCE.EMBEDDED && ! isBlockTheme;
	const blockedThemeHint = __( 'Embedded search requires a block theme', 'jetpack-search-pkg' );

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
						{ getExperienceLabel( experience ) }
					</h3>
					{ isRecommended && (
						<Badge intent="informational">{ __( 'Recommended', 'jetpack-search-pkg' ) }</Badge>
					) }
				</Stack>
				<CardCopy experience={ experience } />
			</Stack>
			{ experience === EXPERIENCE.EMBEDDED && (
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
					title={
						// eslint-disable-next-line no-nested-ternary -- three mutually exclusive hint states; flattening would duplicate the attribute.
						commitButtonDisabled
							? undefined
							: isEmbeddedBlockedByTheme
							? blockedThemeHint
							: getHoverHint( experience )
					}
					onClick={ () => {
						if ( commitButtonDisabled ) {
							return;
						}
						setConfirmOpen( true );
					} }
					aria-label={
						// eslint-disable-next-line no-nested-ternary -- three mutually exclusive label states; flattening would duplicate the attribute.
						disabled
							? `${ getCommitLabel( experience ) }. ${ upsellHint }`
							: isEmbeddedBlockedByTheme
							? `${ getExperienceLabel( experience ) }. ${ blockedThemeHint }`
							: getCommitLabel( experience )
					}
				/>
			) }
			{ isEmbeddedBlockedByTheme ? (
				isConfirmOpen && (
					// Informational only: classic themes can't run Embedded
					// search, so this modal explains why and points to theme
					// management — no confirm path that would commit the
					// switch. (ConfirmDialog always renders both a confirm and
					// a cancel button, so Modal is the right primitive here.)
					// `size="medium"` constrains the width so the explanation
					// wraps to a readable measure instead of one long line.
					<Modal
						title={ __( 'Embedded search needs a block theme', 'jetpack-search-pkg' ) }
						onRequestClose={ () => setConfirmOpen( false ) }
						className="jp-search-experience-option__blocked-modal"
						size="medium"
					>
						<p>
							{ createInterpolateElement(
								__(
									'Embedded search is a search page built and customized in the Site Editor. Your active theme is a classic theme, which has no Site Editor. <a>Switch to a block theme</a> to use this experience.',
									'jetpack-search-pkg'
								),
								{ a: <a href={ THEMES_URL } /> }
							) }
						</p>
						<div className="jp-search-experience-option__blocked-modal-actions">
							<Button variant="primary" onClick={ () => setConfirmOpen( false ) }>
								{ __( 'Got it', 'jetpack-search-pkg' ) }
							</Button>
						</div>
					</Modal>
				)
			) : (
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
						getExperienceLabel( experience )
					) }
				</ConfirmDialog>
			) }
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
						"Keeps your theme's search layout. We just make the results faster and more relevant behind the scenes, no UI changes.",
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

const CardLink = ( { label, href, disabled } ) =>
	disabled ? (
		// Render as a non-interactive <span> so AT doesn't announce a link
		// the user can't follow. The `is-disabled` class is the CSS hook for
		// the muted/not-allowed visual state — `aria-disabled` on a roleless
		// <span> has no semantic effect for AT.
		<span className="jp-search-experience-option__action jp-search-experience-option__action-link is-disabled">
			{ label }
			<span aria-hidden="true"> →</span>
		</span>
	) : (
		<a
			className="jp-search-experience-option__action jp-search-experience-option__action-link"
			href={ href }
		>
			{ label }
			<span aria-hidden="true"> →</span>
		</a>
	);
