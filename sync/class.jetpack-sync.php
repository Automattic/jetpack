<?php

require_once 'class.jetpack-sync-posts.php';
require_once 'class.jetpack-sync-meta.php';
require_once 'class.jetpack-sync-comments.php';
require_once 'class.jetpack-sync-options.php';
require_once 'class.jetpack-sync-network-options.php';
require_once 'class.jetpack-sync-functions.php';
require_once 'class.jetpack-sync-constants.php';
require_once 'class.jetpack-sync-users.php';
require_once 'class.jetpack-sync-updates.php';
require_once 'class.jetpack-sync-reindex.php';
require_once 'class.jetpack-sync-themes.php';
if ( is_multisite() ) {
	require_once 'class.jetpack-sync-network-options.php';
}

class Jetpack_Sync {
	static $do_shutdown = false;

	static $cron_name = 'jetpack_sync_next_beat';

	static $actions = array();

	static function init() {
		Jetpack_Sync_Posts::init();
		Jetpack_Sync_Meta::init();
		Jetpack_Sync_Comments::init();
		Jetpack_Sync_Options::init();
		Jetpack_Sync_Users::init();
		Jetpack_Sync_Network_Options::init();
		Jetpack_Sync_Updates::init();
		Jetpack_Sync_Reindex::init();

		// On jetpack version bump
		add_action( 'updating_jetpack_version', array( __CLASS__, 'schedule_full_sync' ) );
		// On jetpack registration
		add_action( 'jetpack_site_registered', array( __CLASS__, 'schedule_full_sync' ) );
		// Add on cron
		add_action( self::$cron_name, array( __CLASS__, 'cron_exec' ) );
	}

	static function schedule_sync() {
		if ( ! self::$do_shutdown ) {
			self::$do_shutdown = true;
			if ( function_exists( 'ignore_user_abort' ) ) {
				ignore_user_abort( true );
			}
			add_action( 'shutdown', array( __CLASS__, 'sync_partial_on_shutdown' ), 9 );
		}
	}

	static function cron_exec() {
		Jetpack::xmlrpc_async_call( 'jetpack.sync2', self::get_data_to_sync() );
	}

	static function schedule_next_cron() {
		if ( ! wp_next_scheduled( self::$cron_name ) ) {
			$next_minute = time() + 60;
			wp_schedule_single_event( $next_minute, self::$cron_name );
		}
	}

	static function remove_cron() {
		$timestamp = wp_next_scheduled( self::$cron_name );
		wp_unschedule_event( $timestamp, self::$cron_name );
	}

	static function slice_ids( $ids, $max, $option_name ) {
		$lock_name    = $option_name . '_lock';
		$is_locked    = get_option( $lock_name );
		$post_ids_que = get_option( $option_name );

		if ( ! empty( $post_ids_que ) ) {
			$ids = array_unique( array_merge( $ids, $post_ids_que ) );
		}
		$pid = getmypid();
		if ( ! $is_locked || $pid === $is_locked ) {
			update_option( $lock_name, $pid );

			if ( sizeof( $ids ) <= $max ) {
				delete_option( $option_name );
				delete_option( $lock_name );

				return $ids;
			}
			$to_save = array_splice( $ids, $max );
			update_option( $option_name, $to_save );
			delete_option( $lock_name );

			Jetpack_Sync::schedule_next_cron();
		} else {

		}

		return $ids;
	}

	static function schedule_full_sync() {
		add_action( 'shutdown', array( __CLASS__, 'sync_full_on_shutdown' ), 9 );
	}

	static function sync_partial_on_shutdown() {
		if ( ! self::should_sync() ) {
			return;
		}
		$to_sync = self::get_data_to_sync();
		Jetpack::xmlrpc_async_call( 'jetpack.sync2', $to_sync );
	}

	static function sync_full_on_shutdown() {
		if ( ! self::should_sync() ) {
			return;
		}
		Jetpack::xmlrpc_async_call( 'jetpack.sync2', self::get_all_data_() );
	}

	static function should_sync() {
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			return false;
		}
		if ( Jetpack::is_development_mode() || Jetpack::is_staging_site() ) {
			return false;
		}

		return true;
	}

	static function sync_action() {
		self::$actions[ current_action() ][] = func_get_args();
		Jetpack_Sync::schedule_sync();
	}

	static function get_actions_to_sync() {
		$actions[] = Jetpack_Sync_Posts::get_actions_to_sync();
		error_log(print_r($actions,1));
		return $actions;
	}


	static function get_data_to_sync() {
		$send['current_user_id'] = get_current_user_id(); 
		$send['options']        = Jetpack_Sync_Options::get_to_sync();
		$send['options_delete'] = Jetpack_Sync_Options::get_to_delete();
		$send['constants']      = self::sync_if_has_changed( Jetpack_Sync_Constants::$check_sum_id, Jetpack_Sync_Constants::get_all() );

		$send['actions'] = self::get_actions_to_sync();

		$send['post_meta']        = Jetpack_Sync_Meta::meta_to_sync( 'post' );
		$send['post_meta_delete'] = Jetpack_Sync_Meta::meta_to_delete( 'post' );

		$send['comments']            = Jetpack_Sync_Comments::comments_to_sync();
		$send['delete_comments']     = Jetpack_Sync_Comments::comments_to_delete();
		$send['comment_meta']        = Jetpack_Sync_Meta::meta_to_sync( 'comment' );
		$send['comment_meta_delete'] = Jetpack_Sync_Meta::meta_to_delete( 'comment' );

		$send['updates'] = Jetpack_Sync_Updates::get_to_sync();
		$send['themes']  = Jetpack_Sync_Themes::get_to_sync();

		if ( false === ( $do_check = get_transient( 'jetpack_sync_functions' ) ) ) {
			$send['functions'] = self::sync_if_has_changed( Jetpack_Sync_Functions::$check_sum_id, Jetpack_Sync_Functions::get_all() );
			set_transient( 'jetpack_sync_functions', true, MINUTE_IN_SECONDS );
		}
		if ( is_multisite() ) {
			$send['network_options']        = Jetpack_Sync_Network_Options::get_to_sync();
			$send['network_options_delete'] = Jetpack_Sync_Network_Options::get_to_delete();
		}

		return array_filter( $send );
	}


	static function array_diff_assoc_recursive( $array1, $array2 ) {
		$difference = array();
		foreach ( $array1 as $key => $value ) {
			if ( is_array( $value ) ) {
				if ( ! isset( $array2[ $key ] ) || ! is_array( $array2[ $key ] ) ) {
					$difference[ $key ] = $value;
				} else {
					$new_diff = array_diff_assoc_recursive( $value, $array2[ $key ] );
					if ( ! empty( $new_diff ) ) {
						$difference[ $key ] = $new_diff;
					}
				}
			} else if ( ! array_key_exists( $key, $array2 ) || $array2[ $key ] !== $value ) {
				$difference[ $key ] = $value;
			}
		}
		return $difference;
	}

	static function get_all_data() {
		$send['options']   = Jetpack_Sync_Options::get_all();
		$send['constants'] = Jetpack_Sync_Constants::get_all();
		$send['functions'] = Jetpack_Sync_Functions::get_all();
		$send['updates']   = Jetpack_Sync_Updates::get_all();
		$send['themes']    = Jetpack_Sync_Themes::get_all();
		if ( is_multisite() ) {
			$send['network_options'] = Jetpack_Sync_Network_Options::get_all();
		}

		return $send;
	}

	static function sync_if_has_changed( $check_sum_id, $values ) {
		$current_check_sum = self::get_check_sum( $values );
		if ( Jetpack_Options::get_option( $check_sum_id ) !== $current_check_sum ) {
			Jetpack_Options::update_option( $check_sum_id, $current_check_sum );

			return $values;
		}

		return null;
	}

	static function get_check_sum( $values ) {
		return crc32( json_encode( $values ) );
	}

}

Jetpack_Sync::init();
