<?php
/**
 * No Results Variant block render.
 *
 * One empty-state condition inside a `jetpack-search/no-results` container.
 * The author fills it with any blocks; this renderer emits them behind the
 * store getter for the condition, and falls back to the localized default copy
 * while the variant is still empty.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$condition = No_Results::normalize_condition( ( (array) $attributes )['condition'] ?? '' );

No_Results::seed_coverage( $condition );

// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
$authored_content = trim( $content );
$is_default       = '' === $authored_content;
$wrapper_class    = 'jetpack-search-no-results__variant';
if ( $is_default ) {
	$wrapper_class .= ' jetpack-search-no-results--default';
}
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => $wrapper_class ) ) ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!<?php echo esc_attr( No_Results::visibility_getter( $condition ) ); ?>"
	<?php echo wp_kses_data( No_Results::live_region_attribute( $condition ) ); ?>
	hidden
>
	<?php
	if ( $is_default ) {
		No_Results::render_default_copy( $condition );
	} else {
		// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
		echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	}
	?>
</div>
