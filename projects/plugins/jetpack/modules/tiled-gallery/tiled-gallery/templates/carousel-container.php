<?php
/**
 * Encode extra carousel container data.
 *
 * @package jetpack
 */

if ( defined( 'JSON_HEX_AMP' ) ) {
	// see shortcodes/slideshow.php
	// This is nice to have, but not strictly necessary since we use _wp_specialchars() below
	// phpcs:ignore PHPCompatibility
	$extra = wp_json_encode( $this->get_container_extra_data(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
} else {
	$extra = wp_json_encode( $this->get_container_extra_data() ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
}
// phpcs:disable
?>
<div
	class="tiled-gallery type-<?php echo $this->type; ?> tiled-gallery-unresized"
	data-original-width="<?php echo esc_attr( Jetpack_Tiled_Gallery::get_content_width() ); ?>"
	<?php if ( isset( $extra ) ) : ?>
		data-carousel-extra='<?php echo esc_attr( _wp_specialchars( wp_check_invalid_utf8( $extra ), ENT_QUOTES, false, true ) ); ?>'
	<?php endif; ?>
	itemscope itemtype="http://schema.org/ImageGallery"
	>
	<?php $this->template( "$this->type-layout", $context ); ?>
</div>
