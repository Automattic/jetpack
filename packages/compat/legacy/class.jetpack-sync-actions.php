<?php

/**
 * Class Jetpack_Sync_Actions
 *
 * @deprecated Use Automattic\Jetpack\Sync\Actions
 */
class Jetpack_Sync_Actions extends Automattic\Jetpack\Sync\Actions {

	static function init() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::init();
	}

	static function add_sender_shutdown() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::add_sender_shutdown();
	}

	static function should_initialize_sender() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::should_initialize_sender();
	}

	static function sync_allowed() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::sync_allowed();
	}

	static function sync_via_cron_allowed() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::sync_via_cron_allowed();
	}

	static function prevent_publicize_blacklisted_posts( $should_publicize, $post ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::prevent_publicize_blacklisted_posts( $should_publicize, $post );
	}

	static function set_is_importing_true() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::set_is_importing_true();
	}

	static function send_data( $data, $codec_name, $sent_timestamp, $queue_id, $checkout_duration, $preprocess_duration ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::send_data( $data, $codec_name, $sent_timestamp, $queue_id, $checkout_duration, $preprocess_duration );
	}

	static function do_initial_sync() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::do_initial_sync();
	}

	static function do_full_sync( $modules = null ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::do_full_sync( $modules );
	}

	static function jetpack_cron_schedule( $schedules ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::jetpack_cron_schedule( $schedules );
	}

	static function do_cron_sync() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::do_cron_sync();
	}

	static function do_cron_full_sync() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::do_cron_full_sync();
	}

	static function do_cron_sync_by_type( $type ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::do_cron_sync_by_type();
	}

	static function initialize_listener() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::initialize_listener();
	}

	static function initialize_sender() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::initialize_sender();
	}

	static function initialize_woocommerce() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::initialize_woocommerce();
	}

	static function add_woocommerce_sync_module( $sync_modules ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::add_woocommerce_sync_module( $sync_modules );
	}

	static function initialize_wp_super_cache() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::initialize_wp_super_cache();
	}

	static function add_wp_super_cache_sync_module( $sync_modules ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::add_wp_super_cache_sync_module( $sync_modules );
	}

	static function sanitize_filtered_sync_cron_schedule( $schedule ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::sanitize_filtered_sync_cron_schedule( $schedule );
	}

	static function get_start_time_offset( $schedule = '', $hook = '' ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::get_start_time_offset( $schedule, $hook );
	}

	static function maybe_schedule_sync_cron( $schedule, $hook ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::maybe_schedule_sync_cron( $schedule, $hook );
	}

	static function clear_sync_cron_jobs() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::clear_sync_cron_jobs();
	}

	static function init_sync_cron_jobs() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::init_sync_cron_jobs();
	}

	static function cleanup_on_upgrade( $new_version = null, $old_version = null ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::cleanup_on_upgrade( $new_version, $old_version );
	}

	static function get_sync_status( $fields = null ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Sync\Actions' );

		return Actions::get_sync_status( $fields );
	}

}
