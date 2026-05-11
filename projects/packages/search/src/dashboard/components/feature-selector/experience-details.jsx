import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Badge, Stack } from '@wordpress/ui';
import { STORE_ID } from 'store';
import { EXPERIENCE, getExperienceLabel } from './constants';

// URL constants reused verbatim from the legacy ModuleControl.
// `sprintf( ..., encodeURIComponent( returnUrl ) )` was a no-op there
// (the format strings have no `%s`), so we drop it here.
const SEARCH_CUSTOMIZE_URL = 'admin.php?page=jetpack-search-configure';
const WIDGETS_EDITOR_URL = 'widgets.php';
const SEARCH_TEMPLATE_URL = 'site-editor.php?postType=wp_template&postId=search';
const PATTERNS_URL = 'site-editor.php?path=/patterns';

/**
 * Detail panel rendered above the option rows.
 *
 * Switches its content based on the currently *selected* (radio-checked)
 * experience, so the user can preview each option as they tab through. The
 * customization actions are always rendered when the matching experience is
 * selected so users can see what's available, but they only become functional
 * once that experience is the *active* (saved) one — the linked pages act on
 * live configuration and would be misleading on a site that hasn't actually
 * saved that experience yet. While disabled the links omit `href` (so AT
 * users aren't told a non-functional link is a link) and gain
 * `aria-disabled="true"` via the underlying base-ui Button.
 *
 * Off currently renders only a title; richer per-experience content for the
 * Inline / Off rows is a follow-up.
 *
 * @return {import('react').Element} - The detail panel.
 */
export default function ExperienceDetails() {
	const { selected, active, isUpdating, supportsInstantSearch } = useSelect(
		select => ( {
			selected: select( STORE_ID ).getSelectedExperience(),
			active: select( STORE_ID ).getActiveExperience(),
			isUpdating: select( STORE_ID ).isUpdatingJetpackSettings(),
			supportsInstantSearch: select( STORE_ID ).supportsInstantSearch(),
		} ),
		[]
	);

	const isOverlay = selected === EXPERIENCE.OVERLAY;
	const isEmbedded = selected === EXPERIENCE.EMBEDDED;
	const actionsDisabled = isUpdating || active !== selected;
	const isRecommended = selected === EXPERIENCE.EMBEDDED;
	const isActive = selected === active;

	const overlayDescription = __(
		'A search-as-you-type overlay that opens from any search box on your site. No page reload.',
		'jetpack-search-pkg'
	);
	const embeddedDescription = __(
		'A custom search page you build with blocks. Filters, sorting, pagination — all themable in the Site Editor.',
		'jetpack-search-pkg'
	);

	return (
		<section
			className="jp-search-feature-selector__details"
			aria-live="polite"
			aria-label={ __( 'Selected experience details', 'jetpack-search-pkg' ) }
		>
			<Stack direction="row" gap="xl" align="start" wrap="wrap">
				{ isEmbedded && <EmbeddedPreview /> }
				{ isOverlay && <OverlayPreview /> }
				<Stack direction="column" gap="lg" className="jp-search-feature-selector__details-body">
					<Stack direction="column" gap="xs">
						<Stack direction="row" gap="md" align="center" wrap="wrap">
							<h3 className="jp-search-feature-selector__details-title">
								{ getExperienceLabel( selected ) }
							</h3>
							{ isRecommended && (
								<Badge
									intent="informational"
									aria-label={ __( 'Recommended', 'jetpack-search-pkg' ) }
								>
									{ __( 'Recommended', 'jetpack-search-pkg' ) }
								</Badge>
							) }
							{ isActive && (
								<Badge intent="stable" aria-label={ __( 'Active', 'jetpack-search-pkg' ) }>
									{ __( 'Active', 'jetpack-search-pkg' ) }
								</Badge>
							) }
						</Stack>
						{ isOverlay && (
							<p className="jp-search-feature-selector__details-description">
								{ overlayDescription }
							</p>
						) }
						{ isEmbedded && (
							<p className="jp-search-feature-selector__details-description">
								{ embeddedDescription }
							</p>
						) }
					</Stack>
					{ isEmbedded && (
						<Stack
							direction="row"
							gap="xl"
							align="start"
							wrap="wrap"
							className="jp-search-feature-selector__details-actions jp-search-feature-selector__details-actions--inline"
						>
							<DetailLink
								title={ __( 'Search template', 'jetpack-search-pkg' ) }
								description={ __( "Edit your site's search results page.", 'jetpack-search-pkg' ) }
								linkLabel={ __( 'Open in Site Editor', 'jetpack-search-pkg' ) }
								href={ SEARCH_TEMPLATE_URL }
								disabled={ actionsDisabled }
							/>
							<DetailLink
								title={ __( 'Insert pattern', 'jetpack-search-pkg' ) }
								description={ __(
									'Drop a Blog Search layout into any page.',
									'jetpack-search-pkg'
								) }
								linkLabel={ __( 'Browse patterns', 'jetpack-search-pkg' ) }
								href={ PATTERNS_URL }
								disabled={ actionsDisabled }
							/>
						</Stack>
					) }
					{ isOverlay && (
						<Stack
							direction="row"
							gap="xl"
							align="start"
							wrap="wrap"
							className="jp-search-feature-selector__details-actions jp-search-feature-selector__details-actions--inline"
						>
							{ supportsInstantSearch && (
								<DetailLink
									title={ __( 'Overlay appearance', 'jetpack-search-pkg' ) }
									description={ __(
										'Colors, layout, sort options, sidebar.',
										'jetpack-search-pkg'
									) }
									linkLabel={ __( 'Customize', 'jetpack-search-pkg' ) }
									href={ SEARCH_CUSTOMIZE_URL }
									disabled={ actionsDisabled }
								/>
							) }
							<DetailLink
								title={ __( 'Sidebar widgets', 'jetpack-search-pkg' ) }
								description={ __(
									'Choose which filters appear in the overlay.',
									'jetpack-search-pkg'
								) }
								linkLabel={ __( 'Edit widgets', 'jetpack-search-pkg' ) }
								href={ WIDGETS_EDITOR_URL }
								disabled={ actionsDisabled }
							/>
						</Stack>
					) }
				</Stack>
			</Stack>
		</section>
	);
}

// Inline action used for the Embedded / Overlay panels: title +
// description stacked, then a brand-blue text link with a trailing arrow.
// Disabled state drops the `href` and adds `aria-disabled` so screen readers
// don't announce a non-functional link.
const DetailLink = ( { title, description, linkLabel, href, disabled } ) => (
	<Stack
		direction="column"
		gap="xs"
		className="jp-search-feature-selector__details-action jp-search-feature-selector__details-action--inline"
	>
		<span className="jp-search-feature-selector__details-action-title">{ title }</span>
		<span className="jp-search-feature-selector__details-action-description">{ description }</span>
		{ disabled ? (
			<span className="jp-search-feature-selector__details-action-inline-link" aria-disabled="true">
				{ linkLabel }
				<span aria-hidden="true"> →</span>
			</span>
		) : (
			<a className="jp-search-feature-selector__details-action-inline-link" href={ href }>
				{ linkLabel }
				<span aria-hidden="true"> →</span>
			</a>
		) }
	</Stack>
);

// Static visual preview rendered in the Embedded panel: a stylised
// search-results card showing a category filter list and two highlighted
// results. Decorative — `aria-hidden` so AT users get the description above
// instead of a noisy element-by-element read. Strings are intentionally not
// translated; they're placeholder copy in a mockup, not real content.
const EmbeddedPreview = () => (
	<div className="jp-search-feature-selector__embedded-preview" aria-hidden="true">
		<div className="jp-search-feature-selector__embedded-preview-filters">
			<div className="jp-search-feature-selector__embedded-preview-filter-title">Category</div>
			<ul className="jp-search-feature-selector__embedded-preview-filter-list">
				<li className="is-checked">
					<span className="jp-search-feature-selector__embedded-preview-checkbox" />
					Recipes
				</li>
				<li>
					<span className="jp-search-feature-selector__embedded-preview-checkbox" />
					Travel
				</li>
				<li>
					<span className="jp-search-feature-selector__embedded-preview-checkbox" />
					Reviews
				</li>
			</ul>
		</div>
		<div className="jp-search-feature-selector__embedded-preview-results">
			<div className="jp-search-feature-selector__embedded-preview-search">
				<span className="jp-search-feature-selector__embedded-preview-search-icon" />
				pasta
			</div>
			<div className="jp-search-feature-selector__embedded-preview-result">
				<div className="jp-search-feature-selector__embedded-preview-result-title">
					10 Easy <mark>Pasta</mark> Recipes
				</div>
				<div className="jp-search-feature-selector__embedded-preview-result-meta">
					Recipes · Jan 2026
				</div>
			</div>
			<div className="jp-search-feature-selector__embedded-preview-result">
				<div className="jp-search-feature-selector__embedded-preview-result-title">
					Best <mark>Pasta</mark> Sauces
				</div>
				<div className="jp-search-feature-selector__embedded-preview-result-meta">
					Reviews · Mar 2026
				</div>
			</div>
		</div>
	</div>
);

// Static visual preview rendered in the Overlay panel: a stylised page with
// the search overlay popup sitting on top of it. Decorative — `aria-hidden`
// so AT users get the description above instead of an element-by-element
// read. Strings are hardcoded; this is a mockup, not real content.
const OverlayPreview = () => (
	<div className="jp-search-feature-selector__overlay-preview" aria-hidden="true">
		<div className="jp-search-feature-selector__overlay-preview-page">
			<div className="jp-search-feature-selector__overlay-preview-page-bar" />
			<div className="jp-search-feature-selector__overlay-preview-page-bar is-short" />
			<div className="jp-search-feature-selector__overlay-preview-popup">
				<div className="jp-search-feature-selector__overlay-preview-search">
					<span className="jp-search-feature-selector__overlay-preview-search-icon" />
					pasta
				</div>
				<div className="jp-search-feature-selector__overlay-preview-result">
					<span className="jp-search-feature-selector__overlay-preview-thumb" />
					<div>
						<div className="jp-search-feature-selector__overlay-preview-result-title">
							10 Easy Pasta Recipes
						</div>
						<div className="jp-search-feature-selector__overlay-preview-result-meta">Recipes</div>
					</div>
				</div>
				<div className="jp-search-feature-selector__overlay-preview-result">
					<span className="jp-search-feature-selector__overlay-preview-thumb" />
					<div>
						<div className="jp-search-feature-selector__overlay-preview-result-title">
							Best Pasta Sauces
						</div>
						<div className="jp-search-feature-selector__overlay-preview-result-meta">Reviews</div>
					</div>
				</div>
			</div>
		</div>
	</div>
);
