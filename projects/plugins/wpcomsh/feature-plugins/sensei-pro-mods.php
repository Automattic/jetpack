<?php
/**
 * File for all Atomic Sensei-onboarding specific changes.
 *
 * @package wpcomsh
 */

/**
 * Run all sensei mods.
 *
 * @return void
 */
function sensei_onboarding_mods() {
	if ( 'sensei' === get_option( 'site_intent' ) && ! get_option( 'sensei_flow_setup' ) ) {

		update_option( 'sensei_flow_setup', 1 );

		// Deactivate Crowdsignal Plugins
		if ( is_plugin_active( 'polldaddy/polldaddy.php' ) ) {
			deactivate_plugins( 'polldaddy/polldaddy.php' );
		}
		if ( is_plugin_active( 'crowdsignal-forms/crowdsignal-forms.php' ) ) {
			deactivate_plugins( 'crowdsignal-forms/crowdsignal-forms.php' );
		}

		// Create Default Sensei Pages.
		if ( is_plugin_active( 'sensei-lms/sensei-lms.php' ) ) {
			\Sensei_Setup_Wizard::instance()->pages->create_pages();
		}

		// Allow site user registration
		update_option( 'users_can_register', 1 );

		// Set usage tracking to true
		$sensei_settings                                  = get_option( 'sensei-settings' );
		$sensei_settings['sensei_usage_tracking_enabled'] = true;
		update_option( 'sensei-settings', $sensei_settings );
	}
}

add_action( 'admin_init', 'sensei_onboarding_mods' );

/**
 * Allow Sensei Home task complete option to be synced so we can use this status for the My Home Checklist
 *
 * @param array $options Jetpack sync allowed options.
 * @return array
 */
function sensei_wpcomsh_allow_custom_wp_options( $options ) {
	$options[] = 'sensei_home_tasks_list_is_completed';
	return $options;
}
add_filter( 'jetpack_sync_options_whitelist', 'sensei_wpcomsh_allow_custom_wp_options' );
