<script id="tmpl-modal" type="text/html">
	<span id="modal-label" class="screen-reader-text"><?php _e( 'Modal window. Press escape to close.', 'jetpack' ); ?></span>
	<a href="#" class="close">&times; <span class="screen-reader-text"><?php _e( 'Close modal window', 'jetpack' ); ?></span></a>
	<div class="content-container <# if ( data.available) { #>modal-footer<# } #>">
		<div class="content">
			<h2>{{{ data.name }}}</h2>
			{{{ data.long_description }}}
		</div>
	</div>
	<# if ( data.available) { #>
		<footer>
			<ul>
				<li>
					<# if ( data.activated ) { #>
						<span class='delete'><a class="button-secondary"href="<?php echo admin_url( 'admin.php' ); ?>?page=jetpack&#038;action=deactivate&#038;module={{{ data.module }}}&#038;_wpnonce={{{ data.deactivate_nonce }}}"><?php _e( 'Deactivate', 'jetpack' ); ?></a></span>
					<# } else if ( data.available ) { #>
						<span class='activate'><a class="button-primary"href="<?php echo admin_url( 'admin.php' ); ?>?page=jetpack&#038;action=activate&#038;module={{{ data.module }}}&#038;_wpnonce={{{ data.activate_nonce }}}"><?php _e( 'Activate', 'jetpack' ); ?></a></span>
					<# } #>
				</li>
				<# if ( data.configurable ) { #>
					<li><a class="button-primary" href="{{ data.configure_url }}"><?php _e( 'Configure', 'jetpack' ); ?></a></li>
				<# } #>
			</ul>
		</footer>
	<# } #>
</script>
