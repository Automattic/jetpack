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
