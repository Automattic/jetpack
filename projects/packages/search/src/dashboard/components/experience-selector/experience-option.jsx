// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- ConfirmDialog is the canonical WP confirm pattern; still under the experimental flag in @wordpress/components 33.
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Icon, cancelCircleFilled, check } from '@wordpress/icons';
import { Badge, Button, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { STORE_ID } from 'store';
import { EXPERIENCE, getExperienceLabel } from './constants';
import EmbeddedPreview from './previews/embedded-preview';
import InlinePreview from './previews/inline-preview';
import OffPreview from './previews/off-preview';
import OverlayPreview from './previews/overlay-preview';
import './experience-option.scss';

// URL constants reused verbatim from the legacy ModuleControl.
// `sprintf( ..., encodeURIComponent( returnUrl ) )` was a no-op there
// (the format strings had no `%s`), so we drop it here.
const SEARCH_CUSTOMIZE_URL = 'admin.php?page=jetpack-search-configure';
const WIDGETS_EDITOR_URL = 'widgets.php';
const SEARCH_TEMPLATE_URL = 'site-editor.php?postType=wp_template&postId=search';
const PATTERNS_URL = 'site-editor.php?path=/patterns';

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

// Active-state counterparts to `getCommitLabel`. The grammar mirrors the
// action labels ("Use X" → "Using X", "Turn off X" → "X is off") so the
// active card slot reads as the resolved state of the same verb.
const getActiveLabel = experience => {
	switch ( experience ) {
		case EXPERIENCE.EMBEDDED:
			return _x(
				'Using Embedded search',
				'State indicator on the active card — Embedded search is the running experience',
				'jetpack-search-pkg'
			);
		case EXPERIENCE.OVERLAY:
			return _x(
				'Using Overlay search',
				'State indicator on the active card — Overlay search is the running experience',
				'jetpack-search-pkg'
			);
		case EXPERIENCE.INLINE:
			return _x(
				'Using Theme search',
				"State indicator on the active card — the theme's built-in search is in use",
				'jetpack-search-pkg'
			);
		case EXPERIENCE.OFF:
			return _x(
				'Jetpack Search is off',
				'State indicator on the active card — Jetpack Search is disabled',
				'jetpack-search-pkg'
			);
		default:
			return __( 'In use', 'jetpack-search-pkg' );
	}
};

/**
 * One card in the experience-selector grid.
 *
 * Every card carries a bottom-right slot. On inactive cards it's a primary
 * commit button that dispatches `saveExperience()` (no separate Save step).
 * On the active card it's a disabled, check-iconed state indicator ("Using
 * X") that keeps the four cards visually aligned. Both follow the same
 * hover-reveal pattern on hover-capable pointers; on touch / no-hover the
 * slot sits in the card's normal flex flow (see SCSS).
 *
 * @param {object}  props            - Props.
 * @param {string}  props.experience - One of the EXPERIENCE values.
 * @param {boolean} props.disabled   - True if the user's plan doesn't support this experience.
 * @return {import('react').Element} - The card.
 */
export default function ExperienceOption( { experience, disabled = false } ) {
	const { active, isUpdating } = useSelect(
		select => ( {
			active: select( STORE_ID ).getActiveExperience(),
			isUpdating: select( STORE_ID ).isUpdatingJetpackSettings(),
		} ),
		[]
	);
	const { saveExperience } = useDispatch( STORE_ID );
	const [ isConfirmOpen, setConfirmOpen ] = useState( false );

	const isActive = active === experience;
	const isRecommended = experience === EXPERIENCE.EMBEDDED;
	const linksDisabled = isUpdating || ! isActive;

	const Preview = PREVIEWS[ experience ];

	const className = clsx( 'jp-search-experience-option', {
		'is-active': isActive,
		'is-disabled': disabled,
	} );

	const upsellHint = __( 'Upgrade your plan to unlock this option.', 'jetpack-search-pkg' );

	// `role="group"` makes the surrounding `<div>` an ARIA-recognised landmark
	// so its `aria-label` / `aria-disabled` actually announce. The card's `<h2>`
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
					<h2 id={ titleId } className="jp-search-experience-option__title">
						{ getExperienceLabel( experience ) }
					</h2>
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
						href={ SEARCH_TEMPLATE_URL }
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
			<div className="jp-search-experience-option__commit">
				{ isActive ? (
					// State indicator — same row as the inactive cards' commit
					// button so the four cards share a baseline. `outline` +
					// brand check icon reads as "completed state" rather than a
					// disabled action; `aria-current` on the card already
					// announces the active state to AT.
					<Button variant="outline" disabled tabIndex={ -1 }>
						<Icon icon={ check } size={ 18 } />
						{ getActiveLabel( experience ) }
					</Button>
				) : (
					<Button
						variant="primary"
						disabled={ commitButtonDisabled }
						loading={ isUpdating }
						// `@wordpress/ui` Button uses `aria-disabled` rather than the
						// native `disabled` attribute (to preserve focus order on
						// disabled controls). aria-disabled doesn't block click
						// events reliably across versions, so guard the handler too.
						onClick={ () => {
							if ( commitButtonDisabled ) {
								return;
							}
							setConfirmOpen( true );
						} }
						aria-label={
							disabled ? `${ getCommitLabel( experience ) }. ${ upsellHint }` : undefined
						}
					>
						{ getCommitLabel( experience ) }
					</Button>
				) }
			</div>
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
		__( '<strong>Fast results</strong> — searches hit your database', 'jetpack-search-pkg' ),
		__(
			'<strong>Smart ranking</strong> — no typo tolerance or language-aware matching',
			'jetpack-search-pkg'
		),
	];
	return (
		<>
			<p className="jp-search-experience-option__description">
				{ __( 'Visitors use WordPress default search, and miss out on:', 'jetpack-search-pkg' ) }
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
		// the user can't follow. `aria-disabled` stays as the CSS hook for
		// the muted/not-allowed visual state.
		<span
			className="jp-search-experience-option__action jp-search-experience-option__action-link"
			aria-disabled="true"
		>
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
