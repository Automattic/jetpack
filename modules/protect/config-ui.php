<?php if ( ! $this->api_key ) : // no api key, provide a button to get one ?>

	<div class="protect-status attn">
		<?php if( ! empty( $this->api_key_error ) ) : ?>
			<p class="error"><?php echo $this->api_key_error; ?></p>
		<?php endif; ?>

		<form method="post">
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='get_protect_key' />
			<p class="submit">
				<?php _e( 'An API key is needed for Jetpack Protect.', 'jetpack' ); ?>
				<br /><br /><input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Get an API Key', 'jetpack' ) ); ?>' />
			</p>
		</form>
	</div>

<?php else : // api key is good, show white list options ?>

	<div class="protect-status working">
		<p>
			<?php _e( 'Protect is set-up and running!', 'jetpack' ); ?>
			<br /><strong>API Key: <?php echo $this->api_key; ?></strong>
		</p>
	</div>

	<div id="beta-testing-tools">
		<?php //TODO: REMOVE BETA TESTING TOOLS ?>
		Debug tools ( beta testing only ) :
		<form method="post" style="display: inline;">
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='remove_protect_key' />
			<input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Remove API Key', 'jetpack' ) ); ?>' />
		</form>

		<form method="post" style="display: inline;">
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='add_whitelist_placeholder_data' />
			<input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Add Whitelist Placeholder Data', 'jetpack' ) ); ?>' />
		</form>

	</div>

	<?php
	global $current_user;
	$whitelist = jetpack_protect_format_whitelist( $this->whitelist );
	?>

		<?php if ( ! empty( $whitelist['global'] ) || ! empty( $whitelist['other_user'] ) ) : // maybe show user's non-editable whitelists ?>

			<table id="non-editable-whitelist" class="whitelist-table" cellpadding="0" cellspacing="0">
				<tr>
					<td colspan="2">
						<p>
						<?php
							$url = 'https://wordpress.com/settings/security/' . Jetpack::get_option( 'id', false );
							$manage_link = sprintf( __( 'Here you can see global IP addresses that apply to all your Jetpack-powered sites, and IP addresses added by other users on this site. You can <a href="%s" target="_blank">manage your global whitelist here.</a>', 'jetpack' ), esc_url( $url ) );
							echo $manage_link;
						?>
						</p>
					</td>
				</tr>
				<tbody>
				<?php if ( ! empty( $whitelist['global'] ) ) : // show global whitelist ( only editable via wordpress.com ) ?>
					<tr>
						<th class="heading">
							<?php _e( 'IP addresses on your global whitelist', 'jetpack'); ?>
						</th>
					</tr>

					<?php foreach( $whitelist['global'] as $item ) : ?>
						<tr>
							<td>
								<?php echo $item; ?>
							</td>
						</tr>
					<?php endforeach; ?>
				<?php endif; // end global whitelist ?>

				<?php if( ! empty( $whitelist['other_user'] ) ) : ?>
					<tr>
						<th class="heading">
							<?php _e( 'IP addresses added by other users', 'jetpack' ); ?>
						</th>
					</tr>
					<?php foreach( $whitelist['other_user'] as $item ) : ?>
						<tr>
							<td>
								<?php echo $item; ?>
							</td>
						</tr>
					<?php endforeach; ?>
				<?php endif; // end other user whitelist ?>
				</tbody>
			</table>

		<?php endif; ?>
	<div class="protect-whitelist">
		<form id="editable-whitelist" method="post">
			<h3><?php _e( 'Whitelist Management', 'jetpack' ); ?></h3>

			<?php if( ! empty( $this->whitelist_error ) ) : ?>
				<p class="error"><?php  _e('One of your IP addresses was not valid.', 'jetpack'); ?></p>
			<?php endif; ?>

			<?php if( $this->whitelist_saved === true ) : ?>
				<p class="success"><?php  _e('Whitelist saved.', 'jetpack'); ?></p>
			<?php endif; ?>

			<p>
				<?php _e( 'Whitelisting an IP address prevents it from ever being blocked by Jetpack.', 'jetpack' ); ?><br />
				<strong><?php printf( __( 'Your current IP: %s', 'jetpack' ), $this->user_ip ); ?></strong>
			</p>
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='jetpack_protect_save_whitelist' />
			<textarea name="whitelist"><?php echo implode( PHP_EOL, $whitelist['local'] ); ?></textarea>
			<p>
				<em><?php _e('IPv4 and IPv6 are acceptable. <br />To specify a range, enter the low value and high value separated by a dash. Example: 12.12.12.1-12.12.12.100', 'jetpack' ); ?></em>
			</p>
			<p>
				<input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Save', 'jetpack' ) ); ?>' />
			</p>
		</form>

	</div>

<?php endif; ?>
