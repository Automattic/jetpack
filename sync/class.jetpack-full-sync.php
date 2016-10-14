<?php

class Jetpack_Full_Sync {

	// writes out a config item for each enabled module containing total items & input config
	static function start( $modules = null ) {
		// todo detect if config already set and/or sync already in progress

		$config = array();

		if ( ! is_array( $modules ) ) {
			$modules = array();
		}

		if ( isset( $modules['users'] ) && 'initial' === $modules['users'] ) {
			$user_module = Jetpack_Sync_Modules::get_module( 'users' );
			$modules['users'] = $user_module->get_initial_sync_user_config();
		}

		// by default, all modules are fully enabled
		if ( count( $modules ) === 0 ) {
			$default_module_config = true;
		} else {
			$default_module_config = false;
		}

		// set default configuration, calculate totals, and save configuration if totals > 0
		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_name = $module->name();
			if ( ! isset( $modules[ $module_name ] ) ) {
				$modules[ $module_name ] = $default_module_config;
			}

			// check if this module is enabled
			if ( ! ( $module_config = $modules[ $module_name ] ) ) {
				continue;
			}

			$total_items = $module->estimate_full_sync_actions( $module_config );

			if ( ! is_null( $total_items ) && $total_items > 0 ) {
				$config[ $module_name ] = array(
					'total' => $total_items,
					'config' => $module_config,
				);
			}
		}

		self::set_config( $config );

		// now let's set an initial status
		$status = array();
		foreach( $config as $module => $params ) {
			$status[ $module ] = array();
		}

		self::set_status( $status );
	}

	static function do_sync() {
		$config = self::get_config();
		$status = self::get_status();

		error_log("Got config: ".print_r($config,1));
		
		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			if ( isset( $status[ $module->name() ][ 'finished' ] ) ) {
				continue;
			}

			// do work
			Jetpack_Sync_Settings::set_is_sending( true );
			$processed_item_ids = apply_filters( 'jetpack_sync_send_data', $items_to_send, $this->codec->name(), microtime( true ), $queue->id );
			Jetpack_Sync_Settings::set_is_sending( false );
		}
		// get state
		
		// continue sync
		// save state
		// return result
	}

	private static function set_config( $config ) {
		self::write_option( 'jetpack_sync_full_config', $config );
	}

	private static function get_config() {
		return self::read_option( 'jetpack_sync_full_config' );
	}

	private static function set_status( $status ) {
		self::write_option( 'jetpack_sync_full_status', $status );
	}

	private static function get_status() {
		return self::read_option( 'jetpack_sync_full_status' );
	}

	private static function write_option( $name, $value ) {
		// we write our own option updating code to bypass filters/caching/etc on set_option/get_option
		global $wpdb;

		$serialized_value = maybe_serialize( $value );

		// try updating, if no update then insert
		$updated_num = $wpdb->query(
			$wpdb->prepare(
				"UPDATE $wpdb->options SET option_value = %s WHERE option_name = %s", 
				$serialized_value,
				$name
			)
		);

		if ( ! $updated_num ) {
			$updated_num = $wpdb->query(
				$wpdb->prepare(
					"INSERT INTO $wpdb->options ( option_name, option_value, autoload ) VALUES ( %s, %s, 'no' )", 
					$name,
					$serialized_value
				)
			);
		}

		return $updated_num;
	}

	private static function read_option( $name ) {
		global $wpdb;

		$value = $wpdb->get_var( 
			$wpdb->prepare(
				"SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1", 
				$name
			)
		);

		return maybe_unserialize( $value );
	}

	// private function set_checkout_id( $checkout_id ) {
	// 	global $wpdb;

	// 	$expires = time() + Jetpack_Sync_Defaults::$default_sync_queue_lock_timeout;
	// 	$updated_num = $wpdb->query(
	// 		$wpdb->prepare(
	// 			"UPDATE $wpdb->options SET option_value = %s WHERE option_name = %s", 
	// 			"$checkout_id:$expires",
	// 			self::get_lock_option_name()
	// 		)
	// 	);

	// 	if ( ! $updated_num ) {
	// 		$updated_num = $wpdb->query(
	// 			$wpdb->prepare(
	// 				"INSERT INTO $wpdb->options ( option_name, option_value, autoload ) VALUES ( %s, %s, 'no' )", 
	// 				self::get_lock_option_name(),
	// 				"$checkout_id:$expires"
	// 			)
	// 		);
	// 	}

	// 	return $updated_num;
	// }

	// private function delete_checkout_id() {
	// 	global $wpdb;
	// 	// rather than delete, which causes fragmentation, we update in place
	// 	return $wpdb->query(
	// 		$wpdb->prepare( 
	// 			"UPDATE $wpdb->options SET option_value = %s WHERE option_name = %s", 
	// 			"0:0",
	// 			self::get_lock_option_name() 
	// 		) 
	// 	);
	// }
}