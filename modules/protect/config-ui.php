<div class="narrow">
	<?php if ( ! $this->api_key ) : ?>

		<?php if( ! empty( $this->api_key_error ) ) : ?>
			<p class="error"><?php echo $this->api_key_error; ?></p>
		<?php endif; ?>

		<p><?php _e( 'An API key is needed for Jetpack Protect', 'jetpack' ); ?></p>
		<form method="post">
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='get_protect_key' />
			<p class="submit"><input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Get an API Key', 'jetpack' ) ); ?>' /></p>
		</form>

	<?php else : ?>

		<p><?php _e( 'Protect is set-up and running!', 'jetpack' ); ?></p>
		<p>Key: <?php echo $this->api_key; ?></p>
		<form method="post">
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='remove_protect_key' />
			<p class="submit"><input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Remove Key', 'jetpack' ) ); ?>' /></p>
		</form>

	<?php endif; ?>
</div>