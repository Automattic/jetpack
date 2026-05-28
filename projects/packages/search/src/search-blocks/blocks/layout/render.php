<?php
/**
 * Search Layout block render.
 *
 * Group-like wrapper that frames the whole embedded Search experience: emits
 * `$content` (the serialized inner block markup) inside a `<main>`, with the
 * block-wrapper attrs derived from the spacing / border / dimensions / layout
 * supports. Adds an optional author Width control on top of those.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// `widthUnit` is allowlisted against the units the editor offers — block.json
// types it as a free-form string, so a REST write or a future migration can't
// smuggle an arbitrary unit into the inline style. A set (value, unit) pair
// caps the region with a centered max-width. Physical `margin-left/right:auto`
// (not the logical `margin-inline`, which `safecss_filter_attr` strips) — both
// sides auto centers in LTR and RTL alike.
$wrapper_extra_attrs = array();
$allowed_width_units = array( 'px', '%' );
$raw_width_unit      = (string) ( $attributes['widthUnit'] ?? '' );
$width_unit          = in_array( $raw_width_unit, $allowed_width_units, true ) ? $raw_width_unit : '';
$has_width           = isset( $attributes['width'] ) && '' !== $attributes['width'] && '' !== $width_unit;
if ( $has_width ) {
	$wrapper_extra_attrs['style'] = sprintf(
		'max-width:%d%s;margin-left:auto;margin-right:auto;',
		(int) $attributes['width'],
		$width_unit
	);
}
?>
<main <?php echo wp_kses_data( get_block_wrapper_attributes( $wrapper_extra_attrs ) ); ?>>
	<?php
	// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
	echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	?>
</main>
