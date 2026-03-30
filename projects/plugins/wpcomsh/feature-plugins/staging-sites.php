<?php
/**
 * Customizations for the staging sites.
 *
 * @package wpcomsh
 */

/**
 * Returns Atomic persistent data value for wpcom_is_staging_site.
 *
 * @param string $wpcom_is_staging_site Value for the preview links option.
 *
 * @return string The value of WPCOM_IS_STAGING_SITE if set, otherwise the option value.
 */
function wpcomsh_is_staging_site_get_atomic_persistent_data( $wpcom_is_staging_site ) {
	$persistent_data                       = new Atomic_Persistent_Data();
	$persistent_data_is_staging_site_value = $persistent_data->WPCOM_IS_STAGING_SITE; // phpcs:ignore WordPress.NamingConventions.ValidVariableName

	if ( $persistent_data_is_staging_site_value !== null ) {
		return json_decode( $persistent_data_is_staging_site_value );
	}

	return $wpcom_is_staging_site;
}
// need to hook to default_option_* too because if this option doesn't exist, the hook wouldn't run.
add_filter( 'default_option_wpcom_is_staging_site', 'wpcomsh_is_staging_site_get_atomic_persistent_data' );
add_filter( 'option_wpcom_is_staging_site', 'wpcomsh_is_staging_site_get_atomic_persistent_data' );

/**
 * Disables outgoing pingbacks/trackbacks in staging environments.
 *
 * Prevents the dispatch of pingbacks when the environment type is 'staging'
 * by clearing the list of URLs to ping. The `pre_ping` action passes
 * `$post_links` by reference, so emptying it prevents all outgoing pings.
 *
 * This can be removed once WordPress core addresses the issue.
 *
 * @see https://core.trac.wordpress.org/ticket/64837
 *
 * @param string[] $post_links Array of URLs to ping (passed by reference).
 */
function wpcomsh_disable_outgoing_pings_in_non_production_envs( &$post_links ) {
	if ( 'staging' === wp_get_environment_type() ) {
		$post_links = array();
	}
}
add_action( 'pre_ping', 'wpcomsh_disable_outgoing_pings_in_non_production_envs' );

/**
 * Disables incoming pingbacks in staging environments by removing
 * the 'pingback.ping' XML-RPC method.
 *
 * Prevents WordPress from processing incoming pingbacks when the environment
 * type is 'staging'. This can be removed once WordPress core addresses the issue.
 *
 * @see https://core.trac.wordpress.org/ticket/64837
 *
 * @param array<string, callable> $methods Associative array of XML-RPC methods.
 * @return array<string, callable> Modified associative array of XML-RPC methods.
 */
function wpcomsh_disable_incoming_pings_in_non_production_envs( $methods ) {
	if ( 'staging' === wp_get_environment_type() ) {
		unset( $methods['pingback.ping'] );
	}

	return $methods;
}
add_filter( 'xmlrpc_methods', 'wpcomsh_disable_incoming_pings_in_non_production_envs' );

/**
 * Forces the default_pingback_flag option to '0' on staging sites so the
 * Discussion Settings UI reflects that outgoing pingbacks are disabled.
 *
 * @return string|false '0' on staging sites, false to allow normal behavior otherwise.
 */
function wpcomsh_force_pingback_flag_off_on_staging() {
	if ( 'staging' === wp_get_environment_type() ) {
		return '0';
	}

	return false;
}
add_filter( 'pre_option_default_pingback_flag', 'wpcomsh_force_pingback_flag_off_on_staging' );

/**
 * Forces the default_ping_status option to 'closed' on staging sites so the
 * Discussion Settings UI reflects that incoming pingbacks are disabled.
 *
 * @return string|false 'closed' on staging sites, false to allow normal behavior otherwise.
 */
function wpcomsh_force_ping_status_closed_on_staging() {
	if ( 'staging' === wp_get_environment_type() ) {
		return 'closed';
	}

	return false;
}
add_filter( 'pre_option_default_ping_status', 'wpcomsh_force_ping_status_closed_on_staging' );

/**
 * Disables pingback checkboxes and adds an explanation on the Discussion
 * Settings page for staging sites.
 */
function wpcomsh_disable_pingback_ui_on_staging() {
	if ( 'staging' !== wp_get_environment_type() ) {
		return;
	}

	$screen = get_current_screen();
	if ( ! $screen || 'options-discussion' !== $screen->id ) {
		return;
	}

	?>
	<script>
	( function() {
		var ids = [ 'default_pingback_flag', 'default_ping_status' ];
		var message = ' — ' + <?php echo wp_json_encode( __( 'Pingbacks are disabled on staging sites to prevent unintended outbound requests.', 'wpcomsh' ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;
		ids.forEach( function( id ) {
			var checkbox = document.getElementById( id );
			if ( checkbox ) {
				checkbox.disabled = true;
				var note = document.createElement( 'em' );
				note.textContent = message;
				checkbox.parentNode.appendChild( note );
			}
		} );
	} )();
	</script>
	<?php
}
add_action( 'admin_print_footer_scripts', 'wpcomsh_disable_pingback_ui_on_staging' );
