<?php
/**
 * Jetpack's Sync Listener
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\IP\Utils as IP_Utils;
use Automattic\Jetpack\Roles;

/**
 * This class monitors actions and logs them to the queue to be sent.
 */
class Listener {
	const QUEUE_STATE_CHECK_TRANSIENT          = 'jetpack_sync_last_checked_queue_state';
	const QUEUE_STATE_CHECK_TIMEOUT            = 30; // 30 seconds.
	const REQUEST_STATE_CACHE_INVALIDATE_AFTER = 50; // Number of queue adds per request before invalidating the cache.

	/**
	 * Sync queue.
	 *
	 * @var object
	 */
	private $sync_queue;

	/**
	 * Full sync queue.
	 *
	 * @var object
	 */
	private $full_sync_queue;

	/**
	 * Sync queue size limit.
	 *
	 * @var int size limit.
	 */
	private $sync_queue_size_limit;

	/**
	 * Sync queue lag limit.
	 *
	 * @var int Lag limit.
	 */
	private $sync_queue_lag_limit;

	/**
	 * Per-request in-memory cache of queue state.
	 * Avoids repeated get_transient() calls for every
	 * can_add_to_queue check within a single request.
	 *
	 * @var array<string, array{int, float}>
	 */
	private $request_queue_state_cache = array();

	/**
	 * Count of successful adds per queue within this request, used to decide when
	 * to invalidate the in-memory cache so the size estimate stays accurate.
	 *
	 * @var array<string, int>
	 */
	private $request_adds_count = array();

	/**
	 * Singleton implementation.
	 *
	 * @var Listener
	 */
	private static $instance;

	/**
	 * Get the Listener instance.
	 *
	 * @return Listener
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Listener constructor.
	 *
	 * This is necessary because you can't use "new" when you declare instance properties >:(
	 */
	protected function __construct() {
		$this->set_defaults();
		$this->init();
	}

	/**
	 * Sync Listener init.
	 */
	private function init() {
		$handler           = array( $this, 'action_handler' );
		$full_sync_handler = array( $this, 'full_sync_action_handler' );

		foreach ( Modules::get_modules() as $module ) {
			$module->init_listeners( $handler );
			$module->init_full_sync_listeners( $full_sync_handler );
		}

		// Module Activation.
		add_action( 'jetpack_activate_module', $handler );
		add_action( 'jetpack_deactivate_module', $handler );

		// Send periodic checksum.
		add_action( 'jetpack_sync_checksum', $handler );
	}

	/**
	 * Get incremental sync queue.
	 */
	public function get_sync_queue() {
		return $this->sync_queue;
	}

	/**
	 * Gets the full sync queue.
	 */
	public function get_full_sync_queue() {
		return $this->full_sync_queue;
	}

	/**
	 * Sets queue size limit.
	 *
	 * @param int $limit Queue size limit.
	 */
	public function set_queue_size_limit( $limit ) {
		$this->sync_queue_size_limit = $limit;
	}

	/**
	 * Get queue size limit.
	 */
	public function get_queue_size_limit() {
		return $this->sync_queue_size_limit;
	}

	/**
	 * Sets the queue lag limit.
	 *
	 * @param int $age Queue lag limit.
	 */
	public function set_queue_lag_limit( $age ) {
		$this->sync_queue_lag_limit = $age;
	}

	/**
	 * Return value of queue lag limit.
	 */
	public function get_queue_lag_limit() {
		return $this->sync_queue_lag_limit;
	}

	/**
	 * Force a recheck of the queue limit.
	 */
	public function force_recheck_queue_limit() {
		delete_transient( self::QUEUE_STATE_CHECK_TRANSIENT . '_' . $this->sync_queue->id );
		delete_transient( self::QUEUE_STATE_CHECK_TRANSIENT . '_' . $this->full_sync_queue->id );
		$this->request_queue_state_cache = array();
		$this->request_adds_count        = array();
	}

	/**
	 * Determine if an item can be added to the queue.
	 *
	 * Prevent adding items to the queue if it hasn't sent an item for 15 mins
	 * AND the queue is over 1000 items long (by default).
	 *
	 * @param object $queue Sync queue.
	 * @return bool
	 */
	public function can_add_to_queue( $queue ) {
		if ( ! Settings::is_sync_enabled() ) {
			return false;
		}

		// Per-request in-memory cache: avoids a get_transient() call on every can_add_to_queue
		// check within the same request when many actions are enqueued.
		if ( isset( $this->request_queue_state_cache[ $queue->id ] ) ) {
			list( $queue_size, $queue_age ) = $this->request_queue_state_cache[ $queue->id ];
			return Health::is_queue_healthy(
				$queue_size + ( $this->request_adds_count[ $queue->id ] ?? 0 ) + 1,
				$queue_age,
				$this->sync_queue_size_limit,
				$this->sync_queue_lag_limit
			);
		}

		$state_transient_name = self::QUEUE_STATE_CHECK_TRANSIENT . '_' . $queue->id;

		$queue_state = get_transient( $state_transient_name );

		if ( false === $queue_state ) {
			$queue_state = array( $queue->size(), $queue->lag() );
			set_transient( $state_transient_name, $queue_state, self::QUEUE_STATE_CHECK_TIMEOUT );
		}

		// Populate in-memory cache from the transient result so subsequent calls this request
		// don't need to hit the object cache or DB at all.
		$this->request_queue_state_cache[ $queue->id ] = $queue_state;

		list( $queue_size, $queue_age ) = $queue_state;

		return Health::is_queue_healthy(
			$queue_size + 1,
			$queue_age,
			$this->sync_queue_size_limit,
			$this->sync_queue_lag_limit
		);
	}

	/**
	 * Full sync action handler.
	 *
	 * @param mixed ...$args Args passed to the action.
	 */
	public function full_sync_action_handler( ...$args ) {
		$this->enqueue_action( current_filter(), $args, $this->full_sync_queue );
	}

	/**
	 * Action handler.
	 *
	 * @param mixed ...$args Args passed to the action.
	 */
	public function action_handler( ...$args ) {
		$this->enqueue_action( current_filter(), $args, $this->sync_queue );
	}

	// add many actions to the queue directly, without invoking them.

	/**
	 * Bulk add action to the queue.
	 *
	 * @param string $action_name The name the full sync action.
	 * @param array  $args_array Array of chunked arguments.
	 */
	public function bulk_enqueue_full_sync_actions( $action_name, $args_array ) {
		$queue = $this->get_full_sync_queue();

		/*
		 * If we add any items to the queue, we should try to ensure that our script
		 * can't be killed before they are sent.
		 */
		// https://plugins.trac.wordpress.org/ticket/2041
		if ( function_exists( 'ignore_user_abort' ) ) {
			ignore_user_abort( true );
		}

		$data_to_enqueue = array();
		$user_id         = get_current_user_id();
		$currtime        = microtime( true );
		$is_importing    = Settings::is_importing();

		foreach ( $args_array as $args ) {
			$previous_end = isset( $args['previous_end'] ) ? $args['previous_end'] : null;
			$args         = isset( $args['ids'] ) ? $args['ids'] : $args;

			/**
			 * Modify or reject the data within an action before it is enqueued locally.
			 *
			 * @since 1.6.3
			 * @since-jetpack 4.2.0
			 *
			 * @module sync
			 *
			 * @param array The action parameters
			 */
			$args        = apply_filters( "jetpack_sync_before_enqueue_$action_name", $args );
			$action_data = array( $args );
			if ( $previous_end !== null ) {
				$action_data[] = $previous_end;
			}
			// allow listeners to abort.
			if ( false === $args ) {
				continue;
			}

			$data_to_enqueue[] = array(
				$action_name,
				$action_data,
				$user_id,
				$currtime,
				$is_importing,
			);
		}

		$queue->add_all( $data_to_enqueue );
	}

	/**
	 * Enqueue the action.
	 *
	 * @param string $current_filter Current WordPress filter.
	 * @param object $args Sync args.
	 * @param string $queue Sync queue.
	 */
	public function enqueue_action( $current_filter, $args, $queue ) {
		// don't enqueue an action during the outbound http request - this prevents recursion.
		if ( Settings::is_sending() ) {
			return;
		}

		if ( ! ( new Connection_Manager() )->is_connected() ) {
			// Don't enqueue an action if the site is disconnected.
			return;
		}

		// Skip enqueueing any Sync action when triggered by Jetpack CRM Woo Sync background job to avoid periodic noise.
		if (
			( function_exists( 'doing_action' ) && doing_action( 'jpcrm_woosync_sync' ) )
			|| defined( 'jpcrm_woosync_running' )
			|| defined( 'jpcrm_woosync_cron_running' )
		) {
			return;
		}

		// Skip enqueueing if current action is blacklisted.
		$sync_actions_blacklist = Settings::get_setting( 'sync_actions_blacklist' );
		if ( is_array( $sync_actions_blacklist ) && in_array( $current_filter, $sync_actions_blacklist, true ) ) {
			return;
		}

		/**
		 * Add an action hook to execute when anything on the whitelist gets sent to the queue to sync.
		 *
		 * @module sync
		 *
		 * @since 1.6.3
		 * @since-jetpack 5.9.0
		 */
		do_action( 'jetpack_sync_action_before_enqueue' );

		/**
		 * Modify or reject the data within an action before it is enqueued locally.
		 *
		 * @since 1.6.3
		 * @since-jetpack 4.2.0
		 *
		 * @param array The action parameters
		 */
		$args = apply_filters( "jetpack_sync_before_enqueue_$current_filter", $args );

		// allow listeners to abort.
		if ( false === $args ) {
			return;
		}

		/*
		 * Periodically check the size of the queue, and disable adding to it if
		 * it exceeds some limit AND the oldest item exceeds the age limit (i.e. sending has stopped).
		 */
		if ( ! $this->can_add_to_queue( $queue ) ) {
			if ( 'sync' === $queue->id ) {
				$this->sync_data_loss( $queue, $current_filter );
			}
			return;
		}

		/*
		 * If we add any items to the queue, we should try to ensure that our script
		 * can't be killed before they are sent.
		 */
		// https://plugins.trac.wordpress.org/ticket/2041
		if ( function_exists( 'ignore_user_abort' ) ) {
			ignore_user_abort( true );
		}

		if (
			'sync' === $queue->id ||
			in_array(
				$current_filter,
				array(
					'jetpack_full_sync_start',
					'jetpack_full_sync_end',
					'jetpack_full_sync_cancel',
				),
				true
			)
		) {
			$queue->add(
				array(
					$current_filter,
					$args,
					get_current_user_id(),
					microtime( true ),
					Settings::is_importing(),
					$this->get_actor( $current_filter, $args ),
				)
			);
		} else {
			$queue->add(
				array(
					$current_filter,
					$args,
					get_current_user_id(),
					microtime( true ),
					Settings::is_importing(),
				)
			);
		}

		// Track how many items have been added to this queue during this request and periodically
		// invalidate the in-memory queue-state cache so the size/lag estimate stays accurate.
		// Without this, a burst that fills the queue mid-request would keep passing can_add_to_queue
		// with a stale "queue is fine" result captured at the start of the request.
		$this->request_adds_count[ $queue->id ] = ( $this->request_adds_count[ $queue->id ] ?? 0 ) + 1;
		if ( $this->request_adds_count[ $queue->id ] >= self::REQUEST_STATE_CACHE_INVALIDATE_AFTER ) {
			unset( $this->request_queue_state_cache[ $queue->id ] );
			$this->request_adds_count[ $queue->id ] = 0;
		}

		// since we've added some items, let's try to load the sender so we can send them as quickly as possible.
		if ( ! Actions::$sender ) {
			add_filter( 'jetpack_sync_sender_should_load', __NAMESPACE__ . '\Actions::should_initialize_sender_enqueue', 10, 1 );
			if ( did_action( 'init' ) ) {
				Actions::add_sender_shutdown();
			}
		}
	}

	/**
	 * Sync Data Loss Handler
	 *
	 * Sends a single 'jetpack_sync_data_loss' action to WP.com with timestamp, queue_size, queue_lag and current_filter.
	 *
	 * @param Queue  $queue Sync queue.
	 * @param string $current_filter Name of action that triggered sync.
	 * @return boolean was send successful
	 */
	public function sync_data_loss( $queue, $current_filter = '' ) {
		if ( ! Settings::is_sync_enabled() ) {
			return;
		}
		$updated = Health::update_status( Health::STATUS_OUT_OF_SYNC );

		if ( ! $updated ) {
			return;
		}

		$data = array(
			'timestamp'  => microtime( true ),
			'queue_size' => $queue->size(),
			'queue_lag'  => $queue->lag(),
			'extra'      => array(
				'current_filter' => $current_filter,
			),
		);

		$sender = Sender::get_instance();
		return $sender->send_action( 'jetpack_sync_data_loss', $data );
	}

	/**
	 * Get the event's actor.
	 *
	 * @param string $current_filter Current wp-admin page.
	 * @param object $args Sync event.
	 * @return array Actor information.
	 */
	public function get_actor( $current_filter, $args ) {
		if ( 'wp_login' === $current_filter ) {
			$user = get_user_by( 'ID', $args[1]->data->ID );
		} else {
			$user = wp_get_current_user();
		}

		$roles           = new Roles();
		$translated_role = $roles->translate_user_to_role( $user );

		$actor = array(
			'wpcom_user_id'    => null,
			'external_user_id' => isset( $user->ID ) ? $user->ID : null,
			'display_name'     => isset( $user->display_name ) ? $user->display_name : null,
			'user_email'       => isset( $user->user_email ) ? $user->user_email : null,
			'user_roles'       => isset( $user->roles ) ? $user->roles : null,
			'translated_role'  => $translated_role ? $translated_role : null,
			'is_cron'          => defined( 'DOING_CRON' ) ? DOING_CRON : false,
			'is_rest'          => defined( 'REST_API_REQUEST' ) ? REST_API_REQUEST : false,
			'is_xmlrpc'        => defined( 'XMLRPC_REQUEST' ) ? XMLRPC_REQUEST : false,
			'is_wp_rest'       => defined( 'REST_REQUEST' ) ? REST_REQUEST : false,
			'is_ajax'          => defined( 'DOING_AJAX' ) ? DOING_AJAX : false,
			'is_wp_admin'      => is_admin(),
			'is_cli'           => defined( 'WP_CLI' ) ? WP_CLI : false,
			'from_url'         => $this->get_request_url(),
		);

		if ( $this->should_send_user_data_with_actor( $current_filter ) ) {
			$ip = IP_Utils::get_ip();

			$actor['ip']         = $ip ? $ip : '';
			$actor['user_agent'] = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : 'unknown';
		}

		$raw_mcp_header = '';
		if ( isset( $_SERVER['HTTP_X_WPCOM_MCP'] ) && is_string( $_SERVER['HTTP_X_WPCOM_MCP'] ) ) {
			$raw_mcp_header = trim( wp_unslash( $_SERVER['HTTP_X_WPCOM_MCP'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitization happens below.
		}

		if ( ! empty( $raw_mcp_header ) && preg_match( '/^[A-Za-z0-9+\/=]+$/', $raw_mcp_header ) ) {
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Decoding MCP header payload.
			$decoded = base64_decode( $raw_mcp_header, true );
			if ( false !== $decoded ) {
				$mcp_data = json_decode( $decoded, true );
				if ( is_array( $mcp_data ) ) {
					if ( isset( $mcp_data['mcp_client_name'] ) && is_string( $mcp_data['mcp_client_name'] ) ) {
						$actor['mcp_client_name'] = sanitize_text_field( $mcp_data['mcp_client_name'] );
					}
					if ( isset( $mcp_data['mcp_client_version'] ) && is_string( $mcp_data['mcp_client_version'] ) ) {
						$actor['mcp_client_version'] = sanitize_text_field( $mcp_data['mcp_client_version'] );
					}
					if ( ! empty( $actor['mcp_client_name'] ) || ! empty( $actor['mcp_client_version'] ) ) {
						$actor['is_mcp_agent'] = true;
					}
				}
			}
		}

		/**
		 * Filters the actor data attached to sync events.
		 *
		 * Actor data identifies who or what triggered a sync event (user info,
		 * request context, MCP client details, etc.) and is sent alongside every
		 * event to WordPress.com.
		 *
		 * @since 4.33.0
		 *
		 * @param array $actor Associative array of actor information.
		 */
		$actor = apply_filters( 'jetpack_sync_actor_data', $actor );

		// Ensure the filter returns a valid array.
		if ( ! is_array( $actor ) ) {
			$actor = array();
		}

		// Sanitize string values added via the filter.
		foreach ( $actor as $key => $value ) {
			if ( is_string( $value ) ) {
				$actor[ $key ] = sanitize_text_field( $value );
			}
		}

		return $actor;
	}

	/**
	 * Should user data be sent as the actor?
	 *
	 * @param string $current_filter The current WordPress filter being executed.
	 * @return bool
	 */
	public function should_send_user_data_with_actor( $current_filter ) {
		$should_send = in_array( $current_filter, array( 'jetpack_wp_login', 'wp_logout', 'jetpack_valid_failed_login_attempt' ), true );
		/**
		 * Allow or deny sending actor's user data ( IP and UA ) during a sync event
		 *
		 * @since 1.6.3
		 * @since-jetpack 5.8.0
		 *
		 * @module sync
		 *
		 * @param bool True if we should send user data
		 * @param string The current filter that is performing the sync action
		 */
		return apply_filters( 'jetpack_sync_actor_user_data', $should_send, $current_filter );
	}

	/**
	 * Sets Listener defaults.
	 */
	public function set_defaults() {
		$this->sync_queue      = new Queue( 'sync' );
		$this->full_sync_queue = new Queue( 'full_sync' );
		$this->set_queue_size_limit( Settings::get_setting( 'max_queue_size' ) );
		$this->set_queue_lag_limit( Settings::get_setting( 'max_queue_lag' ) );
	}

	/**
	 * Get the request URL.
	 *
	 * @return string Request URL, if known. Otherwise, wp-admin or home_url.
	 */
	public function get_request_url() {
		if ( isset( $_SERVER['HTTP_HOST'] ) && isset( $_SERVER['REQUEST_URI'] ) ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- False positive, sniff misses the call to esc_url_raw.
			return esc_url_raw( 'http' . ( isset( $_SERVER['HTTPS'] ) ? 's' : '' ) . '://' . wp_unslash( "{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}" ) );
		}
		return is_admin() ? get_admin_url( get_current_blog_id() ) : home_url();
	}
}
