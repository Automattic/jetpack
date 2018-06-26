<p>
	<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Widget Title', 'jetpack' ); ?></label>
	<input
		type="text"
		class="widefat jetpack-simple-payments-widget-title"
		id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
		value="<?php echo esc_attr( $instance['title'] ); ?>" />
</p>
<p class="jetpack-simple-payments-products-fieldset" <?php if ( empty( $product_posts ) ) { echo 'style="display:none;"'; } ?>>
	<label for="<?php echo $this->get_field_id('product_post_id'); ?>"><?php _e( 'Select a Simple Payment Button:', 'jetpack' ); ?></label>
	<select
		class="widefat jetpack-simple-payments-products"
		id="<?php echo $this->get_field_id('product_post_id'); ?>"
		name="<?php echo $this->get_field_name('product_post_id'); ?>">
		<?php foreach ( $product_posts as $product_post ) { ?>
			<option value="<?php echo esc_attr( $product_post->ID ) ?>" <?php selected( (int) $instance['product_post_id'], $product_post->ID ); ?>>
				<?php echo esc_attr( get_the_title( $product_post ) ) ?>
			</option>
		<?php } ?>
	</select>
</p>
<?php if ( is_customize_preview() ) { ?>
<p class="jetpack-simple-payments-products-warning" <?php if ( ! empty( $product_posts ) ) { echo 'style="display:none;"'; } ?>>
	<?php echo __( 'Looks like you don\'t have any products. You can create one using the Add New button below.' ) ?>
</p>
<p>
	<div class="alignleft">
		<button class="button jetpack-simple-payments-edit-product" <?php disabled( empty( $product_posts ), true ); ?>>
			<?php esc_html_e( 'Edit Selected' ); ?>
		</button>
	</div>
	<div class="alignright">
		<button class="button jetpack-simple-payments-add-product"><?php esc_html_e( 'Add New' ); ?></button>
	</div>
	<br class="clear">
</p>
<hr />
<div class="jetpack-simple-payments-form" style="display: none;">
	<input
		type="hidden"
		id="<?php echo $this->get_field_id('form_action'); ?>"
		name="<?php echo $this->get_field_name('form_action'); ?>"
		value="<?php echo esc_attr( $instance['form_action'] ); ?>"
		class="jetpack-simple-payments-form-action" />
	<input
		type="hidden"
		id="<?php echo $this->get_field_id('form_product_id'); ?>"
		name="<?php echo $this->get_field_name('form_product_id'); ?>"
		value="<?php echo esc_attr( $instance['form_product_id'] ); ?>"
		class="jetpack-simple-payments-form-product-id" />
	<input
		type="hidden"
		id="<?php echo esc_attr( $this->get_field_id( 'form_product_image_id' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'form_product_image_id' ) ); ?>"
		value="<?php echo esc_attr( $instance['form_product_image_id'] ); ?>"
		class="jetpack-simple-payments-form-image-id" />
	<input
		type="hidden"
		id="<?php echo esc_attr( $this->get_field_id( 'form_product_image_src' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'form_product_image_src' ) ); ?>"
		value="<?php echo esc_attr( $instance['form_product_image_src'] ); ?>"
		class="jetpack-simple-payments-form-image-src" />
	<p>
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_title' ) ); ?>"><?php esc_html_e( 'What is this payment for?' ); ?></label>
		<input
			type="text"
			class="widefat field-title jetpack-simple-payments-form-product-title"
			id="<?php echo esc_attr( $this->get_field_id( 'form_product_title' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'form_product_title' ) ); ?>"
			value="<?php echo esc_attr( $instance['form_product_title'] ); ?>" />
		<br />
		<small><?php _e( 'For example: event tickets, charitable donations, training courses, coaching fees, etc.' ); ?></small>
	</p>
	<div class="jetpack-simple-payments-image-fieldset">
		<label><?php esc_html_e( 'Product image' ); ?></label>
		<div class="placeholder" <?php if ( ! empty( $instance['form_product_image_id'] ) ) echo 'style="display:none;"'; ?>><?php esc_html_e( 'Select an image' ); ?></div>
		<div class="jetpack-simple-payments-image" <?php if ( empty( $instance['form_product_image_id'] ) ) echo 'style="display:none;"'; ?>>
			<img src="<?php echo esc_url( $instance['form_product_image_src'] ); ?>" />
			<button class="button jetpack-simple-payments-remove-image"><?php esc_html_e( 'Remove image' ); ?></button>
		</div>
	</div>
	<p>
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_description' ) ); ?>"><?php esc_html_e( 'Description' ); ?></label>
		<textarea
			class="field-description widefat jetpack-simple-payments-form-product-description"
			rows=5
			id="<?php echo esc_attr( $this->get_field_id( 'form_product_description' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'form_product_description' ) ); ?>"><?php  esc_html_e( $instance['form_product_description'] ); ?></textarea>
	</p>
	<p class="cost">
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_price' ) ); ?>"><?php esc_html_e( 'Price' ); ?></label>
		<select
			class="field-currency widefat jetpack-simple-payments-form-product-currency"
			id="<?php echo esc_attr( $this->get_field_id( 'form_product_currency' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'form_product_currency' ) ); ?>">
			<?php foreach( Jetpack_Simple_Payments_Widget::$supported_currency_list as $code => $currency ) {?>
				<option value="<?php echo esc_attr( $code ) ?>"<?php selected( $instance['form_product_currency'], $code ); ?>>
					<?php esc_html_e( $code . ' ' . $currency ) ?>
				</option>
			<?php } ?>
		</select>
		<input
			type="text"
			class="field-price widefat jetpack-simple-payments-form-product-price"
			id="<?php echo esc_attr( $this->get_field_id( 'form_product_price' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'form_product_price' ) ); ?>"
			value="<?php echo esc_attr( $instance['form_product_price'] ); ?>"
			placeholder="1.00" />
	</p>
	<p>
		<input
			class="field-multiple jetpack-simple-payments-form-product-multiple"
			id="<?php echo esc_attr( $this->get_field_id( 'form_product_multiple' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'form_product_multiple' ) ); ?>"
			type="checkbox"
			value="1"
			<?php checked( $instance['form_product_multiple'], '1' ); ?> />
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_multiple' ) ); ?>"><?php esc_html_e( 'Allow people to buy more than one item at a time.' ); ?></label>
	</p>
	<p>
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_email' ) ); ?>"><?php esc_html_e( 'Email' ); ?></label>
		<input
			class="field-email widefat jetpack-simple-payments-form-product-email"
			id="<?php echo esc_attr( $this->get_field_id( 'form_product_email' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'form_product_email' ) ); ?>"
			type="email"
			value="<?php  echo esc_attr( $instance['form_product_email'] ); ?>" />
		<small><?php printf( esc_html__( 'This is where PayPal will send your money. To claim a payment, you\'ll need a %1$sPayPal account%2$s connected to a bank account.' ), '<a href="https://paypal.com" target="_blank">', '</a>' ) ?></small>
	</p>
	<p>
		<div class="alignleft">
			<button type="button" class="button-link button-link-delete jetpack-simple-payments-delete-product"><?php _e( 'Delete Product' ); ?></button>
		</div>
		<div class="alignright">
			<button name="<?php echo $this->get_field_name('save'); ?>" class="button jetpack-simple-payments-save-product"><?php _e( 'Save' ); ?></button>
			<span> | <button type="button" class="button-link jetpack-simple-payments-cancel-form"><?php _e( 'Cancel' ); ?></button></span>
		</div>
		<br class="clear">
	</p>
	<hr />
</div>
<?php } else { ?>
<p class="jetpack-simple-payments-products-warning">
	<?php
		echo sprintf(
			wp_kses(
				__( 'This widget adds a payment button of your choice to your sidebar. To create or edit the payment buttons themselves, <a href="%s">use the Customizer</a>.' ),
				array(  'a' => array( 'href' => array() ) )
			),
			esc_url( add_query_arg( array( 'autofocus[panel]' => 'widgets' ), admin_url( 'customize.php' ) ) )
		);
	?>
</p>
<?php } ?>
