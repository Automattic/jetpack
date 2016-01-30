<?php
if ( defined( 'JSON_HEX_AMP' ) ) {
	// see shortcodes/slideshow.php
	// This is nice to have, but not strictly necessary since we use _wp_specialchars() below
	$extra = json_encode( $this->get_container_extra_data(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
} else {
	$extra = json_encode( $this->get_container_extra_data() );
}
?>
<div
	class="tiled-gallery type-<?php echo $this->type; ?> tiled-gallery-unresized"
	data-original-width="<?php echo esc_attr( Jetpack_Tiled_Gallery::get_content_width() ); ?>"
	<?php if ( isset( $extra ) ): ?>
		data-carousel-extra='<?php echo _wp_specialchars( wp_check_invalid_utf8( $extra ), ENT_QUOTES, false, true ); ?>'
	<?php endif; ?>
	itemscope itemtype="http://schema.org/ImageGallery"
	>
	<?php $this->template( "$this->type-layout", $context ); ?>
</div>
