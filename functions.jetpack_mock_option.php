<?php
/**
 * Sometimes we need to fake options to be able to sync data with .com
 * This is a helper function. That will make it easier to do just that.
 *
 * It will make sure that the options are synced when
 * @param  string $option   Option will always be prefixed with Jetpack and be saved on .com side
 * @param  string or array $callback should never return false. Best to stay way from bool type at all.
 * @return null
 */
function jetpack_mock_option( $option , $callback ) {

	add_filter( 'pre_option_jetpack_'. $option ,  $callback );

	Jetpack_Sync::sync_options( JETPACK__PLUGIN_DIR . 'functions.jetpack_mock_option.php', 'jetpack_' . $option );

}


// Update jetpack_is_main_network on .com
jetpack_mock_option( 'is_main_network',   array( Jetpack::init(), 'is_main_network_option' ) );
jetpack_mock_option( 'main_network_site', array( Jetpack::init(), 'jetpack_main_network_site_option' ) );

/**
 * Trigger an update to the main_network_site when we update the blogname of a site.
 *
 * @return null
 */
add_action( 'update_option_blogname', array( Jetpack::init(), 'update_jetpack_main_network_site_option' ) );
