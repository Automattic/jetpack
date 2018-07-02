<div class="jetpack-simple-payments-widget-container">
	<p>
		<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
			<?php esc_html_e( 'Title:', 'jetpack' ); ?>
		</label>
		<input
			class="widefat jetpack-simple-payments-widget-title"
			id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
			name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
			type="text"
			value="<?php echo esc_attr( $instance['title'] ); ?>"
		/>
	</p>

	<p
		class="jetpack-simple-payments-widget-products-fieldset"
		<?php if ( empty( $product_posts ) ) { echo 'style="display: none;"'; } ?>
	>
		<label for="<?php echo $this->get_field_id('product_post_id'); ?>">
			<?php esc_html_e( 'Select a Simple Payment Button:', 'jetpack' ); ?>
		</label>
		<select
			class="widefat jetpack-simple-payments-products"
			id="<?php echo $this->get_field_id('product_post_id'); ?>"
			name="<?php echo $this->get_field_name('product_post_id'); ?>"
		>
			<?php foreach ( $product_posts as $product_post ) { ?>
				<option
					value="<?php echo esc_attr( $product_post->ID ) ?>"
					<?php selected( (int) $instance['product_post_id'], $product_post->ID ); ?>
				>
					<?php echo esc_attr( get_the_title( $product_post ) ); ?>
				</option>
			<?php } ?>
		</select>
	</p>

	<p
		class="jetpack-simple-payments-products-warning"
		<?php if ( ! empty( $product_posts ) ) { echo 'style="display: none;"'; } ?>
	>
		<?php esc_html_e( 'Looks like you don\'t have any products. You can create one using the Add New button below.', 'jetpack' ) ?>
	</p>

	<p>
		<div class="alignleft">
			<button
				class="button jetpack-simple-payments-edit-product"
				<?php disabled( empty( $product_posts ), true ); ?>
			>
				<?php esc_html_e( 'Edit Selected', 'jetpack' ); ?>
			</button>
		</div>
		<div class="alignright">
			<button class="button jetpack-simple-payments-add-product">
				<?php esc_html_e( 'Add New', 'jetpack' ); ?>
			</button>
		</div>
		<br class="clear" />
	</p>

	<hr />

	<div  class="jetpack-simple-payments-form" style="display: none;">
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_title' ) ); ?>">
				<?php esc_html_e( 'What is this payment for?', 'jetpack' ); ?>
			</label>
			<input
				class="widefat jetpack-simple-payments-form-product-title"
				id="<?php echo esc_attr( $this->get_field_id( 'form_product_title' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'form_product_title' ) ); ?>"
				type="text"
				value="<?php echo esc_attr( $instance['form_product_title'] ); ?>"
			/>
			<small>
				<?php esc_html_e( 'For example: event tickets, charitable donations, training courses, coaching fees, etc.', 'jetpack' ); ?>
			</small>
		</p>

		<div class="jetpack-simple-payments-image-fieldset">
			<label>
				<?php esc_html_e( 'Product image:' ); ?>
			</label>
			<div
				class="jetpack-simple-payments-select-image placeholder"
				<?php if ( ! empty( $instance['form_product_image_id'] ) ) echo 'style="display: none;"'; ?>
			>
				<?php esc_html_e( 'Select an image' ); ?>
			</div>
			<div
				class="jetpack-simple-payments-image"
				<?php if ( empty( $instance['form_product_image_id'] ) ) echo 'style="display: none;"'; ?>
			>
				<img
					class="jetpack-simple-payments-select-image"
					src="<?php echo esc_url( $instance['form_product_image_src'] ); ?>"
				/>
				<button class="button jetpack-simple-payments-remove-image">
					<?php esc_html_e( 'Remove image' ); ?>
				</button>
			</div>
		</div>

		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_description' ) ); ?>">
				<?php esc_html_e( 'Description:', jetpack ); ?>
			</label>
			<textarea
				class="widefat jetpack-simple-payments-form-product-description"
				id="<?php echo esc_attr( $this->get_field_id( 'form_product_description' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'form_product_description' ) ); ?>"
				rows=5
			><?php echo esc_html( $instance['form_product_description'] ); ?></textarea>
		</p>

		<p class="cost">
			<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_price' ) ); ?>">
				<?php esc_html_e( 'Price:', 'jetpack' ); ?>
			</label>
			<select
				class="field-currency widefat jetpack-simple-payments-form-product-currency"
				id="<?php echo esc_attr( $this->get_field_id( 'form_product_currency' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'form_product_currency' ) ); ?>"
			>
				<?php foreach( Jetpack_Simple_Payments_Widget::$supported_currency_list as $code => $currency ) { ?>
					<option
						value="<?php echo esc_attr( $code ) ?>"
						<?php selected( $instance['form_product_currency'], $code ); ?>
					>
						<?php echo esc_html( $code . ' ' . $currency ); ?>
					</option>
				<?php } ?>
			</select>
			<input
				class="field-price widefat jetpack-simple-payments-form-product-price"
				id="<?php echo esc_attr( $this->get_field_id( 'form_product_price' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'form_product_price' ) ); ?>"
				placeholder="1.00"
				type="text"
				value="<?php echo esc_attr( $instance['form_product_price'] ); ?>"
			/>
		</p>

		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_multiple' ) ); ?>">
				<input
					class="jetpack-simple-payments-form-product-multiple"
					id="<?php echo esc_attr( $this->get_field_id( 'form_product_multiple' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'form_product_multiple' ) ); ?>"
					type="checkbox"
					value="1"
					<?php checked( $instance['form_product_multiple'], '1' ); ?>
				/>
				<?php esc_html_e( 'Allow people to buy more than one item at a time.', 'jetpack' ); ?>
			</label>
		</p>

		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_email' ) ); ?>">
				<?php esc_html_e( 'Email:', 'jetpack' ); ?>
		</label>
			<input
				class="field-email widefat jetpack-simple-payments-form-product-email"
				id="<?php echo esc_attr( $this->get_field_id( 'form_product_email' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'form_product_email' ) ); ?>"
				type="email"
				value="<?php  echo esc_attr( $instance['form_product_email'] ); ?>"
			/>
			<small>
				<?php printf( esc_html__(
					"This is where PayPal will send your money. To claim a payment, you'll need a %1$sPayPal account%2$s connected to a bank account." ),
					'<a href="https://paypal.com" target="_blank">',
					'</a>'
				) ?>
			</small>
		</p>

		<p>
			<div class="alignleft">
				<button
					class="button-link button-link-delete jetpack-simple-payments-delete-product"
					type="button"
				>
					<?php esc_html_e( 'Delete Product', 'jetpack' ); ?>
				</button>
			</div>
			<div class="alignright">
				<button
					class="button jetpack-simple-payments-save-product"
					name="<?php echo esc_attr( $this->get_field_name( 'save' ) ); ?>"
				>
					<?php esc_html_e( 'Save', 'jetpack' ); ?>
				</button>
				<span> | <button
					class="button-link jetpack-simple-payments-cancel-form"
					type="button"
				>
					<?php esc_html_e( 'Cancel', 'jetpack' ); ?>
				</button></span>
			</div>
			<br class="clear" />
		</p>
		<hr />
	</div>
</div>
