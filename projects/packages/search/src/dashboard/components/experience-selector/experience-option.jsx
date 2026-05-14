import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
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

/**
 * One card in the experience-selector grid.
 *
 * The whole card is a click target — a transparent `<label htmlFor>`
 * positioned `inset: 0` catches clicks, and the underlying radio is
 * visually hidden but real (so keyboard nav and screen-reader semantics
 * come from native HTML). Action links sit above the label via z-index
 * to stay clickable, and they're gated on the card being the *active*
 * (saved) experience — when not, they render as a `<span aria-disabled>`
 * so AT users aren't told a non-functional element is a link.
 *
 * @param {object}  props            - Props.
 * @param {string}  props.experience - One of the EXPERIENCE values.
 * @param {boolean} props.disabled   - True if the user's plan doesn't support this experience.
 * @return {import('react').Element} - The card.
 */
export default function ExperienceOption( { experience, disabled = false } ) {
	const { selected, active, isUpdating } = useSelect(
		select => ( {
			selected: select( STORE_ID ).getSelectedExperience(),
			active: select( STORE_ID ).getActiveExperience(),
			isUpdating: select( STORE_ID ).isUpdatingJetpackSettings(),
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

	const className = clsx( 'jp-search-experience-option', {
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
				className="jp-search-experience-option__radio"
				value={ experience }
				checked={ isSelected }
				disabled={ disabled }
				onChange={ disabled ? () => {} : () => setPendingExperience( experience ) }
			/>
			<label
				htmlFor={ inputId }
				className="jp-search-experience-option__overlay"
				aria-label={
					disabled
						? `${ getExperienceLabel( experience ) }. ${ upsellHint }`
						: getExperienceLabel( experience )
				}
			/>
			{ isActive && (
				<span className="jp-search-experience-option__active-badge">
					<Badge intent="stable">{ __( 'Active', 'jetpack-search-pkg' ) }</Badge>
				</span>
			) }
			<Preview />
			<Stack direction="column" gap="lg" className="jp-search-experience-option__content">
				<Stack direction="row" gap="sm" align="center" wrap="wrap">
					<h3 className="jp-search-experience-option__title">
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
					className="jp-search-experience-option__actions"
				>
					<CardLink
						title={ __( 'Overlay appearance', 'jetpack-search-pkg' ) }
						linkLabel={ __( 'Customize', 'jetpack-search-pkg' ) }
						href={ SEARCH_CUSTOMIZE_URL }
						disabled={ actionsDisabled }
					/>
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
		__(
			'<strong>Embedded and Overlay search</strong> — both need the Jetpack engine',
			'jetpack-search-pkg'
		),
		__( '<strong>Search analytics</strong> — and custom relevance rules', 'jetpack-search-pkg' ),
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

const CardLink = ( { title, linkLabel, href, disabled } ) => (
	<Stack direction="column" gap="sm" className="jp-search-experience-option__action">
		<span className="jp-search-experience-option__action-title">{ title }</span>
		{ disabled ? (
			// Render as a non-interactive <span> so AT doesn't announce a link
			// the user can't follow. `aria-disabled` stays as the CSS hook for
			// the muted/not-allowed visual state.
			<span className="jp-search-experience-option__action-link" aria-disabled="true">
				{ linkLabel }
				<span aria-hidden="true"> →</span>
			</span>
		) : (
			<a className="jp-search-experience-option__action-link" href={ href }>
				{ linkLabel }
				<span aria-hidden="true"> →</span>
			</a>
		) }
	</Stack>
);
