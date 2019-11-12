<?php
/**
 * Full sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;

/**
 * This class does a full resync of the database by
 * enqueuing an outbound action for every single object
 * that we care about.
 *
 * This class, and its related class Jetpack_Sync_Module, contain a few non-obvious optimisations that should be explained:
 * - we fire an action called jetpack_full_sync_start so that WPCOM can erase the contents of the cached database
 * - for each object type, we page through the object IDs and enqueue them by firing some monitored actions
 * - we load the full objects for those IDs in chunks of Jetpack_Sync_Module::ARRAY_CHUNK_SIZE (to reduce the number of MySQL calls)
 * - we fire a trigger for the entire array which the Automattic\Jetpack\Sync\Listener then serializes and queues.
 */
class Full_Sync_Immediately extends Module {
	/**
	 * Prefix of the full sync status option name.
	 *
	 * @var string
	 */
	const STATUS_OPTION = 'jetpack_sync_full_status';

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
	public function init_full_sync_listeners( $callable ) {
		// Synthetic actions for full sync.
		add_action( 'jetpack_full_sync_start', $callable, 10, 3 );
		add_action( 'jetpack_full_sync_end', $callable, 10, 2 );
		add_action( 'jetpack_full_sync_cancelled', $callable );
	}

	/**
	 * Start a full sync.
	 *
	 * @access public
	 *
	 * @param array $full_sync_config Full sync configuration.
	 *
	 * @return bool Always returns true at success.
	 */
	public function start( $full_sync_config = null ) {
		// There was a full sync in progress.
		if ( $this->is_started() && ! $this->is_finished() ) {
			/**
			 * Fires when a full sync is cancelled.
			 *
			 * @since 4.2.0
			 */
			do_action( 'jetpack_full_sync_cancelled' );
		}

		// Remove all evidence of previous full sync items and status.
		$this->reset_data();

		if ( ! is_array( $full_sync_config ) ) {
			$full_sync_config = Defaults::$default_full_sync_config;
		}

		$this->update_status(
			[
				'started'  => time(),
				'config'   => $full_sync_config,
				'progress' => $this->get_initial_progress( $full_sync_config ),
			]
		);

		if ( isset( $full_sync_config['users'] ) && 'initial' === $full_sync_config['users'] ) {
			$full_sync_config['users'] = Modules::get_module( 'users' )->get_initial_sync_user_config();
		}

		$range = $this->get_content_range( $full_sync_config );
		/**
		 * Fires when a full sync begins. This action is serialized
		 * and sent to the server so that it knows a full sync is coming.
		 *
		 * @param array $full_sync_config Sync configuration for all sync modules.
		 * @param array $range Range of the sync items, containing min and max IDs for some item types.
		 * @param array $empty The modules with no items to sync during a full sync.
		 *
		 * @since 4.2.0
		 * @since 7.3.0 Added $range arg.
		 * @since 7.4.0 Added $empty arg.
		 */
		do_action( 'jetpack_full_sync_start', $full_sync_config, $range );

		return true;
	}

	/**
	 * Clear all the full sync data.
	 *
	 * @access public
	 */
	public function reset_data() {
		$this->clear_status();
		// TODO remove Lock.
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
	 * Whether full sync has started.
	 *
	 * @access public
	 *
	 * @return boolean
	 */
	public function is_started() {
		return ! ! $this->get_status()['started'];
	}

	/**
	 * Retrieve the status of the current full sync.
	 *
	 * @access public
	 *
	 * @return array Full sync status.
	 */
	public function get_status() {
		$default = [
			'started'  => false,
			'finished' => false,
			'progress' => [],
			'config'   => [],
		];

		return wp_parse_args( \Jetpack_Options::get_raw_option( self::STATUS_OPTION ), $default );
	}

	/**
	 * Whether full sync has finished.
	 *
	 * @access public
	 *
	 * @return boolean
	 */
	public function is_finished() {
		return ! ! $this->get_status()['finished'];
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
	 * Get the range for content (posts and comments) to sync.
	 *
	 * @access private
	 *
	 * @return array Array of range (min ID, max ID, total items) for all content types.
	 */
	private function get_content_range() {
		$range  = [];
		$config = $this->get_status()['config'];
		// Only when we are sending the whole range do we want to send also the range.
		if ( true === isset( $config['posts'] ) && $config['posts'] ) {
			$range['posts'] = $this->get_range( 'posts' );
		}

		if ( true === isset( $config['comments'] ) && $config['comments'] ) {
			$range['comments'] = $this->get_range( 'comments' );
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
		if ( ! in_array( $type, array( 'comments', 'posts' ), true ) ) {
			return array();
		}

		switch ( $type ) {
			case 'posts':
				$table     = $wpdb->posts;
				$id        = 'ID';
				$where_sql = Settings::get_blacklisted_post_types_sql();

				break;
			case 'comments':
				$table     = $wpdb->comments;
				$id        = 'comment_ID';
				$where_sql = Settings::get_comments_filter_sql();
				break;
		}

		// TODO: Call $wpdb->prepare on the following query.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_results( "SELECT MAX({$id}) as max, MIN({$id}) as min, COUNT({$id}) as count FROM {$table} WHERE {$where_sql}" );
		if ( isset( $results[0] ) ) {
			return $results[0];
		}

		return array();
	}

	/**
	 * Given an initial Full Sync configuration set the initial status.
	 *
	 * @param array $full_sync_config Full sync configuration.
	 *
	 * @return array Initial Sent status.
	 */
	public function get_initial_progress( $full_sync_config ) {
		// Set default configuration, calculate totals, and save configuration if totals > 0.
		$status = [];
		foreach ( $full_sync_config as $name => $config ) {
			$module          = Modules::get_module( $name );
			$status[ $name ] = array(
				'total'    => $module->total( $full_sync_config ),   // Total.
				'sent'     => 0,             // Sent.
				'finished' => false,
			);
		}

		return $status;
	}


	/**
	 * Continue sending.
	 *
	 * @access public
	 */
	public function continue_sending() {
		// TODO Lock.
		if ( ! $this->is_started() || $this->get_status()['finished'] ) {
			return;
		}

		$this->send();

		// TODO UnLock.
	} // Seconds.

	/**
	 * Immediately send the next items to full sync.
	 *
	 * @access public
	 */
	public function send() {
		$config = $this->get_status()['config'];

		$max_duration = Settings::get_setting( 'full_sync_send_immediately_duration' );
		$send_until   = microtime( true ) + $max_duration;

		$progress = $this->get_status()['progress'];

		/**
		 * If a module exits early (e.g. because it ran out of full sync queue slots, or we ran out of request time)
		 * then it should exit early
		 */
		foreach ( $this->get_remaining_modules_to_send() as $module ) {
			$progress[ $module->name() ] = $module->send_full_sync_actions( $config[ $module->name() ], $send_until, $progress[ $module->name() ] );
			if ( microtime( true ) >= $send_until ) {
				$this->update_status( [ 'progress' => $progress ] );

				return;
			}
		}

		$this->send_full_sync_end();
		$this->update_status( [ 'progress' => $progress ] );
	}

	/**
	 * Get Modules that are configured to Full Sync and haven't finished enqueuing
	 *
	 * @return array
	 */
	public function get_remaining_modules_to_send() {
		$status = $this->get_status();

		return array_filter(
			Modules::get_modules(),
			/**
			 * Select configured and not finished modules.
			 *
			 * @return bool
			 * @var $module Module
			 */
			function ( $module ) use ( $status ) {
				// Skip module if not configured for this sync or module is done.
				if ( ! isset( $status['config'][ $module->name() ] ) ) {
					return false;
				}
				if ( ! $status['config'][ $module->name() ] ) {
					return false;
				}
				if ( isset( $status['progress'][ $module->name() ]['finished'] ) ) {
					if ( true === $status['progress'][ $module->name() ]['finished'] ) {
						return false;
					}
				}

				return true;
			}
		);
	}

	/**
	 * Send 'jetpack_full_sync_end' and update 'finished' status.
	 *
	 * @access public
	 */
	public function send_full_sync_end() {
		$range = $this->get_content_range();

		/**
		 * Fires when a full sync ends. This action is serialized
		 * and sent to the server.
		 *
		 * @param string $checksum Deprecated since 7.3.0 - @see https://github.com/Automattic/jetpack/pull/11945/
		 * @param array $range Range of the sync items, containing min and max IDs for some item types.
		 *
		 * @since 4.2.0
		 * @since 7.3.0 Added $range arg.
		 */
		do_action( 'jetpack_full_sync_end', '', $range );

		// Setting autoload to true means that it's faster to check whether we should continue enqueuing.
		$this->update_status( [ 'finished' => time() ] );
	}
}
