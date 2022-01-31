<?php
/**
 * Jetpack sync debug helper class
 *
 * @package automattic/jetpack-debug-helper
 */

defined( 'JETPACK__API_BASE' ) || define( 'JETPACK__API_BASE', get_option( Jetpack_Sync_Debug_Helper::API_BASE, 'https://jetpack.wordpress.com/jetpack.' ) );

Jetpack_Sync_Debug_Helper::init();

register_deactivation_hook( JETPACK_DEBUG_HELPER_BASE_PLUGIN_FILE, array( 'Jetpack_Sync_Debug_Helper', 'deactivate' ) );

/**
 * Helps debug sync errors
 */
class Jetpack_Sync_Debug_Helper {
	const API_BASE        = 'jetpack_debugger_api_base';
	const LAST_SYNC_ERROR = 'jetpack_debugger_last_sync_error';

	/**
	 * Saved error
	 *
	 * @var boolean
	 */
	public static $saved_error = false;

	/**
	 * Init hooks
	 *
	 * @return void
	 */
	public static function init() {
		// allows us to set the value via the api.
		add_filter( 'jetpack_options_whitelist', array( 'Jetpack_Sync_Debug_Helper', 'whitelist_options' ) );
		add_filter( 'jetpack_sync_send_data', array( 'Jetpack_Sync_Debug_Helper', 'pre_send' ), 8, 4 );
		add_filter( 'jetpack_sync_send_data', array( 'Jetpack_Sync_Debug_Helper', 'store_sync_error' ), 11, 4 );
	}

	/**
	 * Deactivation hook
	 */
	public static function deactivate() {
		delete_option( self::API_BASE );
		delete_option( self::LAST_SYNC_ERROR );
	}

	/**
	 * Pre send
	 *
	 * @param array  $data The action buffer.
	 * @param string $codec_name The codec name used to encode the data.
	 * @param double $sent_timestamp The current time.
	 * @param string $queue_id The queue used to send ('sync' or 'full_sync').
	 * @return array
	 */
	public static function pre_send( $data, $codec_name, $sent_timestamp, $queue_id ) {
		if ( empty( $data ) ) {
			update_option(
				self::LAST_SYNC_ERROR,
				array(
					'error_code' => 'pre_empty',
					'queue'      => $queue_id,
					'timestamp'  => $sent_timestamp,
					'codec'      => $codec_name,
				)
			);

			self::$saved_error = true;
		}
		return $data;
	}

	/**
	 * Pre send
	 *
	 * @param array  $data The action buffer.
	 * @param string $codec_name The codec name used to encode the data.
	 * @param double $sent_timestamp The current time.
	 * @param string $queue_id The queue used to send ('sync' or 'full_sync').
	 * @return array
	 */
	public static function store_sync_error( $data, $codec_name, $sent_timestamp, $queue_id ) {
		if ( is_wp_error( $data ) ) {
			update_option(
				self::LAST_SYNC_ERROR,
				array(
					'error_code' => $data->get_error_code(),
					'queue'      => $queue_id,
					'timestamp'  => $sent_timestamp,
					'codec'      => $codec_name,
				)
			);

			// Not going any further to avoid fatal errors if $data is an object.
			return $data;
		}
		if ( isset( $data['error_code'] ) && ! self::$saved_error ) {
			update_option(
				self::LAST_SYNC_ERROR,
				array(
					'error_code' => $data['error_code'],
					'queue'      => $queue_id,
					'timestamp'  => $sent_timestamp,
					'codec'      => $codec_name,
				)
			);
		}
		if ( empty( $data ) && ! self::$saved_error ) {
			update_option(
				self::LAST_SYNC_ERROR,
				array(
					'error_code' => 'empty',
					'queue'      => $queue_id,
					'timestamp'  => $sent_timestamp,
					'codec'      => $codec_name,
				)
			);
		}
		return $data;
	}

	/**
	 * Whitelist synced options
	 *
	 * @param array $options options.
	 * @return array
	 */
	public static function whitelist_options( $options ) {
		return array_merge(
			$options,
			array(
				self::API_BASE,
				self::LAST_SYNC_ERROR,
			)
		);
	}

}

