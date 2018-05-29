<p>
	<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Widget Title', 'jetpack' ); ?></label>
	<input
		type="text"
		class="widefat"
		id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
		name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
		value="<?php echo esc_attr( $instance['title'] ); ?>" />
</p>
<?php if ( ! empty( $product_posts ) ) { ?>
<p>
	<label for="<?php echo $this->get_field_id('product_post_id'); ?>"><?php _e( 'Select a Simple Payment Button:', 'jetpack' ); ?></label>
	<select class="widefat" id="<?php echo $this->get_field_id('product_post_id'); ?>" name="<?php echo $this->get_field_name('product_post_id'); ?>">
		<?php foreach ( $product_posts as $product_post ) { ?>
			<option value="<?php echo esc_attr( $product_post->ID ) ?>"<?php selected( (int) $instance['product_post_id'], $product_post->ID ); ?>>
				<?php echo esc_attr( get_the_title( $product_post ) ) ?>
			</option>
		<?php } ?>
	</select>
</p>
<?php } ?>
<p>
	<div class="alignleft">
		<button class="button jetpack-simple-payments-edit-product"><?php esc_html_e( 'Edit' ); ?></button>
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
		class="jetpack-simple-payments-form-action" />
	<input
		type="hidden"
		id="<?php echo $this->get_field_id('form_product_id'); ?>"
		name="<?php echo $this->get_field_name('form_product_id'); ?>"
		class="jetpack-simple-payments-form-action" />
	<p>
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_title' ) ); ?>"><?php esc_html_e( 'What is this payment for?' ); ?></label>
		<input
			type="text"
			class="widefat field-title"
			id="<?php echo esc_attr( $this->get_field_id( 'form_product_title' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'form_product_title' ) ); ?>"
			value="<?php echo esc_attr( $instance['form_product_title'] ); ?>" />
		<br />
		<small><?php _e( 'For example: event tickets, charitable donations, training courses, coaching fees, etc.' ); ?></small>
	</p>
	<div class="simple-payments-image-fieldset">
		<label><?php esc_html_e( 'Product image' ); ?></label>
		<div class="placeholder" <?php if ( has_post_thumbnail( $instance['product_post_id'] ) ) echo 'style="display:none;"'; ?>><?php esc_html_e( 'Select an image' ); ?></div>
		<div class="simple-payments-image">
			<?php
			if ( has_post_thumbnail( $instance['product_post_id'] ) ) {
				$image_id = get_post_thumbnail_id( $instance['product_post_id'] );
				error_log(wp_get_attachment_image_url( $image_id, 'full' ));
			?>
				<img src="<?php echo esc_url( wp_get_attachment_image_url( $image_id, 'full' ) ); ?>" />
				<!--input
					type="hidden"
					id="<?php echo esc_attr( $this->get_field_id( 'form_product_image' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'form_product_image' ) ); ?>"
					value="<?php echo esc_attr( $image_id ); ?>" / -->
				<button class="button simple-payments-remove-image"><?php esc_html_e( 'Remove image' ); ?></button>
			<?php } ?>
		</div>
	</div>
	<p>
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_description' ) ); ?>"><?php esc_html_e( 'Description' ); ?></label>
		<textarea
			class="field-description widefat"
			rows=5
			id="<?php echo esc_attr( $this->get_field_id( 'form_product_description' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'form_product_description' ) ); ?>"><?php  esc_html_e( $instance['form_product_description'] ); ?></textarea>
	</p>
	<p class="cost">
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_price' ) ); ?>"><?php esc_html_e( 'Price' ); ?></label>
		<select class="field-currency widefat" id="<?php echo esc_attr( $this->get_field_id( 'form_product_currency' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'form_product_currency' ) ); ?>">
		<?php foreach( Jetpack_Simple_Payments_Widget::$currencie_symbols as $code => $currency ) {?>
				<option value="<?php echo esc_attr( $code ) ?>"<?php selected( $instance['form_product_currency'], $code ); ?>>
					<?php esc_html_e( $code . ' ' . $currency ) ?>
				</option>
			<?php } ?>
		</select>
		<input
			type="text"
			class="field-price widefat"
			id="<?php echo esc_attr( $this->get_field_id( 'form_product_price' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'form_product_price' ) ); ?>"
			value="<?php echo esc_attr( $instance['form_product_price'] ); ?>" />
	</p>
	<p>
		<input class="field-multiple" id="<?php echo esc_attr( $this->get_field_id( 'form_product_multiple' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'form_product_multiple' ) ); ?>" type="checkbox" value="1"<?php checked( $instance['form_product_multiple'], '1' ); ?>/>
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_multiple' ) ); ?>"><?php esc_html_e( 'Allow people to buy more than one item at a time.' ); ?></label>
	</p>
	<p>
		<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_email' ) ); ?>"><?php esc_html_e( 'Email' ); ?></label>
		<input class="field-email widefat" id="<?php echo esc_attr( $this->get_field_id( 'form_product_email' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'form_product_email' ) ); ?>" type="email" value="<?php  echo esc_attr( $instance['form_product_email'] ); ?>" />
		<small><?php printf( esc_html__( 'This is where PayPal will send your money. To claim a payment, you\'ll need a %1$sPayPal account%2$s connected to a bank account.' ), '<a href="https://paypal.com" target="_blank">', '</a>' ) ?></small>
	</p>
	<p>
		<div class="alignleft">
			<span><button type="button" class="button-link button-link-delete simple-payments-delete-product"><?php _e( 'Delete' ); ?></button> | </span>
			<button type="button" class="button-link simple-payments-cancel-form"><?php _e( 'Cancel' ); ?></button>
		</div>
		<div class="alignright">
			<button name="<?php echo $this->get_field_name('save'); ?>" class="button simple-payments-save-product"><?php _e( 'Save' ); ?></button>
		</div>
		<br class="clear">
	</p>
	<hr />
</div>
