<?php extract( $data ); ?>

<?php if ( isset( $_GET['updated'] ) && 'true' == $_GET['updated'] ) : ?>
	<div class="updated"><?php esc_html_e( 'Jetpack Network Settings Updated!', 'jetpack' ); ?></div>
<?php endif; ?>

<?php if ( isset( $_GET['error'] ) && 'jetpack_protect_whitelist' == $_GET['error'] ) : ?>
	<div class="error"><?php esc_html_e( 'One of your IP addresses was not valid.', 'jetpack' ); ?></div>
<?php endif; ?>

<div class="wrap">
	<h2><?php _e( 'Network Settings', 'jetpack' ); ?></h2>
	<form action="edit.php?action=jetpack-network-settings" method="POST">
		<h3><?php _e( 'Global', 'jetpack' ); ?></h3>
		<p><?php _e( 'These settings affect all sites on the network.', 'jetpack' ); ?></p>
		<?php wp_nonce_field( 'jetpack-network-settings' ); ?>
		<table class="form-table">
<?php /*
			<tr valign="top">
				<th scope="row"><label for="auto-connect">Auto-Connect New Sites</label></th>
				<td>
					<input type="checkbox" name="auto-connect" id="auto-connect" value="1" <?php checked($options['auto-connect']); ?> />
					<label for="auto-connect">Automagically connect all new sites in the network.</label>
				</td>
			</tr>
/**/ ?>
			<tr valign="top">
				<th scope="row"><label for="sub-site-override"><?php _e( 'Sub-site override', 'jetpack' ); ?></label></th>
				<td>
					<input type="checkbox" name="sub-site-connection-override" id="sub-site-override" value="1" <?php checked($options['sub-site-connection-override']); ?> />
					<label for="sub-site-override"><?php _e( 'Allow individual site administrators to manage their own connections (connect and disconnect) to <a href="//wordpress.com">WordPress.com</a>', 'jetpack' ); ?></label>
				</td>
			</tr>

			<tr valign="top">
				<th scope="row"><label for="sub-site-override"><?php _e( 'Protect whitelist', 'jetpack' ); ?></label></th>
				<td>
					<p><strong><?php printf( __( 'Your current IP: %s', 'jetpack' ), jetpack_protect_get_ip() ); ?></strong></p>
					<textarea name="global-whitelist" style="width: 100%;" rows="8"><?php echo implode( PHP_EOL, $jetpack_protect_whitelist['global'] ); ?></textarea> <br />
					<label for="global-whitelist"><?php _e('IPv4 and IPv6 are acceptable. <br />To specify a range, enter the low value and high value separated by a dash. Example: 12.12.12.1-12.12.12.100', 'jetpack' ); ?></label>
				</td>
			</tr>
<?php /* Remove the toggles for 2.9, re-evaluate how they're done and added for a 3.0 release. They don't feel quite right yet.
			<tr>
				<th scope="row"><label for="manage_auto_activated_modules">Manage modules</label></th>
				<td>
					<input type="checkbox" name="manage_auto_activated_modules" id="manage_auto_activated_modules" onclick="jQuery('#jpms_settings_modules').toggle();" value="1" <?php checked( $options['manage_auto_activated_modules'] ); ?>/>
					<label for="manage_auto_activated_modules">Control which modules are auto-activated</label>
				</td>
			</tr>
/**/ ?>
		</table>
		
<?php /* Remove the toggles for 2.9, re-evaluate how they're done and added for a 3.0 release. They don't feel quite right yet.
		<?php
			$display_modules = ( 1 == $this->get_option( 'manage_auto_activated_modules' ) )? 'block': 'none';
		?>
		<div id="jpms_settings_modules" style="display: <?php echo $display_modules; ?>">
		<h3><?php _e( 'Modules', 'jetpack' ); ?></h3>
		<p><?php _e( 'Modules to be automatically activated when new sites are created.', 'jetpack' ); ?></p>
		<table>
			<thead>
								<!--
				<tr>
					<td><input type="checkbox"></td>
					<td>Only show checked modules on subsites?</td>
				</tr>
				-->
			</thead>
			<tbody>

				<?php foreach( $modules AS $module ) {  ?>
				<tr>
					<td><input type="checkbox" name="modules[]" value="<?php echo $module['module']; ?>" id="<?php echo $module['module']; ?>" <?php checked( in_array( $module['module'], $options['modules'] ) ); ?>/></td>
					<td><label for="<?php echo $module['module']; ?>"><?php echo $module['name']; ?></label></td>
				</tr>

				<?php } ?>
			</tbody>
		</table>
		</div>
/**/ ?>

		<?php submit_button(); ?>

	</form>
</div>
