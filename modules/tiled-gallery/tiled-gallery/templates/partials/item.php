<?php
$add_link = 'none' !== $this->link; ?>
<div class="tiled-gallery-item<?php if ( isset( $item->size ) ) echo " tiled-gallery-item-$item->size"; ?>">
	<?php if ( $add_link ): ?>
	<a href="<?php echo $item->link; ?>" border="0">
	<?php endif; ?>
		<img
			<?php $this->partial( 'carousel-image-args', array( 'item' => $item ) ); ?>
			src="<?php echo esc_url( $item->img_src ); ?>"
			width="<?php echo esc_attr( $item->image->width ); ?>"
			height="<?php echo esc_attr( $item->image->height ); ?>"
			data-original-width="<?php echo esc_attr( $item->image->width ); ?>"
			data-original-height="<?php echo esc_attr( $item->image->height ); ?>"
			title="<?php echo esc_attr( $item->image_title ); ?>"
			alt="<?php echo esc_attr( $item->image_alt ); ?>"
			style="width: <?php echo esc_attr( $item->image->width ); ?>px; height: <?php echo esc_attr( $item->image->height ); ?>px;"
		/>
	<?php if ( $add_link ): ?>
	</a>
	<?php endif; ?>

	<?php if ( $this->grayscale == true ): ?>
		<?php if ( $add_link ): ?>
		<a href="<?php echo $item->link; ?>" border="0">
		<?php endif; ?>
			<img
				class="grayscale"
				src="<?php echo esc_url( $item->img_src_grayscale ); ?>"
				width="<?php echo esc_attr( $item->image->width ); ?>"
				height="<?php echo esc_attr( $item->image->height ); ?>"
				data-original-width="<?php echo esc_attr( $item->image->width ); ?>"
				data-original-height="<?php echo esc_attr( $item->image->height ); ?>"
				title="<?php echo esc_attr( $item->image_title ); ?>"
				align="left"
				alt="<?php echo esc_attr( $item->image_alt ); ?>"
				style="width: <?php echo esc_attr( $item->image->width ); ?>px; height: <?php echo esc_attr( $item->image->height ); ?>px;"
			/>
		<?php if ( $add_link ): ?>
		</a>
		<?php endif; ?>
	<?php endif; ?>

	<?php if ( trim( $item->image->post_excerpt ) ): ?>
		<div class="tiled-gallery-caption">
			<?php echo wptexturize( $item->image->post_excerpt ); ?>
		</div>
	<?php endif; ?>
</div>

