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

			<table id="non-editable-whitelist" class="whitelist-table" cellpadding="0" cellspacing="0">
				<tbody>
					<?php if( ! empty( $current_user_global_whitelist ) ) : // show global whitelist ( only editable via wordpress.com ) ?>
						<tr>
							<th class="heading">
								<?php _e( 'IP Addresses on your global whitelist', 'jetpack'); ?>
							</th>
						</tr>

						<?php foreach( $current_user_global_whitelist as $item ) : ?>
							<tr>
								<td>
									<?php if( $item->range ) : ?>
										<?php echo $item->range_low; ?> &rarr; <?php echo $item->range_high; ?>
									<?php else: ?>
										<?php echo $item->ip_address; ?>
									<?php endif; ?>
								</td>
							</tr>
						<?php endforeach; ?>
					<?php endif; // end global whitelist ?>

					<?php if( ! empty( $other_user_whtielist ) ) : ?>
						<tr>
							<th class="heading">
								<?php _e( 'IP Addresses added by other users', 'jetpack' ); ?>
							</th>
						</tr>
						<?php foreach( $other_user_whtielist as $item ) : ?>
							<tr>
								<td>
									<?php if( $item->range ) : ?>
										Range: <?php echo $item->range_low; ?> &rarr; <?php echo $item->range_high; ?>
									<?php else: ?>
										<?php echo $item->ip_address; ?>
									<?php endif; ?>
								</td>
							</tr>
						<?php endforeach; ?>
					<?php endif; // end other user whitelist ?>
				</tbody>
			</table>

		<?php endif; ?>

		<form id="editable-whitelist" method="post">
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='save_protect_whitelist' />
			<table class="whitelist-table" cellpadding="0" cellspacing="0">
				<tbody class="editable-whitelist-rows">
					<tr>
						<th class="heading" colspan="2">
							<?php _e( 'Your current whitelisted IP Addresses', 'jetpack' ); ?>
						</th>
					</tr>

					<?php if( ! empty( $current_user_whitelist ) ): // prepopulate ?>
						<?php foreach( $current_user_whitelist as $key => $item ): ?>
							<tr id="row-<?php echo $key; ?>">
								<?php if( $item->range ) : ?>
									<td class="ip-address">Range:
										<?php echo $item->range_low; ?> &rarr; <?php echo $item->range_high; ?>
										<input type="hidden" name="whitelist[<?php echo $key; ?>][range_low]" value="<?php echo esc_attr( $item->range_low ); ?>" />
										<input type="hidden" name="whitelist[<?php echo $key; ?>][range_high]" value="<?php echo esc_attr( $item->range_high ); ?>" />
										<input type="hidden" name="whitelist[<?php echo $key; ?>][range]" value="1" />
									</td>
								<?php else: ?>
									<td class="ip-address">
										<?php echo $item->ip_address; ?>
										<input type="hidden" name="whitelist[<?php echo $key; ?>][ip_address]" value="<?php echo esc_attr( $item->ip_address ); ?>" />
										<input type="hidden" name="whitelist[<?php echo $key; ?>][range]" value="0" />
									</td>
								<?php endif; ?>
								<td class="item-actions">
									<input type="button" class="button-primary delete-ip-address" data-id="<?php echo $key; ?>" value="x" />
								</td>
							</tr>
						<?php endforeach; ?>
					<?php endif; ?>
				</tbody>
				<tfoot>
					<tr class="toolbar">
						<td colspan="2">
							<input class="button-primary ip-add" type="button" data-template="whitelist-item-template-single" value="<?php esc_attr( _e( 'Add IP Address', 'jetpack' ) ); ?>" />
							<input class="button-primary ip-add" type="button" data-template="whitelist-item-template-range" value="<?php esc_attr( _e( 'Add IP Address Range', 'jetpack' ) ); ?>" />
						</td>
					</tr>
				</tfoot>
			</table>
			<p><input id="whitelist-save-button" disabled="disabled" type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Save', 'jetpack' ) ); ?>' /></p>
		</form>

	</div>

	<script type="text/template" class="whitelist-item-template-single">
		<tr id="row-<%= id %>">
			<td class="ip-address">
				IP Address: <input type="text" name="whitelist[<%= id %>][ip_address]" value="" />
				<input type="hidden" name="whitelist[<%= id %>][range]" value="0" />
			</td>
			<td class="item-actions">
				<input type="button" class="button-primary delete-ip-address" data-id="<%= id %>" value="x" />
			</td>
		</tr>
	</script>
	<script type="text/template" class="whitelist-item-template-range">
		<tr id="row-<%= id %>">
			<td class="ip-address">
				IP Low: <input type="text" name="whitelist[<%= id %>][range_low]" value="" /> &rarr;
				IP High: <input type="text" name="whitelist[<%= id %>][range_high]" value="" />
				<input type="hidden" name="whitelist[<%= id %>][range]" value="1" />
			</td>
			<td class="item-actions">
				<input type="button" class="button-primary delete-ip-address" data-id="<%= id %>" value="x" />
			</td>
		</tr>
	</script>
	<script>
		jQuery(document).ready( function() {
			protectInit();
		});
	</script>

<?php endif; ?>