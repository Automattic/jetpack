<?php
/**
 * Display the Recurring Payments widget Form.
 *
 * @package Jetpack
 */

?>
<p>
	<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
		<?php esc_html_e( 'Widget Title', 'jetpack' ); ?>
	</label>
	<input
		type="text"
		class="widefat jetpack-recurring-payments-widget-title"
		id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
		value="<?php echo esc_attr( isset( $instance['title'] ) ? $instance['title'] : '' ); ?>" />
</p>
<p class="jetpack-recurring-payments-products-fieldset" <?php if ( empty( $product_posts ) ) { echo 'style="display:none;"'; } ?>>
	<label for="<?php echo esc_attr( $this->get_field_id( 'product_post_id' ) ); ?>">
		<?php esc_html_e( 'Select previously created Recurring Payments plan:', 'jetpack' ); ?>
	</label>
	<select
		class="widefat jetpack-recurring-payments-products"
		id="<?php echo esc_attr( $this->get_field_id( 'product_post_id' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'product_post_id' ) ); ?>">
		<?php foreach ( $product_posts as $product ) { ?>
			<option value="<?php echo esc_attr( $product['id'] ); ?>" <?php selected( (int) $instance['product_post_id'], $product['id'] ); ?>>
				<?php printf( '%s %s - %s', $product['currency'], $product['price'], $product['title'] ); ?>
			</option>
		<?php } ?>
	</select>
	<label for="<?php echo esc_attr( $this->get_field_id( 'text' ) ); ?>">
		<?php esc_html_e( 'Choose a text to display on your button:', 'jetpack' ); ?>
	</label>
	<input
		type="text"
		class="widefat jetpack-recurring-payments-widget-title"
		id="<?php echo esc_attr( $this->get_field_id( 'text' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'text' ) ); ?>"
		value="<?php echo esc_attr( $instance['text'] ); ?>" />
</p>
<p class="jetpack-recurring-payments-products-warning">
	<?php echo wp_kses( sprintf(
			__( '<a %s>You can configure Recurring Payments, manage and create new plans on WordPress.com</a>', 'jetpack' ),
			"target='_blank' rel='noopener noreferer' href='https://wordpress.com/earn/payments/$blog_id'"
	), array( 'a' => array( 'href' => array(), 'target' => array() , 'rel' => array() ) ) ); ?>
</p>

