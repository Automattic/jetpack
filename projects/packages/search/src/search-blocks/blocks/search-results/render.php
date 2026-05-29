<?php
/**
 * Search Results block render.
 *
 * Group-like wrapper that emits `$content` (the serialized inner block
 * markup). Each inner result block handles its own state via the
 * Interactivity API store; this block contributes only the surrounding
 * chrome (block-wrapper attrs derived from color/spacing/border/typography
 * supports).
 *
 * Free-plan attribution: the Jetpack colophon must appear on every
 * free-plan results page. If an author has removed the
 * `jetpack-search/powered-by` block from the panel (or never had one in
 * their pattern), this renderer appends a canonical render of it on the
 * way out so the attribution is structurally non-removable. Paid-plan
 * sites are unaffected — authors can keep, hide, or delete the block
 * freely.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// Author-set post-type scope for this search experience. The constraint
// shape (`{ include: string[], exclude: string[] }`) round-trips through
// `Filter_Post_Type::build_constraint()` for slug sanitization + the live
// searchable-types allowlist, then seeds the `state.staticPostTypes` slot
// the store reads in `fetchResults()`. One writer per page (a search-
// results region is singular by design), so no merge — straight overwrite
// of the slot's deep-merge entry. The block attribute is `postTypeMode`
// (renamed from the helper's neutral `mode` prop to avoid colliding with
// any future generic `mode` attribute on this block).
$scope = Filter_Post_Type::build_constraint(
	array(
		'mode'      => ( $attributes['postTypeMode'] ?? 'exclude' ) === 'include' ? 'include' : 'exclude',
		'postTypes' => $attributes['postTypes'] ?? array(),
	)
);
if ( function_exists( 'wp_interactivity_state' ) && ( ! empty( $scope['include'] ) || ! empty( $scope['exclude'] ) ) ) {
	wp_interactivity_state( 'jetpack-search', array( 'staticPostTypes' => $scope ) );
}

// Load the WordPress.com Tracks consumer (drains `window._tkq`) so the
// TrainTracks render/interact events the store pushes actually get sent.
// Enqueuing here loads it exactly on pages where the Search blocks render,
// across all blocks experiences. Skipped when tracking is suppressed.
if ( ! Search_Blocks::is_tracking_disabled() ) {
	Helper::enqueue_tracks_script();
}

$panel_content = $content; // @phan-suppress-current-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.

if ( Search_Blocks::is_free_plan() && false === strpos( $panel_content, 'wp-block-jetpack-search-powered-by' ) ) {
	$panel_content .= render_block(
		array(
			'blockName' => 'jetpack-search/powered-by',
			'attrs'     => array(),
		)
	);
}
?>
<div <?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-search-results' ) ) ); ?>>
	<?php
	echo $panel_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer; auto-injected powered-by output is rendered through render_block() and escaped by its own renderer.
	?>
</div>
