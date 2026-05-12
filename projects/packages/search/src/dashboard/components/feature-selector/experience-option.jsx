import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, cancelCircleFilled } from '@wordpress/icons';
import { Badge, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { STORE_ID } from 'store';
import { EXPERIENCE, getExperienceLabel } from './constants';
import EmbeddedPreview from './previews/embedded-preview';
import InlinePreview from './previews/inline-preview';
import OffPreview from './previews/off-preview';
import OverlayPreview from './previews/overlay-preview';

// URL constants reused verbatim from the legacy ModuleControl.
// `sprintf( ..., encodeURIComponent( returnUrl ) )` was a no-op there
// (the format strings have no `%s`), so we drop it here.
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

/**
 * One card in the 2×2 feature-selector grid.
 *
 * The whole card is a click target that selects a (visually-hidden but real)
 * radio input — clicking anywhere on the card body picks that experience.
 * We achieve this with a transparent `<label htmlFor>` element positioned
 * `inset: 0` over the card; action links inside the card are lifted above
 * the overlay via `z-index` so they remain clickable and tabbable.
 *
 * Native radio + label preserves keyboard nav (arrow keys cycle within the
 * radiogroup, Tab moves to the action links) and screen-reader semantics
 * with no extra ARIA. `:has(.radio:focus-visible)` mirrors the radio's
 * keyboard focus state onto the whole card so the focus ring is visible.
 *
 * Action links (Embedded / Overlay) are gated on the row being the *active*
 * (saved) experience — they link to live configuration that would be
 * misleading on a site that hasn't actually saved that experience yet.
 * While disabled they render as `<span aria-disabled="true">` (no `href`).
 *
 * @param {object}  props            - Component props.
 * @param {string}  props.experience - One of the EXPERIENCE values.
 * @param {boolean} props.disabled   - True if the user's plan doesn't support this experience.
 * @return {import('react').Element} - The option card.
 */
export default function ExperienceOption( { experience, disabled = false } ) {
	const { selected, active, isUpdating, supportsInstantSearch } = useSelect(
		select => ( {
			selected: select( STORE_ID ).getSelectedExperience(),
			active: select( STORE_ID ).getActiveExperience(),
			isUpdating: select( STORE_ID ).isUpdatingJetpackSettings(),
			supportsInstantSearch: select( STORE_ID ).supportsInstantSearch(),
		} ),
		[]
	);
	const { setPendingExperience } = useDispatch( STORE_ID );

	const isSelected = selected === experience;
	const isActive = active === experience;
	const isRecommended = experience === EXPERIENCE.EMBEDDED;
	const actionsDisabled = isUpdating || ! isActive;

	const inputId = `jp-search-experience-${ experience }`;
	const Preview = PREVIEWS[ experience ];

	const className = clsx( 'jp-search-feature-selector__card', {
		'is-selected': isSelected,
		'is-active': isActive,
		'is-disabled': disabled,
	} );

	const upsellHint = __( 'Upgrade your plan to unlock this option.', 'jetpack-search-pkg' );

	return (
		<Stack direction="column" gap="lg" className={ className }>
			<input
				id={ inputId }
				type="radio"
				name="jp-search-experience"
				className="jp-search-feature-selector__card-radio"
				value={ experience }
				checked={ isSelected }
				disabled={ disabled }
				onChange={ disabled ? undefined : () => setPendingExperience( experience ) }
			/>
			{ /* Transparent click-catcher over the whole card. Action links
			   are lifted above it via z-index so they remain clickable. */ }
			<label
				htmlFor={ inputId }
				className="jp-search-feature-selector__card-overlay"
				title={ disabled ? upsellHint : undefined }
				aria-label={ getExperienceLabel( experience ) }
			/>
			{ isActive && (
				<span className="jp-search-feature-selector__card-active-badge">
					<Badge intent="stable" aria-label={ __( 'Active', 'jetpack-search-pkg' ) }>
						{ __( 'Active', 'jetpack-search-pkg' ) }
					</Badge>
				</span>
			) }
			<Preview />
			<Stack direction="column" gap="lg" className="jp-search-feature-selector__card-content">
				<Stack direction="row" gap="sm" align="center" wrap="wrap">
					<h3 className="jp-search-feature-selector__card-title">
						{ getExperienceLabel( experience ) }
					</h3>
					{ isRecommended && (
						<Badge intent="informational" aria-label={ __( 'Recommended', 'jetpack-search-pkg' ) }>
							{ __( 'Recommended', 'jetpack-search-pkg' ) }
						</Badge>
					) }
				</Stack>
				<CardCopy experience={ experience } />
			</Stack>
			{ experience === EXPERIENCE.EMBEDDED && (
				<Stack
					direction="row"
					gap="sm"
					align="start"
					className="jp-search-feature-selector__card-actions"
				>
					<CardLink
						title={ __( 'Search template', 'jetpack-search-pkg' ) }
						linkLabel={ __( 'Open in Site Editor', 'jetpack-search-pkg' ) }
						href={ SEARCH_TEMPLATE_URL }
						disabled={ actionsDisabled }
					/>
					<CardLink
						title={ __( 'Insert pattern', 'jetpack-search-pkg' ) }
						linkLabel={ __( 'Browse patterns', 'jetpack-search-pkg' ) }
						href={ PATTERNS_URL }
						disabled={ actionsDisabled }
					/>
				</Stack>
			) }
			{ experience === EXPERIENCE.OVERLAY && (
				<Stack
					direction="row"
					gap="sm"
					align="start"
					className="jp-search-feature-selector__card-actions"
				>
					{ supportsInstantSearch && (
						<CardLink
							title={ __( 'Overlay appearance', 'jetpack-search-pkg' ) }
							linkLabel={ __( 'Customize', 'jetpack-search-pkg' ) }
							href={ SEARCH_CUSTOMIZE_URL }
							disabled={ actionsDisabled }
						/>
					) }
					<CardLink
						title={ __( 'Sidebar widgets', 'jetpack-search-pkg' ) }
						linkLabel={ __( 'Edit widgets', 'jetpack-search-pkg' ) }
						href={ WIDGETS_EDITOR_URL }
						disabled={ actionsDisabled }
					/>
				</Stack>
			) }
		</Stack>
	);
}

// Per-experience copy under the title. Embedded / Overlay get a single
// description line; Inline adds a "no settings" note; Off renders the
// "what visitors lose" list with cross-circle icons.
const CardCopy = ( { experience } ) => {
	if ( experience === EXPERIENCE.EMBEDDED ) {
		return (
			<p className="jp-search-feature-selector__card-description">
				{ __(
					'A custom search page you build with blocks. Filters, sorting, pagination — all themable in the Site Editor.',
					'jetpack-search-pkg'
				) }
			</p>
		);
	}
	if ( experience === EXPERIENCE.OVERLAY ) {
		return (
			<p className="jp-search-feature-selector__card-description">
				{ __(
					'A search-as-you-type overlay that opens from any search box on your site. No page reload.',
					'jetpack-search-pkg'
				) }
			</p>
		);
	}
	if ( experience === EXPERIENCE.INLINE ) {
		return (
			<>
				<p className="jp-search-feature-selector__card-description">
					{ __(
						"Keeps your theme's search layout. We just make the results faster and more relevant behind the scenes — Elasticsearch under the hood, no UI changes.",
						'jetpack-search-pkg'
					) }
				</p>
				<p className="jp-search-feature-selector__card-description">
					{ __(
						'No additional settings — this mode is set-it-and-forget-it.',
						'jetpack-search-pkg'
					) }
				</p>
			</>
		);
	}
	// EXPERIENCE.OFF
	const offLosses = [
		{
			title: __( 'Fast results', 'jetpack-search-pkg' ),
			detail: __( '— searches hit your database', 'jetpack-search-pkg' ),
		},
		{
			title: __( 'Smart ranking', 'jetpack-search-pkg' ),
			detail: __( '— no typo tolerance or language-aware matching', 'jetpack-search-pkg' ),
		},
		{
			title: __( 'Embedded and Overlay search', 'jetpack-search-pkg' ),
			detail: __( '— both need the Jetpack engine', 'jetpack-search-pkg' ),
		},
		{
			title: __( 'Search analytics', 'jetpack-search-pkg' ),
			detail: __( 'and custom relevance rules', 'jetpack-search-pkg' ),
		},
	];
	return (
		<>
			<p className="jp-search-feature-selector__card-description">
				{ __( 'Visitors use WordPress default search, and miss out on:', 'jetpack-search-pkg' ) }
			</p>
			<ul className="jp-search-feature-selector__card-loss-list">
				{ offLosses.map( ( { title, detail } ) => (
					<li key={ title }>
						<Icon
							className="jp-search-feature-selector__card-loss-icon"
							icon={ cancelCircleFilled }
							size={ 18 }
						/>
						<span>
							<strong>{ title }</strong> { detail }
						</span>
					</li>
				) ) }
			</ul>
		</>
	);
};

// Inline action used for the Embedded / Overlay cards: title stacked over
// a brand-blue text link with a trailing arrow. Disabled state drops the
// `href` and adds `aria-disabled` so screen readers don't announce a
// non-functional link.
const CardLink = ( { title, linkLabel, href, disabled } ) => (
	<Stack direction="column" gap="sm" className="jp-search-feature-selector__card-action">
		<span className="jp-search-feature-selector__card-action-title">{ title }</span>
		{ disabled ? (
			<span className="jp-search-feature-selector__card-action-link" aria-disabled="true">
				{ linkLabel }
				<span aria-hidden="true"> →</span>
			</span>
		) : (
			<a className="jp-search-feature-selector__card-action-link" href={ href }>
				{ linkLabel }
				<span aria-hidden="true"> →</span>
			</a>
		) }
	</Stack>
);
