<?php
/**
 * Common Filters block render.
 *
 * Group-like wrapper that emits `$content` (the serialized inner block
 * markup). Each inner filter handles its own state via the Interactivity API
 * store; this block contributes only the surrounding chrome (block-wrapper
 * attrs derived from color/spacing/border/typography supports).
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
?>
<div <?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-common-filters' ) ) ); ?>>
	<?php
	// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
	echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	?>
</div>
