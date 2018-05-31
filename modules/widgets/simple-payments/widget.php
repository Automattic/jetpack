<p>widget template</p>
<div class='jetpack-simple-payments-wrapper'>
	<div class='jetpack-simple-payments-product'>
		<div class='jetpack-simple-payments-product-image'>
			<?php

$image_id = has_post_thumbnail( $instance['form_product_id'] ) ? get_post_thumbnail_id( $instance['form_product_id'] ) : $instance['form_product_image_id'];
?>
			<div class='jetpack-simple-payments-image'>
				<?php echo wp_get_attachment_image( $image_id, 'full' ) ?>
			</div>
		</div>
		<div class='jetpack-simple-payments-details'>
			<div class='jetpack-simple-payments-title'><p><?php esc_attr_e( $instance['form_product_title'] ); ?></p></div>
			<div class='jetpack-simple-payments-description'><p><?php  esc_html_e( $instance['form_product_description'] ); ?></p></div>
			<div class='jetpack-simple-payments-price'><p><?php esc_attr_e( $instance['form_product_price'] ); ?> <?php esc_attr_e( $instance['form_product_currency'] ); ?></p></div>
			<div class='jetpack-simple-payments-purchase-box'>
				<?php if ( $instance['form_product_multiple'] ) { ?>
					<div class='jetpack-simple-payments-items'>
						<input
							type='number'
							class='jetpack-simple-payments-items-number'
							value='1'
							min='1' />
					</div>
				<?php } ?>
			</div>
		</div>
	</div>
</div>
