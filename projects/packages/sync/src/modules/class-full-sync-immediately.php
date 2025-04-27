<?php
/**
 * Full sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Actions;
use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Lock;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;

/**
 * This class does a full resync of the database by
 * sending an outbound action for every single object
 * that we care about.
 */
class Full_Sync_Immediately extends Module {
	/**
	 * Prefix of the full sync status option name.
	 *
	 * @var string
	 */
	const STATUS_OPTION = 'jetpack_sync_full_status';

	/**
	 * Sync Lock name.
	 *
	 * @var string
	 */
	const LOCK_NAME = 'full_sync';

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'full-sync';
	}

	/**
	 * Initialize action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	}

	/**
	 * Start a full sync.
	 *
	 * @access public
	 *
	 * @param array $full_sync_config Full sync configuration.
	 * @param mixed $context The context where the full sync was initiated from.
	 *
	 * @return bool Always returns true at success.
	 */
	public function start( $full_sync_config = null, $context = null ) {
		// There was a full sync in progress.
		if ( $this->is_started() && ! $this->is_finished() ) {
			/**
			 * Fires when a full sync is cancelled.
			 *
			 * @since 1.6.3
			 * @since-jetpack 4.2.0
			 */
			do_action( 'jetpack_full_sync_cancelled' );
			$this->send_action( 'jetpack_full_sync_cancelled' );
		}

		// Remove all evidence of previous full sync items and status.
		$this->reset_data();

		if ( ! is_array( $full_sync_config ) ) {
			/*
			 * Filter default sync config to allow injecting custom configuration.
			 *
			 * @param array $full_sync_config Sync configuration for all sync modules.
			 *
			 * @since 3.10.0
			 */
			$full_sync_config = apply_filters( 'jetpack_full_sync_config', Defaults::$default_full_sync_config );
			if ( is_multisite() ) {
				$full_sync_config['network_options'] = 1;
			}
		}

		if ( isset( $full_sync_config['users'] ) && 'initial' === $full_sync_config['users'] ) {
			$users_module = Modules::get_module( 'users' );
			'@phan-var Users $users_module';
			$full_sync_config['users'] = $users_module->get_initial_sync_user_config();
		}

		$range = $this->get_content_range( $full_sync_config );

		$this->update_status(
			array(
				'started'  => time(),
				'config'   => $full_sync_config,
				'progress' => $this->get_initial_progress( $full_sync_config, $range ),
			)
		);
		/**
		 * Fires when a full sync begins. This action is serialized
		 * and sent to the server so that it knows a full sync is coming.
		 *
		 * @param array $full_sync_config Sync configuration for all sync modules.
		 * @param array $range Range of the sync items, containing min and max IDs for some item types.
		 * @param mixed $context The context where the full sync was initiated from.
		 *
		 * @since 1.6.3
		 * @since-jetpack 4.2.0
		 * @since-jetpack 7.3.0 Added $range arg.
		 * @since 4.4.0 Added $context arg.
		 */
		do_action( 'jetpack_full_sync_start', $full_sync_config, $range );
		$this->send_action( 'jetpack_full_sync_start', array( $full_sync_config, $range, $context ) );

		return true;
	}

	/**
	 * Whether full sync has started.
	 *
	 * @access public
	 *
	 * @return boolean
	 */
	public function is_started() {
		return (bool) $this->get_status()['started'];
	}

	/**
	 * Retrieve the status of the current full sync.
	 *
	 * @access public
	 *
	 * @return array Full sync status.
	 */
	public function get_status() {
		$default = array(
			'started'  => false,
			'finished' => false,
			'progress' => array(),
			'config'   => array(),
		);

		return wp_parse_args( \Jetpack_Options::get_raw_option( self::STATUS_OPTION ), $default );
	}

	/**
	 * Returns the progress percentage of a full sync.
	 *
	 * @access public
	 *
	 * @return int|null
	 */
	public function get_sync_progress_percentage() {
		if ( ! $this->is_started() || $this->is_finished() ) {
			return null;
		}
		$status = $this->get_status();
		if ( empty( $status['progress'] ) ) {
			return null;
		}
		$total_items = array_reduce(
			array_values( $status['progress'] ),
			function ( $sum, $sync_item ) {
				return isset( $sync_item['total'] ) ? ( $sum + (int) $sync_item['total'] ) : $sum;
			},
			0
		);
		$total_sent  = array_reduce(
			array_values( $status['progress'] ),
			function ( $sum, $sync_item ) {
				return isset( $sync_item['sent'] ) ? ( $sum + (int) $sync_item['sent'] ) : $sum;
			},
			0
		);
		return floor( ( $total_sent / $total_items ) * 100 );
	}

	/**
	 * Whether full sync has finished.
	 *
	 * @access public
	 *
	 * @return boolean
	 */
	public function is_finished() {
		return (bool) $this->get_status()['finished'];
	}

	/**
	 * Clear all the full sync data.
	 *
	 * @access public
	 */
	public function reset_data() {
		$this->clear_status();
		( new Lock() )->remove( self::LOCK_NAME, true );
	}

	/**
	 * Clear all the full sync status options.
	 *
	 * @access public
	 */
	public function clear_status() {
		\Jetpack_Options::delete_raw_option( self::STATUS_OPTION );
	}

	/**
	 * Updates the status of the current full sync.
	 *
	 * @access public
	 *
	 * @param array $values New values to set.
	 *
	 * @return bool True if success.
	 */
	public function update_status( $values ) {
		return $this->set_status( wp_parse_args( $values, $this->get_status() ) );
	}

	/**
	 * Retrieve the status of the current full sync.
	 *
	 * @param array $values New values to set.
	 *
	 * @access public
	 *
	 * @return boolean Full sync status.
	 */
	public function set_status( $values ) {
		return \Jetpack_Options::update_raw_option( self::STATUS_OPTION, $values );
	}

	/**
	 * Given an initial Full Sync configuration get the initial status.
	 *
	 * @param array $full_sync_config Full sync configuration.
	 * @param array $range Range of the sync items, containing min, max and count IDs for some item types.
	 *
	 * @return array Initial Sent status.
	 */
	public function get_initial_progress( $full_sync_config, $range = null ) {
		// Set default configuration, calculate totals, and save configuration if totals > 0.
		$status = array();
		foreach ( $full_sync_config as $name => $config ) {
			$module = Modules::get_module( $name );
			if ( ! $module ) {
				continue;
			}
			$status[ $name ] = array(
				// If we have a range for the module, use the count from the range to avoid querying the database again.
				'total'    => $range[ $name ]->count ?? $module->total( $config ),
				'sent'     => 0,
				'finished' => false,
			);
		}

		return $status;
	}

	/**
	 * Get the range for content (posts and comments) to sync.
	 *
	 * @access private
	 *
	 * @param array $full_sync_config Full sync configuration.
	 *
	 * @return array Array of range (min ID, max ID, total items) for all content types.
	 */
	private function get_content_range( $full_sync_config ) {
		$range = array();
		foreach ( $full_sync_config as $module_name => $config ) {
			// Calculate ranges only for modules that get chunked.
			if ( in_array( $module_name, array( 'constants', 'functions', 'network_options', 'options', 'themes', 'updates' ), true ) ) {
				continue;
			}
			$module = Modules::get_module( $module_name );
			if ( ! $module ) {
				continue;
			}
			if ( true === isset( $config ) && $config ) {
				$range[ $module_name ] = $this->get_range( $module_name );
			}
		}

		return $range;
	}

	/**
	 * Get the range (min ID, max ID and total items) of items to sync.
	 *
	 * @access public
	 *
	 * @param string $type Type of sync item to get the range for.
	 *
	 * @return array Array of min ID, max ID and total items in the range.
	 */
	public function get_range( $type ) {
		global $wpdb;
		$module = Modules::get_module( $type );
		if ( ! $module ) {
			return array();
		}

		$table = $module->table();
		$id    = $module->id_field();
		if ( 'terms' === $module ) { // Terms module relies on the term_taxonomy and term_taxonomy_id for the where sql, let's use term_id instead.
			$id = 'term_id';
		}
		$where_sql = $module->get_where_sql( array() );

		// TODO: Call $wpdb->prepare on the following query.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_results( "SELECT MAX({$id}) as max, MIN({$id}) as min, COUNT({$id}) as count FROM {$table} WHERE {$where_sql}" );
		if ( isset( $results[0] ) ) {
			return $results[0];
		}

		return array();
	}

	/**
	 * Continue sending instead of enqueueing.
	 *
	 * @access public
	 */
	public function continue_enqueuing() {
		$this->continue_sending();
	}

	/**
	 * Continue sending.
	 *
	 * @access public
	 */
	public function continue_sending() {
		// Return early if Full Sync is not running.
		if ( ! $this->is_started() || $this->get_status()['finished'] ) {
			return;
		}

		// Return early if we've gotten a retry-after header response.
		$retry_time = get_option( Actions::RETRY_AFTER_PREFIX . 'immediate-send' );
		if ( $retry_time ) {
			// If expired delete but don't send. Send will occurr in new request to avoid race conditions.
			if ( microtime( true ) > $retry_time ) {
				update_option( Actions::RETRY_AFTER_PREFIX . 'immediate-send', false, false );
			}
			return false;
		}

		// Obtain send Lock.
		$lock            = new Lock();
		$lock_expiration = $lock->attempt( self::LOCK_NAME );

		// Return if unable to obtain lock.
		if ( false === $lock_expiration ) {
			return;
		}

		// Send Full Sync actions.
		$success = $this->send();

		// Remove lock.
		if ( $success ) {
			$lock->remove( self::LOCK_NAME, $lock_expiration );
		}
	}

	/**
	 * Immediately send the next items to full sync.
	 *
	 * @access public
	 */
	public function send() {
		$config = $this->get_status()['config'];

		$max_duration = Settings::get_setting( 'full_sync_send_duration' );
		$send_until   = microtime( true ) + $max_duration;

		$progress = $this->get_status()['progress'];

		$started = $this->get_status()['started'];

		foreach ( $this->get_remaining_modules_to_send() as $module ) {
			$progress[ $module->name() ] = $module->send_full_sync_actions( $config[ $module->name() ], $progress[ $module->name() ], $send_until );
			if ( isset( $progress[ $module->name() ]['error'] ) ) {
				unset( $progress[ $module->name() ]['error'] );
				$this->update_status( array( 'progress' => $progress ) );
				return false;
			} elseif ( ! $progress[ $module->name() ]['finished'] ) {
				$this->update_status( array( 'progress' => $progress ) );
				return true;
			}
			if ( $this->get_status()['started'] !== $started ) {
				// Full sync was restarted, stop sending.
				return false;
			}
		}

		$this->send_full_sync_end();
		$this->update_status( array( 'progress' => $progress ) );
		return true;
	}

	/**
	 * Get Modules that are configured to Full Sync and haven't finished sending
	 *
	 * @return array
	 */
	public function get_remaining_modules_to_send() {
		$status            = $this->get_status();
		$remaining_modules = array();
		foreach ( array_keys( $status['config'] ) as $module_name ) {
			$module = Modules::get_module( $module_name );
			if ( ! $module ) {
				continue;
			}
			if ( isset( $status['progress'][ $module_name ]['finished'] ) &&
				true === $status['progress'][ $module_name ]['finished'] ) {
					continue;
			}
			// Ensure that 'constants', 'options', and 'callables' are sent first.
			if ( in_array( $module_name, array( 'network_options', 'options', 'functions', 'constants' ), true ) ) {
				array_unshift( $remaining_modules, $module );
			} else {
				$remaining_modules[] = $module;
			}
		}
		return $remaining_modules;
	}

	/**
	 * Send 'jetpack_full_sync_end' and update 'finished' status.
	 *
	 * @access public
	 */
	public function send_full_sync_end() {
		$range = $this->get_content_range( $this->get_status()['config'] );

		/**
		 * Fires when a full sync ends. This action is serialized
		 * and sent to the server.
		 *
		 * @param string $checksum Deprecated since 7.3.0 - @see https://github.com/Automattic/jetpack/pull/11945/
		 * @param array $range Range of the sync items, containing min and max IDs for some item types.
		 *
		 * @since 1.6.3
		 * @since-jetpack 4.2.0
		 * @since-jetpack 7.3.0 Added $range arg.
		 */
		do_action( 'jetpack_full_sync_end', '', $range );
		$this->send_action( 'jetpack_full_sync_end', array( '', $range ) );

		// Setting autoload to true means that it's faster to check whether we should continue enqueuing.
		$this->update_status( array( 'finished' => time() ) );
	}

	/**
	 * Empty Function as we don't close buffers on Immediate Full Sync.
	 *
	 * @param array $actions an array of actions, ignored for queueless sync.
	 */
	public function update_sent_progress_action( $actions ) { } // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
}
