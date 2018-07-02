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
					<?php echo esc_attr( get_the_title( $product_post ) ) ?>
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

	<div class="jetpack-simple-payments-widget-form" style="display: none;">
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'form_product_title' ) ); ?>">
				<?php esc_html_e( 'What is this payment for?', 'jetpack' ); ?>
			</label>
			<input
				class="widefat jetpack-simple-payments-widget-form-product-title"
				id="<?php echo esc_attr( $this->get_field_id( 'form_product_title' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'form_product_title' ) ); ?>"
				type="text"
				value="<?php echo esc_attr( $instance['form_product_title'] ); ?>"
			/>
			<small>
				<?php esc_html_e( 'For example: event tickets, charitable donations, training courses, coaching fees, etc.', 'jetpack' ); ?>
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
