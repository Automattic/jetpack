<?php /*
	To-do:
	1. Add current IP above table
	2. Have current ip autofilled in the IP field
	3. Pissibly remove "range" toggle for this: https://cloudup.com/c_gL7b8vmwn
	4. Prevent duplicates froms displaying / being added
*/ ?>

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

	<?php if( ! empty( $this->whitelist_error ) ) : ?>
		<p class="error">
			<?php _e( 'One or more of your IP Addresses were not valid.', 'jetpack' ); ?>
		</p>
	<?php endif; ?>

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
	$current_user_whitelist = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID, 'global'=>false ) );
	$current_user_global_whitelist = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID, 'global'=> true) );
	$other_user_whtielist = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID ), 'NOT' );
	?>

	<div class="protect-whitelist">

		<h3><?php _e('Whitelist Management', 'jetpack' ); ?></h3>

		<?php if( ! empty( $current_user_global_whitelist ) || ! empty( $other_user_whtielist ) ) : // maybe show user's non-editable whitelists ?>

			<table id="non-editable-whitelist" class="whitelist-table" cellpadding="0" cellspacing="0">
				<tr>
					<td colspan="2">
						<p>
							Here you can see global IP Addresses that apply to all you Jetpack powered sites,
							and IP Addresses added by other users on this site.
							You can <a href="https://wordpress.com" target="_blank">manage your global whitelist here.</a>
						</p>
					</td>
				</tr>
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
									<?php echo $item->range_low; ?> &ndash; <?php echo $item->range_high; ?>
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
									Range: <?php echo $item->range_low; ?> &ndash; <?php echo $item->range_high; ?>
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
			<p>
				Please enter any IP addresses you'd like to whitelist.
				Do not use any special notation to specify a range of addresses.
				Instead add a range by specifying a low value and a high value.
				IPv4 and IPv6 are acceptable.
			</p>
			<p>
			<strong>Your current IP: [value]</strong>
			</p>
			<?php wp_nonce_field( 'jetpack-protect' ); ?>
			<input type='hidden' name='action' value='jetpack_protect_save_whitelist' />
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
								<td class="ip-address">
									<?php echo $item->range_low; ?> &ndash; <?php echo $item->range_high; ?>
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
								<input type="button" class="delete-ip-address genericon genericon-close" data-id="<?php echo $key; ?>" value="" title="Remove IP Address" />
							</td>
						</tr>
					<?php endforeach; ?>
				<?php endif; ?>
				</tbody>
				<tfoot>
				<tr>
					<td class="toolbar" colspan="2">
						<div id="jetpack-protect-new-ip" class="enter-ip">
							<strong>IP Address:</strong> <input id="ip-input-single" type="text" name="whitelist[new][ip_address]" value="" />
							<input type="hidden" name="whitelist[new][range]" value="0" />
							<input type="button" class="ip-range-toggle button" value="<?php _e( 'Switch to range' ); ?>" data-template="whitelist-input-range" />
						</div>
						<div class="add-btn">
							<input class="button-primary ip-add" type="button" value="<?php esc_attr( _e( 'Add', 'jetpack' ) ); ?>" data-range="0" />
						</div>
					</td>
				</tr>

				</tfoot>
			</table>
		</form>

	</div>

	<script type="text/template" class="whitelist-input-single">
		<strong>IP Address:</strong> <input id="ip-input-single" type="text" name="whitelist[new][ip_address]" value="" />
		<input type="hidden" name="whitelist[new][range]" value="0" />
		<input type="button" class="ip-range-toggle button" value="<?php _e( 'Switch to range' ); ?>" data-template="whitelist-input-range" />
	</script>
	<script type="text/template" class="whitelist-input-range">
		<strong>IP Range:</strong> <input id="ip-input-range-low" type="text" name="whitelist[new][range_low]" value="" /> <strong>&ndash;</strong>
		<input id="ip-input-range-high" type="text" name="whitelist[new][range_high]" value="" />
		<input type="hidden" name="whitelist[new][range]" value="1" />
		<input type="button" class="ip-range-toggle button" value="<?php _e( 'Switch to single' ); ?>" data-template="whitelist-input-single" />
	</script>
	<script type="text/template" class="whitelist-static-single">
		<tr id="row-<%= key %>">
			<td class="ip-address">
				<%= ipAddress %>
				<input type="hidden" name="whitelist[<%= key %>][ip_address]" value="<%= ipAddress %>" />
				<input type="hidden" name="whitelist[<%= key %>][range]" value="0" />
			</td>
			<td class="item-actions">
				<input type="button" class="delete-ip-address genericon genericon-close" data-id="<%= key %>" value="" title="Remove IP Address" />
			</td>
		</tr>
	</script>
	<script type="text/template" class="whitelist-static-range">
		<tr id="row-<%= key %>">
			<td class="ip-address">
				<%= rangeLow %> &ndash; <%= rangeHigh %>
				<input type="hidden" name="whitelist[<%= key %>][range_low]" value="<%= rangeLow %>" />
				<input type="hidden" name="whitelist[<%= key %>][range_high]" value="<%= rangeHigh %>" />
				<input type="hidden" name="whitelist[<%= key %>][range]" value="1" />
			</td>
			<td class="item-actions">
				<input type="button" class="delete-ip-address genericon genericon-close" data-id="<%= key %>" value="" title="Remove IP Address" />
			</td>
		</tr>
	</script>

<?php endif; ?>