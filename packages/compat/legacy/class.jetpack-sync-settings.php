<?php

use Automattic\Jetpack\Sync\Settings;

/**
 * Class Jetpack_Sync_Settings
 *
 * @deprecated Use Automattic\Jetpack\Sync\Settings
 */
class Jetpack_Sync_Settings {

	static function get_settings() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::get_settings();
	}

	static function get_setting( $setting ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::get_setting( $setting );
	}

	static function update_settings( $new_settings ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		Settings::update_settings( $new_settings );
	}

	static function is_network_setting( $setting ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::is_network_setting( $setting );
	}

	static function get_blacklisted_post_types_sql() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::get_blacklisted_post_types_sql();
	}

	static function get_whitelisted_post_meta_sql() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::get_whitelisted_post_meta_sql();
	}

	static function get_whitelisted_comment_meta_sql() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::get_whitelisted_comment_meta_sql();
	}

	static function get_comments_filter_sql() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::get_comments_filter_sql();
	}

	static function reset_data() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		Settings::reset_data();
	}

	static function set_importing( $is_importing ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		Settings::set_importing( $is_importing );
	}

	static function is_importing() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::is_importing();
	}

	static function is_sync_enabled() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::is_sync_enabled();
	}

	static function set_doing_cron( $is_doing_cron ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		Settings::set_doing_cron( $is_doing_cron );
	}

	static function is_doing_cron() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::is_doing_cron();
	}

	static function is_syncing() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::is_syncing();
	}

	static function set_is_syncing( $is_syncing ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		Settings::set_is_syncing( $is_syncing );
	}

	static function is_sending() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		return Settings::is_sending();
	}

	static function set_is_sending( $is_sending ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Settings' );
		Settings::set_is_sending( $is_sending );
	}

}
