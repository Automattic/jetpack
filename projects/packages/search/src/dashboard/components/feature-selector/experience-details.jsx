import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import { STORE_ID } from 'store';
import { EXPERIENCE, getExperienceLabel } from './constants';

// URL constants reused verbatim from the legacy ModuleControl.
// `sprintf( ..., encodeURIComponent( returnUrl ) )` was a no-op there
// (the format strings have no `%s`), so we drop it here.
const SEARCH_CUSTOMIZE_URL = 'admin.php?page=jetpack-search-configure';
const WIDGETS_EDITOR_URL = 'widgets.php';

/**
 * Detail panel rendered above the option rows.
 *
 * Switches its content based on the currently *selected* (radio-checked)
 * experience, so the user can preview each option as they tab through. The
 * customization actions inside the Overlay panel only appear when Overlay is
 * also the *active* (saved) experience — the linked pages act on live overlay
 * configuration and would be misleading on a site that hasn't actually saved
 * Overlay yet.
 *
 * Non-Overlay experiences currently render only a title; richer per-experience
 * content is a follow-up.
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
	const showActions = isOverlay && active === EXPERIENCE.OVERLAY;

	const title = isOverlay
		? __( 'Instant Search', 'jetpack-search-pkg' )
		: getExperienceLabel( selected );

	return (
		<section
			className="jp-search-feature-selector__details"
			aria-live="polite"
			aria-label={ __( 'Selected experience details', 'jetpack-search-pkg' ) }
		>
			<Stack direction="column" gap="md">
				<Stack direction="column" gap="xs">
					<h3 className="jp-search-feature-selector__details-title">{ title }</h3>
					{ isOverlay && (
						<p className="jp-search-feature-selector__details-description">
							{ __(
								'A search-as-you-type overlay that opens from any search box on your site. No page reload.',
								'jetpack-search-pkg'
							) }
						</p>
					) }
				</Stack>
				{ showActions && (
					<Stack
						direction="row"
						gap="lg"
						align="center"
						wrap="wrap"
						className="jp-search-feature-selector__details-actions"
					>
						{ supportsInstantSearch && (
							<DetailAction
								title={ __( 'Overlay appearance', 'jetpack-search-pkg' ) }
								description={ __( 'Colors, layout, sort options, sidebar.', 'jetpack-search-pkg' ) }
								linkLabel={ __( 'Customize', 'jetpack-search-pkg' ) }
								href={ SEARCH_CUSTOMIZE_URL }
								disabled={ isUpdating }
							/>
						) }
						<DetailAction
							title={ __( 'Sidebar widgets', 'jetpack-search-pkg' ) }
							description={ __(
								'Choose what filters appear in the overlay.',
								'jetpack-search-pkg'
							) }
							linkLabel={ __( 'Edit widgets', 'jetpack-search-pkg' ) }
							href={ WIDGETS_EDITOR_URL }
							disabled={ isUpdating }
						/>
					</Stack>
				) }
			</Stack>
		</section>
	);
}

const DetailAction = ( { title, description, linkLabel, href, disabled } ) => (
	<Stack
		direction="row"
		gap="md"
		align="center"
		justify="space-between"
		wrap="wrap"
		className="jp-search-feature-selector__details-action"
	>
		<Stack direction="column" gap="xs">
			<span className="jp-search-feature-selector__details-action-title">{ title }</span>
			<span className="jp-search-feature-selector__details-action-description">
				{ description }
			</span>
		</Stack>
		<Button
			variant="minimal"
			tone="brand"
			// @wordpress/ui Button is built on @base-ui/react. Passing `render={ <a /> }`
			// swaps the underlying <button> for an <a> so `href` actually navigates —
			// `href` on a <button> is ignored, which silently breaks the click.
			render={ <a href={ disabled ? undefined : href } /> }
			nativeButton={ false }
			disabled={ disabled }
			className="jp-search-feature-selector__details-action-link"
		>
			{ linkLabel } →
		</Button>
	</Stack>
);
