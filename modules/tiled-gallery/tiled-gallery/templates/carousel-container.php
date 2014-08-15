<?php $extra = $this->get_container_extra_data(); ?>
<div
	class="tiled-gallery type-<?php echo $this->type; ?> tiled-gallery-unresized"
	data-original-width="<?php echo esc_attr( Jetpack_Tiled_Gallery::get_content_width() ); ?>"
	<?php if ( isset( $extra ) ): ?>
	data-carousel-extra='<?php echo json_encode( $extra ); ?>'
	<?php endif; ?>
>
	<?php $this->template( "$this->type-layout", $context ); ?>
</div>
