<?php
require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';

/**
 * The role of this class is to hook the Sync subsystem into WordPress - when to listen for actions,
 * when to send, when to perform a full sync, etc.
 *
 * It also binds the action to send data to WPCOM to Jetpack's XMLRPC client object.
 */
class Jetpack_Sync_Actions {
	static $sender = null;
	static $listener = null;
	const INITIAL_SYNC_MULTISITE_INTERVAL = 10;

	static function init() {

		// Add a custom "every minute" cron schedule
		add_filter( 'cron_schedules', array( __CLASS__, 'minute_cron_schedule' ) );

		// On jetpack authorization, schedule a full sync
		add_action( 'jetpack_client_authorized', array( __CLASS__, 'schedule_full_sync' ), 10, 0 );

		// When importing via cron, do not sync
		add_action( 'wp_cron_importer_hook', array( __CLASS__, 'set_is_importing_true' ), 1 );

		// Sync connected user role changes to .com
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-users.php';

		// everything below this point should only happen if we're a valid sync site
		if ( ! self::sync_allowed() ) {
			return;
		}

		// publicize filter to prevent publicizing blacklisted post types
		add_filter( 'publicize_should_publicize_published_post', array( __CLASS__, 'prevent_publicize_blacklisted_posts' ), 10, 2 );

		// cron hooks
		add_action( 'jetpack_sync_full', array( __CLASS__, 'do_full_sync' ), 10, 1 );
		add_action( 'jetpack_sync_cron', array( __CLASS__, 'do_cron_sync' ) );

		if ( ! wp_next_scheduled( 'jetpack_sync_cron' ) ) {
			// Schedule a job to send pending queue items once a minute
			wp_schedule_event( time(), '1min', 'jetpack_sync_cron' );
		}

		/**
		 * Fires on every request before default loading sync listener code.
		 * Return false to not load sync listener code that monitors common
		 * WP actions to be serialized.
		 *
		 * By default this returns true for cron jobs, non-GET-requests, or requests where the
		 * user is logged-in.
		 *
		 * @since 4.2.0
		 *
		 * @param bool should we load sync listener code for this request
		 */
		if ( apply_filters( 'jetpack_sync_listener_should_load',
			(
				( isset( $_SERVER["REQUEST_METHOD"] ) && 'GET' !== $_SERVER['REQUEST_METHOD'] )
				||
				is_user_logged_in()
				||
				defined( 'PHPUNIT_JETPACK_TESTSUITE' )
				||
				defined( 'DOING_CRON' ) && DOING_CRON
			)
		) ) {
			self::initialize_listener();
		}

		/**
		 * Fires on every request before default loading sync sender code.
		 * Return false to not load sync sender code that serializes pending
		 * data and sends it to WPCOM for processing.
		 *
		 * By default this returns true for cron jobs, POST requests, admin requests, or requests
		 * by users who can manage_options.
		 *
		 * @since 4.2.0
		 *
		 * @param bool should we load sync sender code for this request
		 */
		if ( apply_filters( 'jetpack_sync_sender_should_load',
			(
				( isset( $_SERVER["REQUEST_METHOD"] ) && 'POST' === $_SERVER['REQUEST_METHOD'] )
				||
				current_user_can( 'manage_options' )
				||
				is_admin()
				||
				defined( 'PHPUNIT_JETPACK_TESTSUITE' )
				||
				defined( 'DOING_CRON' ) && DOING_CRON
			)
		) ) {
			self::initialize_sender();
			add_action( 'shutdown', array( self::$sender, 'do_sync' ) );
		}

	}

	static function sync_allowed() {
		return ( ! Jetpack_Sync_Settings::get_setting( 'disable' ) && Jetpack::is_active() && ! ( Jetpack::is_development_mode() || Jetpack::is_staging_site() ) )
			   || defined( 'PHPUNIT_JETPACK_TESTSUITE' );
	}

	static function prevent_publicize_blacklisted_posts( $should_publicize, $post ) {
		if ( in_array( $post->post_type, Jetpack_Sync_Settings::get_setting( 'post_types_blacklist' ) ) ) {
			return false;
		}

		return $should_publicize;
	}

	static function set_is_importing_true() {
		Jetpack_Sync_Settings::set_importing( true );
	}

	static function send_data( $data, $codec_name, $sent_timestamp, $queue_id ) {
		Jetpack::load_xml_rpc_client();

		$url = add_query_arg( array(
			'sync'      => '1', // add an extra parameter to the URL so we can tell it's a sync action
			'codec'     => $codec_name, // send the name of the codec used to encode the data
			'timestamp' => $sent_timestamp, // send current server time so we can compensate for clock differences
			'queue'     => $queue_id, // sync or full_sync
		), Jetpack::xmlrpc_api_url() );

		$rpc = new Jetpack_IXR_Client( array(
			'url'     => $url,
			'user_id' => JETPACK_MASTER_USER,
			'timeout' => 30,
		) );

		$result = $rpc->query( 'jetpack.syncActions', $data );

		if ( ! $result ) {
			return $rpc->get_jetpack_error();
		}

		return $rpc->getResponse();
	}

	static function schedule_initial_sync( $new_version = null, $old_version = null ) {
		$initial_sync_config = array(
			'options' => true,
			'network_options' => true,
			'functions' => true,
			'constants' => true,
		);

		if ( $old_version && ( version_compare( $old_version, '4.2', '<' ) ) ) {
			$initial_sync_config['users'] = 'initial';
		}

		// we need this function call here because we have to run this function
		// reeeeally early in init, before WP_CRON_LOCK_TIMEOUT is defined.
		wp_functionality_constants();

		if ( is_multisite() ) {
			// stagger initial syncs for multisite blogs so they don't all pile on top of each other
			$time_offset = ( rand() / getrandmax() ) * self::INITIAL_SYNC_MULTISITE_INTERVAL * get_blog_count();
		} else {
			$time_offset = 1;
		}

		self::schedule_full_sync(
			$initial_sync_config,
			$time_offset
		);
	}

	static function schedule_full_sync( $modules = null, $time_offset = 1 ) {
		if ( ! self::sync_allowed() ) {
			return false;
		}

		if ( self::is_scheduled_full_sync() ) {
			self::unschedule_all_full_syncs();
		}

		if ( $modules ) {
			wp_schedule_single_event( time() + $time_offset, 'jetpack_sync_full', array( $modules ) );
		} else {
			wp_schedule_single_event( time() + $time_offset, 'jetpack_sync_full' );
		}

		if ( $time_offset === 1 ) {
			spawn_cron();
		}

		return true;
	}

	static function unschedule_all_full_syncs() {
		foreach ( _get_cron_array() as $timestamp => $cron ) {
			if ( ! empty( $cron['jetpack_sync_full'] ) ) {
				foreach( $cron['jetpack_sync_full'] as $key => $config ) {
					wp_unschedule_event( $timestamp, 'jetpack_sync_full', $config['args'] );
				}
			}
		}
	}

	static function is_scheduled_full_sync( $modules = null ) {
		if ( is_null( $modules ) ) {
			$crons = _get_cron_array();

			foreach ( $crons as $timestamp => $cron ) {
				if ( ! empty( $cron['jetpack_sync_full'] ) ) {
					return true;
				}
			}
			return false;
		}

		return !! wp_next_scheduled( 'jetpack_sync_full', array( $modules ) );
	}

	static function do_full_sync( $modules = null ) {
		if ( ! self::sync_allowed() ) {
			return;
		}

		self::initialize_listener();
		Jetpack_Sync_Modules::get_module( 'full-sync' )->start( $modules );
		self::do_cron_sync(); // immediately run a cron sync, which sends pending data
	}

	static function minute_cron_schedule( $schedules ) {
		if( ! isset( $schedules["1min"] ) ) {
			$schedules["1min"] = array(
				'interval' => 60,
				'display' => __( 'Every minute' )
			);
		}
		return $schedules;
	}

	// try to send actions until we run out of things to send,
	// or have to wait more than 15s before sending again,
	// or we hit a lock or some other sending issue
	static function do_cron_sync() {
		if ( ! self::sync_allowed() ) {
			return;
		}

		self::initialize_sender();

		// remove shutdown hook - no need to sync twice
		if ( has_action( 'shutdown', array( self::$sender, 'do_sync' ) ) ) {
			remove_action( 'shutdown', array( self::$sender, 'do_sync' ) );
		}

		do {
			$next_sync_time = self::$sender->get_next_sync_time();

			if ( $next_sync_time ) {
				$delay = $next_sync_time - time() + 1;
				if ( $delay > 15 ) {
					break;
				} elseif ( $delay > 0 ) {
					sleep( $delay );
				}
			}

			$result = self::$sender->do_sync();
		} while ( $result );
	}

	static function initialize_listener() {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-listener.php';
		self::$listener = Jetpack_Sync_Listener::get_instance();
	}

	static function initialize_sender() {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-sender.php';
		self::$sender = Jetpack_Sync_Sender::get_instance();

		// bind the sending process
		add_filter( 'jetpack_sync_send_data', array( __CLASS__, 'send_data' ), 10, 4 );
	}
}

// Allow other plugins to add filters before we initialize the actions.
// Load the listeners if before modules get loaded so that we can capture version changes etc.
add_action( 'init', array( 'Jetpack_Sync_Actions', 'init' ), 90 );

// We need to define this here so that it's hooked before `updating_jetpack_version` is called
add_action( 'updating_jetpack_version', array( 'Jetpack_Sync_Actions', 'schedule_initial_sync' ), 10, 2 );
