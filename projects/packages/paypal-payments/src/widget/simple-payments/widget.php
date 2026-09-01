<?php
/**
 * Display the Pay with PayPal Widget.
 *
 * @html-template Automattic\Jetpack\Paypal_Payments\Widgets\Simple_Payments_Widget::widget
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- HTML template, let Phan handle it.

?>
<div class='jetpack-simple-payments-wrapper'>
	<div class='jetpack-simple-payments-product'>
		<div class='jetpack-simple-payments-product-image'
		<?php
		if ( empty( $instance['form_product_image_id'] ) ) {
			echo 'style="display:none;"';
		}
		?>
		>
			<div class='jetpack-simple-payments-image'>
				<?php echo wp_get_attachment_image( (int) $instance['form_product_image_id'], 'full' ); ?>
			</div>
		</div>
		<div class='jetpack-simple-payments-details'>
			<div class='jetpack-simple-payments-title'><p><?php echo esc_html( $instance['form_product_title'] ); ?></p></div>
			<div class='jetpack-simple-payments-description'><p><?php echo esc_html( $instance['form_product_description'] ); ?></p></div>
			<div class='jetpack-simple-payments-price'><p><?php echo esc_html( $instance['form_product_price'] ); ?> <?php echo esc_html( $instance['form_product_currency'] ); ?></p></div>
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
