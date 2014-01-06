<div class="wrap">
	<h2>Network Settings</h2>
	<form action="edit.php?action=jetpack-network-settings" method="POST">
		<h3>Global</h3>
		<p>These settings affect all sites on the network.</p>
		<table class="form-table">
<!--			<tr valign="top">
				<th scope="row"><label for="auto-connect">Auto-Connect New Sites</label></th>
				<td>
					<input type="checkbox" name="auto-connect" id="auto-connect" value="1" <?php checked($options['auto-connect']); ?> />
					<label for="auto-connect">Automagically connect all new sites in the network.</label>
				</td>
			</tr>
-->
			<tr valign="top">
				<th scope="row"><label for="sub-site-override">Sub-site override?</label></th>
				<td>
					<input type="checkbox" name="sub-site-connection-override" id="sub-site-override" value="1" <?php checked($options['sub-site-connection-override']); ?> />
					<label for="sub-site-override">Allow individual site administrators to reconnect with their own Jetpack account.</label>
				</td>
			</tr>
			<tr>
				<td><label for="manage_auto_activated_modules">Manage modules?</label></td>
				<td>
					<input type="checkbox" name="manage_auto_activated_modules" id="manage_auto_activated_modules" onclick="jQuery('#jpms_settings_modules').toggle();" value="1" <?php checked( $options['manage_auto_activated_modules'] ); ?>/>
					<label for="manage_auto_activated_modules">Control which modules are auto-activated?</label>
				</td>
			</tr>

		</table>
		
		<?php
			$display_modules = ( 1 == $this->get_option( 'manage_auto_activated_modules' ) )? 'block': 'none';
		?>
		<div id="jpms_settings_modules" style="display: <?php echo $display_modules; ?>">
		<h3>Modules</h3>
		<p>Modules to be automatically activated when new sites are created.</p>
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
				<?php foreach( $this->list_modules() AS $module ) { ?>
				<?php
				$module_name = $module['name'];
				$module_slug = strtolower( preg_replace( "/[^a-zA-Z0-9]+/", "", $module_name ) );
				?>
				<tr>
					<td><input type="checkbox" name="modules[]" value="<?php echo $module_slug; ?>" id="<?php echo $module_slug; ?>" <?php checked( in_array( $module_slug, $options['modules'] ) ); ?>/></td>
					<td><label for="<?php echo $module_slug; ?>"><?php echo $module_name; ?></label></td>
				</tr>

				<?php } ?>
			</tbody>
		</table>
		</div>

		<p class="submit"><input type="submit" name="submit" id="submit" class="button button-primary" value="Save Changes"  /></p>


	</form>
</div>
