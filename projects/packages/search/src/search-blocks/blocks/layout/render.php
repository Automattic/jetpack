<?php
/**
 * Search Layout block render.
 *
 * Group-like wrapper that frames the whole embedded Search experience: emits
 * `$content` (the serialized inner block markup) inside the configured tag,
 * with the block-wrapper attrs derived from the spacing / border / dimensions
 * / layout supports. Adds an optional author Width control on top of those.
 *
 * @package automattic/jetpack-search
 *
 * @phan-file-suppress PhanUndeclaredGlobalVariable -- WP supplies $attributes and $content at block render.
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// The search templates set tagName to `main` so the search page gets its
// landmark. Inserted anywhere else the block defaults to a plain `div`, so it
// can't introduce a second `<main>` landmark inside the theme's own. Allowlist
// the saved value against the same tags core/group offers.
$allowed_tags = array( 'div', 'main', 'header', 'footer', 'section', 'article', 'aside' );
$raw_tag      = (string) ( $attributes['tagName'] ?? 'div' );
$tag_name     = in_array( $raw_tag, $allowed_tags, true ) ? $raw_tag : 'div';

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

printf(
	'<%1$s %2$s>',
	esc_html( $tag_name ),
	wp_kses_data( get_block_wrapper_attributes( $wrapper_extra_attrs ) )
);
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
echo $content;
echo '</' . esc_html( $tag_name ) . '>';
