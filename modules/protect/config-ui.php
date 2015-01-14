<?php if ( ! $this->api_key ) : // no api key, provide a button to get one ?>

	<div class="wide protect-status">
		<?php if( ! empty( $this->api_key_error ) ) : ?>
			<p class="error"><?php echo $this->api_key_error; ?></p>
		<?php endif; ?>

		<form method="post">
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='get_protect_key' />
			<p class="submit">
				<?php _e( 'An API key is needed for Jetpack Protect', 'jetpack' ); ?>
				<input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Get an API Key', 'jetpack' ) ); ?>' />
			</p>
		</form>
	</div>

<?php else : // api key is good, show white list options ?>

	<div class="wide protect-status">
		<form method="post">
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='remove_protect_key' />
			<p class="submit">
				<?php _e( 'Protect is set-up and running!', 'jetpack' ); ?>
				API Key: <?php echo $this->api_key; ?>
				<input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Remove Key', 'jetpack' ) ); ?>' />
			</p>
		</form>
	</div>

	<?php
		global $current_user;
		$current_user_whitelist = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID, 'global'=>false ) );
		$current_user_global_whitelist = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID, 'global'=> true) );
		$other_user_whtielist = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID ), 'NOT' );
	?>

	<div class="protect-whitelist">

		<h3><?php _e('Whitelist Management', 'jetpack' ); ?></h3>

		<?php if( ! empty( $current_user_global_whitelist ) || ! empty( $other_user_whtielist ) ) : // maybe show user's non-editable whitelists ?>

			<ul id="non-editable-whitelist" class="whitelist-ul">
				<?php if( ! empty( $current_user_global_whitelist ) ) : // show global whitelist ( only editable via wordpress.com ) ?>
					<li class="heading">
						<?php _e( 'IP Addresses on your global whitelist', 'jetpack'); ?>
					</li>
					<?php foreach( $current_user_global_whitelist as $item ) : ?>
						<li>
							<?php if( $item->range ) : ?>
								<?php echo $item->range_low; ?> - <?php echo $item->range_high; ?>
							<?php else: ?>
								<?php echo $item->ip_address; ?>
							<?php endif; ?>
						</li>
					<?php endforeach; ?>
				<?php endif; // end global whitelist ?>

				<?php if( ! empty( $other_user_whtielist ) ) : ?>
					<li class="heading">
						<?php _e( 'IP Addresses added by other users', 'jetpack' ); ?>
					</li>
					<?php foreach( $other_user_whtielist as $item ) : ?>
						<li>
							<?php if( $item->range ) : ?>
								Range: <?php echo $item->range_low; ?> - <?php echo $item->range_high; ?>
							<?php else: ?>
								<?php echo $item->ip_address; ?>
							<?php endif; ?>
						</li>
					<?php endforeach; ?>
				<?php endif; // end other user whitelist ?>
			</ul>

		<?php endif; ?>

		<form id="editable-whitelist" method="post">
			<ul class="whitelist-ul">
				<li class="heading">
					<input class="button-primary" type="button" value="<?php esc_attr( _e( 'Add IP Address', 'jetpack' ) ); ?>" />
					<input class="button-primary" type="button" value="<?php esc_attr( _e( 'Add IP Address Range', 'jetpack' ) ); ?>" />
				</li>
				<?php if( ! empty( $current_user_whitelist ) ): // prepopulate ?>
					<?php foreach( $current_user_whitelist as $item ): ?>
						<?php if( $item->range ) : ?>
							<li>
								Range: <?php echo $item->range_low; ?> - <?php echo $item->range_high; ?>
							</li>
						<?php else: ?>
							<li>
								<?php echo $item->ip_address; ?>
							</li>
						<?php endif; ?>
					<?php endforeach; ?>
				<?php endif; ?>
			</ul>
			<input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Save', 'jetpack' ) ); ?>' />
		</form>

	</div>

<?php endif; ?>