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
 * Cache inconsistency fix. This function will flush the cache if it detects that it is corrupted.
 *
 * See https://github.com/Automattic/wp-calypso/issues/73547
 *
 * @param bool   $result The result of the licensing configuration.
 * @param array  $payload The payload received from SenseiLMS.com back-end API.
 * @param string $event_type The event type that triggered this filter.
 *
 * @return bool
 */
function sensei_activation_cache_flush( $result, $payload, $event_type ) {
	if ( 'provision_license' !== $event_type ) {
		return $result;
	}

	$notoptions = wp_cache_get( 'notoptions', 'options' );

	if ( isset( $notoptions['senseilms_license_key__sensei-pro'] ) && true === $notoptions['senseilms_license_key__sensei-pro'] ) {
		wp_cache_set( 'notoptions', array(), 'options' );
	}

	return $result;
}

add_filter( 'wpcom_marketplace_webhook_response_sensei-pro', 'sensei_activation_cache_flush', 11, 3 );

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
