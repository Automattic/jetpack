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
