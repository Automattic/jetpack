<?php
/**
 * Display the Simple Payments Form.
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
		class="widefat jetpack-simple-payments-widget-title"
		id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
		value="<?php echo esc_attr( $instance['title'] ); ?>" />
</p>
<p class="jetpack-simple-payments-products-fieldset" <?php if ( empty( $product_posts ) ) { echo 'style="display:none;"'; } ?>>
	<label for="<?php echo esc_attr( $this->get_field_id( 'product_post_id' ) ); ?>">
		<?php esc_html_e( 'Select a Simple Payments Button:', 'jetpack' ); ?>
	</label>
	<select
		class="widefat jetpack-simple-payments-products"
		id="<?php echo esc_attr( $this->get_field_id( 'product_post_id' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'product_post_id' ) ); ?>">
		<?php foreach ( $product_posts as $product ) { ?>
			<option value="<?php echo esc_attr( $product['id'] ); ?>" <?php selected( (int) $instance['product_post_id'], $product['id'] ); ?>>
				<?php printf( '%s %s - %s', $product['currency'], $product['price'], $product['title'] ); ?>
			</option>
		<?php } ?>
	</select>
	<label for="<?php echo esc_attr( $this->get_field_id( 'text' ) ); ?>">
		<?php esc_html_e( 'Button Text', 'jetpack' ); ?>
	</label>
	<input
		type="text"
		class="widefat jetpack-simple-payments-widget-title"
		id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
		value="<?php echo esc_attr( $instance['title'] ); ?>" />
</p>
<p class="jetpack-simple-payments-products-warning" <?php if ( ! empty( $product_posts ) ) { echo 'style="display:none;"'; } ?>>
	<?php esc_html_e( "Looks like you don't have any products. You can create one using the Add New button below.", 'jetpack' ); ?>
</p>

