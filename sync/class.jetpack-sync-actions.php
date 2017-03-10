<?php

/**
 * The role of this class is to hook the Sync subsystem into WordPress - when to listen for actions,
 * when to send, when to perform a full sync, etc.
 *
 * It also binds the action to send data to WPCOM to Jetpack's XMLRPC client object.
 */
class Jetpack_Sync_Actions {
	static $sender = null;
	static $listener = null;
	const DEFAULT_SYNC_CRON_INTERVAL_NAME = 'jetpack_sync_interval';
	const DEFAULT_SYNC_CRON_INTERVAL_VALUE = 300; // 5 * MINUTE_IN_SECONDS;

	static function init() {

		// everything below this point should only happen if we're a valid sync site
		if ( ! self::sync_allowed() ) {
			return;
		}

		if ( self::sync_via_cron_allowed() ) {
			self::init_sync_cron_jobs();
		} else if ( wp_next_scheduled( 'jetpack_sync_cron' ) ) {
			self::clear_sync_cron_jobs();
		}

		// On jetpack authorization, schedule a full sync
		add_action( 'jetpack_client_authorized', array( __CLASS__, 'do_full_sync' ), 10, 0 );

		// When importing via cron, do not sync
		add_action( 'wp_cron_importer_hook', array( __CLASS__, 'set_is_importing_true' ), 1 );

		// Sync connected user role changes to .com
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-users.php';

		// publicize filter to prevent publicizing blacklisted post types
		add_filter( 'publicize_should_publicize_published_post', array( __CLASS__, 'prevent_publicize_blacklisted_posts' ), 10, 2 );

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
		if ( apply_filters( 'jetpack_sync_listener_should_load', true ) ) {
			self::initialize_listener();
		}

		add_action( 'init', array( __CLASS__, 'add_sender_shutdown' ), 90 );

	}

	static function add_sender_shutdown() {
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
			)
		) ) {
			self::initialize_sender();
			add_action( 'shutdown', array( self::$sender, 'do_sync' ) );
			add_action( 'shutdown', array( self::$sender, 'do_full_sync' ) );
		}
	}

	static function sync_allowed() {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';
		return ( ! Jetpack_Sync_Settings::get_setting( 'disable' ) && Jetpack::is_active() && ! ( Jetpack::is_development_mode() || Jetpack::is_staging_site() ) )
			   || defined( 'PHPUNIT_JETPACK_TESTSUITE' );
	}

	static function sync_via_cron_allowed() {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';
		return ( Jetpack_Sync_Settings::get_setting( 'sync_via_cron' ) );
	}

	static function prevent_publicize_blacklisted_posts( $should_publicize, $post ) {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';
		if ( in_array( $post->post_type, Jetpack_Sync_Settings::get_setting( 'post_types_blacklist' ) ) ) {
			return false;
		}

		return $should_publicize;
	}

	static function set_is_importing_true() {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';
		Jetpack_Sync_Settings::set_importing( true );
	}

	static function send_data( $data, $codec_name, $sent_timestamp, $queue_id, $checkout_duration, $preprocess_duration ) {
		Jetpack::load_xml_rpc_client();

		$query_args = array(
			'sync'      => '1',             // add an extra parameter to the URL so we can tell it's a sync action
			'codec'     => $codec_name,     // send the name of the codec used to encode the data
			'timestamp' => $sent_timestamp, // send current server time so we can compensate for clock differences
			'queue'     => $queue_id,       // sync or full_sync
			'home'      => get_home_url(),  // Send home url option to check for Identity Crisis server-side
			'siteurl'   => get_site_url(),  // Send siteurl option to check for Identity Crisis server-side
			'cd'        => sprintf( '%.4f', $checkout_duration),   // Time spent retrieving queue items from the DB
			'pd'        => sprintf( '%.4f', $preprocess_duration), // Time spent converting queue items into data to send
		);

		// Has the site opted in to IDC mitigation?
		if ( Jetpack::sync_idc_optin() ) {
			$query_args['idc'] = true;
		}

		if ( Jetpack_Options::get_option( 'migrate_for_idc', false ) ) {
			$query_args['migrate_for_idc'] = true;
		}

		$query_args['timeout'] = Jetpack_Sync_Settings::is_doing_cron() ? 30 : 15;

		/**
		 * Filters query parameters appended to the Sync request URL sent to WordPress.com.
		 *
		 * @since 4.7.0
		 *
		 * @param array $query_args associative array of query parameters.
		 */
		$query_args = apply_filters( 'jetpack_sync_send_data_query_args', $query_args );

		$url = add_query_arg( $query_args, Jetpack::xmlrpc_api_url() );

		$rpc = new Jetpack_IXR_Client( array(
			'url'     => $url,
			'user_id' => JETPACK_MASTER_USER,
			'timeout' => $query_args['timeout'],
		) );

		$result = $rpc->query( 'jetpack.syncActions', $data );

		if ( ! $result ) {
			return $rpc->get_jetpack_error();
		}

		$response = $rpc->getResponse();

		// Check if WordPress.com IDC mitigation blocked the sync request
		if ( is_array( $response ) && isset( $response['error_code'] ) ) {
			$error_code = $response['error_code'];
			$allowed_idc_error_codes = array(
				'jetpack_url_mismatch',
				'jetpack_home_url_mismatch',
				'jetpack_site_url_mismatch'
			);

			if ( in_array( $error_code, $allowed_idc_error_codes ) ) {
				Jetpack_Options::update_option(
					'sync_error_idc',
					Jetpack::get_sync_error_idc_option( $response )
				);
			}

			return new WP_Error(
				'sync_error_idc',
				esc_html__( 'Sync has been blocked from WordPress.com because it would cause an identity crisis', 'jetpack' )
			);
		}

		return $response;
	}

	static function do_initial_sync( $new_version = null, $old_version = null ) {
		if ( ! empty( $old_version ) && version_compare( $old_version, '4.2', '>=' ) ) {
			return;
		}

		$initial_sync_config = array(
			'options'         => true,
			'network_options' => true,
			'functions'       => true,
			'constants'       => true,
			'users'           => 'initial',
		);

		self::do_full_sync( $initial_sync_config );
	}

	static function do_full_sync( $modules = null ) {
		if ( ! self::sync_allowed() ) {
			return false;
		}

		self::initialize_listener();
		Jetpack_Sync_Modules::get_module( 'full-sync' )->start( $modules );

		return true;
	}

	static function jetpack_cron_schedule( $schedules ) {
		if ( ! isset( $schedules[ self::DEFAULT_SYNC_CRON_INTERVAL_NAME ] ) ) {
			$schedules[ self::DEFAULT_SYNC_CRON_INTERVAL_NAME ] = array(
				'interval' => self::DEFAULT_SYNC_CRON_INTERVAL_VALUE,
				'display' => sprintf(
					esc_html( _n( 'Every minute', 'Every %d minutes', intval( self::DEFAULT_SYNC_CRON_INTERVAL_VALUE / 60 ), 'jetpack' ) ),
					intval( self::DEFAULT_SYNC_CRON_INTERVAL_VALUE / 60 )
				)
			);
		}
		return $schedules;
	}

	static function do_cron_sync() {
		self::do_cron_sync_by_type( 'sync' );
	}

	static function do_cron_full_sync() {
		self::do_cron_sync_by_type( 'full_sync' );
	}

	/**
	 * Try to send actions until we run out of things to send,
	 * or have to wait more than 15s before sending again,
	 * or we hit a lock or some other sending issue
	 *
	 * @param string $type Sync type. Can be `sync` or `full_sync`.
	 */
	static function do_cron_sync_by_type( $type ) {
		if ( ! self::sync_allowed() || ( 'sync' !== $type && 'full_sync' !== $type ) ) {
			return;
		}

		self::initialize_sender();

		$time_limit = Jetpack_Sync_Settings::get_setting( 'cron_sync_time_limit' );
		$start_time = time();

		do {
			$next_sync_time = self::$sender->get_next_sync_time( $type );

			if ( $next_sync_time ) {
				$delay = $next_sync_time - time() + 1;
				if ( $delay > 15 ) {
					break;
				} elseif ( $delay > 0 ) {
					sleep( $delay );
				}
			}

			$result = 'full_sync' === $type ? self::$sender->do_full_sync() : self::$sender->do_sync();
		} while ( $result && ( $start_time + $time_limit ) > time() );
	}

	static function initialize_listener() {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-listener.php';
		self::$listener = Jetpack_Sync_Listener::get_instance();
	}

	static function initialize_sender() {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-sender.php';
		self::$sender = Jetpack_Sync_Sender::get_instance();

		// bind the sending process
		add_filter( 'jetpack_sync_send_data', array( __CLASS__, 'send_data' ), 10, 6 );
	}

	static function initialize_woocommerce() {
		if ( false === class_exists( 'WooCommerce' ) ) {
			return;
		}
		add_filter( 'jetpack_sync_modules', array( 'Jetpack_Sync_Actions', 'add_woocommerce_sync_module' ) );
	}

	static function add_woocommerce_sync_module( $sync_modules ) {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-module-woocommerce.php';
		$sync_modules[] = 'Jetpack_Sync_Module_WooCommerce';
		return $sync_modules;
	}

	static function initialize_wp_super_cache() {
		if ( false === function_exists( 'wp_cache_is_enabled' ) ) {
			return;
		}
		add_filter( 'jetpack_sync_modules', array( 'Jetpack_Sync_Actions', 'add_wp_super_cache_sync_module' ) );
	}

	static function add_wp_super_cache_sync_module( $sync_modules ) {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-module-wp-super-cache.php';
		$sync_modules[] = 'Jetpack_Sync_Module_WP_Super_Cache';
		return $sync_modules;
	}

	static function sanitize_filtered_sync_cron_schedule( $schedule ) {
		$schedule = sanitize_key( $schedule );
		$schedules = wp_get_schedules();

		// Make sure that the schedule has actually been registered using the `cron_intervals` filter.
		if ( isset( $schedules[ $schedule ] ) ) {
			return $schedule;
		}

		return self::DEFAULT_SYNC_CRON_INTERVAL_NAME;
	}

	static function get_start_time_offset( $schedule = '', $hook = '' ) {
		$start_time_offset =  is_multisite()
			? mt_rand( 0, ( 2 * self::DEFAULT_SYNC_CRON_INTERVAL_VALUE ) )
			: 0;

		/**
		 * Allows overriding the offset that the sync cron jobs will first run. This can be useful when scheduling
		 * cron jobs across multiple sites in a network.
		 *
		 * @since 4.5
		 *
		 * @param int    $start_time_offset
		 * @param string $hook
		 * @param string $schedule
		 */
		return intval( apply_filters(
			'jetpack_sync_cron_start_time_offset',
			$start_time_offset,
			$hook,
			$schedule
		) );
	}

	static function maybe_schedule_sync_cron( $schedule, $hook ) {
		if ( ! $hook ) {
			return;
		}
		$schedule = self::sanitize_filtered_sync_cron_schedule( $schedule );

		$start_time = time() + self::get_start_time_offset( $schedule, $hook );
		if ( ! wp_next_scheduled( $hook ) ) {
			// Schedule a job to send pending queue items once a minute
			wp_schedule_event( $start_time, $schedule, $hook );
		} else if ( $schedule != wp_get_schedule( $hook ) ) {
			// If the schedule has changed, update the schedule
			wp_clear_scheduled_hook( $hook );
			wp_schedule_event( $start_time, $schedule, $hook );
		}
	}

	static function clear_sync_cron_jobs() {
		wp_clear_scheduled_hook( 'jetpack_sync_cron' );
		wp_clear_scheduled_hook( 'jetpack_sync_full_cron' );
	}

	static function init_sync_cron_jobs() {
		add_filter( 'cron_schedules', array( __CLASS__, 'jetpack_cron_schedule' ) );

		add_action( 'jetpack_sync_cron', array( __CLASS__, 'do_cron_sync' ) );
		add_action( 'jetpack_sync_full_cron', array( __CLASS__, 'do_cron_full_sync' ) );

		/**
		 * Allows overriding of the default incremental sync cron schedule which defaults to once every 5 minutes.
		 *
		 * @since 4.3.2
		 *
		 * @param string self::DEFAULT_SYNC_CRON_INTERVAL_NAME
		 */
		$incremental_sync_cron_schedule = apply_filters( 'jetpack_sync_incremental_sync_interval', self::DEFAULT_SYNC_CRON_INTERVAL_NAME );
		self::maybe_schedule_sync_cron( $incremental_sync_cron_schedule, 'jetpack_sync_cron' );

		/**
		 * Allows overriding of the full sync cron schedule which defaults to once every 5 minutes.
		 *
		 * @since 4.3.2
		 *
		 * @param string self::DEFAULT_SYNC_CRON_INTERVAL_NAME
		 */
		$full_sync_cron_schedule = apply_filters( 'jetpack_sync_full_sync_interval', self::DEFAULT_SYNC_CRON_INTERVAL_NAME );
		self::maybe_schedule_sync_cron( $full_sync_cron_schedule, 'jetpack_sync_full_cron' );
	}

	static function cleanup_on_upgrade( $new_version = null, $old_version = null ) {
		if ( wp_next_scheduled( 'jetpack_sync_send_db_checksum' ) ) {
			wp_clear_scheduled_hook( 'jetpack_sync_send_db_checksum' );
		}

		$is_new_sync_upgrade = version_compare( $old_version, '4.2', '>=' );
		if ( ! empty( $old_version ) && $is_new_sync_upgrade && version_compare( $old_version, '4.5', '<' ) ) {
			require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';
			self::clear_sync_cron_jobs();
			Jetpack_Sync_Settings::update_settings( array(
				'render_filtered_content' => Jetpack_Sync_Defaults::$default_render_filtered_content
			) );
		}
	}

	static function get_sync_status() {
		self::initialize_sender();

		$sync_module = Jetpack_Sync_Modules::get_module( 'full-sync' );
		$queue       = self::$sender->get_sync_queue();
		$full_queue  = self::$sender->get_full_sync_queue();
		$cron_timestamps = array_keys( _get_cron_array() );
		$next_cron = $cron_timestamps[0] - time();

		return array_merge(
			$sync_module->get_status(),
			array(
				'cron_size'             => count( $cron_timestamps ),
				'next_cron'             => $next_cron,
				'queue_size'            => $queue->size(),
				'queue_lag'             => $queue->lag(),
				'queue_next_sync'       => ( self::$sender->get_next_sync_time( 'sync' ) - microtime( true ) ),
				'full_queue_size'       => $full_queue->size(),
				'full_queue_lag'        => $full_queue->lag(),
				'full_queue_next_sync'  => ( self::$sender->get_next_sync_time( 'full_sync' ) - microtime( true ) ),
			)
		);
	}
}

// Check for WooCommerce support
add_action( 'plugins_loaded', array( 'Jetpack_Sync_Actions', 'initialize_woocommerce' ), 5 );

// Check for WP Super Cache
add_action( 'plugins_loaded', array( 'Jetpack_Sync_Actions', 'initialize_wp_super_cache' ), 5 );

/*
 * Init after plugins loaded and before the `init` action. This helps with issues where plugins init
 * with a high priority or sites that use alternate cron.
 */
add_action( 'plugins_loaded', array( 'Jetpack_Sync_Actions', 'init' ), 90 );



// We need to define this here so that it's hooked before `updating_jetpack_version` is called
add_action( 'updating_jetpack_version', array( 'Jetpack_Sync_Actions', 'do_initial_sync' ), 10, 2 );
add_action( 'updating_jetpack_version', array( 'Jetpack_Sync_Actions', 'cleanup_on_upgrade' ), 10, 2 );
