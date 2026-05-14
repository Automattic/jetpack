import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Icon, cancelCircleFilled } from '@wordpress/icons';
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

/**
 * One card in the experience-selector grid.
 *
 * Each non-active card carries its own commit button at the bottom-right.
 * The button is visually hidden by default and revealed on hover / focus
 * (and always on no-hover devices, see SCSS) — clicking it dispatches
 * `saveExperience()` immediately, so there's no separate Save step.
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

	const isActive = active === experience;
	const isRecommended = experience === EXPERIENCE.EMBEDDED;
	const linksDisabled = isUpdating || ! isActive;

	const Preview = PREVIEWS[ experience ];

	const className = clsx( 'jp-search-experience-option', {
		'is-active': isActive,
		'is-disabled': disabled,
	} );

	const upsellHint = __( 'Upgrade your plan to unlock this option.', 'jetpack-search-pkg' );

	const cardLabel = disabled
		? `${ getExperienceLabel( experience ) }. ${ upsellHint }`
		: getExperienceLabel( experience );

	return (
		<Stack
			direction="column"
			gap="lg"
			className={ className }
			aria-label={ cardLabel }
			aria-disabled={ disabled || undefined }
		>
			{ isActive && (
				<span className="jp-search-experience-option__active-badge">
					<Badge intent="stable">{ __( 'Active', 'jetpack-search-pkg' ) }</Badge>
				</span>
			) }
			<Preview />
			<Stack direction="column" gap="lg" className="jp-search-experience-option__content">
				<Stack direction="row" gap="sm" align="center" wrap="wrap">
					<h2 className="jp-search-experience-option__title">
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
			{ ! isActive && (
				<div className="jp-search-experience-option__commit">
					<Button
						variant="primary"
						disabled={ disabled || isUpdating }
						loading={ isUpdating }
						onClick={ () => saveExperience( experience ) }
					>
						{ getCommitLabel( experience ) }
					</Button>
				</div>
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
