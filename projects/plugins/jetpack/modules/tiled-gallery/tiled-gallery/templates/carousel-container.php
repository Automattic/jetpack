<?php
/**
 * Encode extra carousel container data.
 *
 * @html-template Jetpack_Tiled_Gallery_Layout::template
 * @package jetpack
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- HTML template, let Phan handle it.

// Using JSON_HEX_AMP avoids breakage due to `esc_attr()` refusing to double-encode.
$extra = wp_json_encode( $this->get_container_extra_data(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
?>
<div
	class="tiled-gallery type-<?php echo esc_html( $this->type ); ?> tiled-gallery-unresized"
	data-original-width="<?php echo esc_attr( Jetpack_Tiled_Gallery::get_content_width() ); ?>"
	<?php if ( isset( $extra ) ) : ?>
data-carousel-extra='<?php echo esc_attr( $extra ); ?>'
	<?php endif; ?>
	itemscope itemtype="http://schema.org/ImageGallery"
	>
	<?php $this->template( "$this->type-layout", $context ); ?>
</div>
