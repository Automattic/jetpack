<?php
namespace Automattic\Jetpack;

/**
 * The role of this class is to hook the Sync subsystem into WordPress - when to listen for actions,
 * when to send, when to perform a full sync, etc.
 *
 * It also binds the action to send data to WPCOM to Jetpack's XMLRPC client object.
 */
class Sync {
	public $sender                         = null;
	public $listener                       = null;
	const DEFAULT_SYNC_CRON_INTERVAL_NAME  = 'jetpack_sync_interval';
	const DEFAULT_SYNC_CRON_INTERVAL_VALUE = 300; // 5 * MINUTE_IN_SECONDS;

	function __construct() {
		// Check for WooCommerce support.
		add_action( 'plugins_loaded', array( $this, 'initialize_woocommerce' ), 5 );

		// Check for WP Super Cache.
		add_action( 'plugins_loaded', array( $this, 'initialize_wp_super_cache' ), 5 );

		// We need to define this here so that it's hooked before `updating_jetpack_version` is called.
		add_action( 'updating_jetpack_version', array( $this, 'cleanup_on_upgrade' ), 10, 2 );
		add_action( 'jetpack_user_authorized', array( $this, 'do_initial_sync' ), 10, 0 );

		add_action( 'plugins_loaded', array( $this, 'init' ), 90 );

		add_action( 'jetpack_sync_action_enqueued', array( $this, 'add_sender_shutdown' ) );
	}

	function init() {
		// everything below this point should only happen if we're a valid sync site
		if ( ! $this->sync_allowed() ) {
			return;
		}

		if ( $this->sync_via_cron_allowed() ) {
			$this->init_sync_cron_jobs();
		} elseif ( wp_next_scheduled( 'jetpack_sync_cron' ) ) {
			$this->clear_sync_cron_jobs();
		}
		// When importing via cron, do not sync
		add_action( 'wp_cron_importer_hook', array( $this, 'set_is_importing_true' ), 1 );

		// Sync connected user role changes to .com
		\Jetpack_Sync_Users::init();

		// publicize filter to prevent publicizing blacklisted post types
		add_filter( 'publicize_should_publicize_published_post', array( $this, 'prevent_publicize_blacklisted_posts' ), 10, 2 );

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
			$this->initialize_listener();
		}

		add_action( 'init', array( $this, 'add_sender_shutdown' ), 90 );
	}

	function add_sender_shutdown() {
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
		if ( apply_filters(
			'jetpack_sync_sender_should_load',
			$this->should_initialize_sender()
		) ) {
			$this->initialize_sender();
			add_action( 'shutdown', array( $this->sender, 'do_sync' ) );
			add_action( 'shutdown', array( $this->sender, 'do_full_sync' ) );
		}
	}

	function should_initialize_sender() {
		if ( Constants::is_true( 'DOING_CRON' ) ) {
			return $this->sync_via_cron_allowed();
		}

		if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === $_SERVER['REQUEST_METHOD'] ) {
			return true;
		}

		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		if ( is_admin() ) {
			return true;
		}

		if ( defined( 'PHPUNIT_JETPACK_TESTSUITE' ) ) {
			return true;
		}

		return false;
	}

	function sync_allowed() {
		if ( defined( 'PHPUNIT_JETPACK_TESTSUITE' ) ) {
			return true;
		}
		if ( ! \Jetpack_Sync_Settings::is_sync_enabled() ) {
			return false;
		}
		if ( \Jetpack::is_development_mode() ) {
			return false;
		}
		if ( \Jetpack::is_staging_site() ) {
			return false;
		}
		if ( ! \Jetpack::is_active() ) {
			if ( ! doing_action( 'jetpack_user_authorized' ) ) {
				return false;
			}
		}

		return true;
	}

	function sync_via_cron_allowed() {
		return ( \Jetpack_Sync_Settings::get_setting( 'sync_via_cron' ) );
	}

	function prevent_publicize_blacklisted_posts( $should_publicize, $post ) {
		if ( in_array( $post->post_type, \Jetpack_Sync_Settings::get_setting( 'post_types_blacklist' ) ) ) {
			return false;
		}

		return $should_publicize;
	}

	function set_is_importing_true() {
		\Jetpack_Sync_Settings::set_importing( true );
	}

	function send_data( $data, $codec_name, $sent_timestamp, $queue_id, $checkout_duration, $preprocess_duration ) {
		\Jetpack::load_xml_rpc_client();

		$query_args = array(
			'sync'      => '1',             // add an extra parameter to the URL so we can tell it's a sync action
			'codec'     => $codec_name,     // send the name of the codec used to encode the data
			'timestamp' => $sent_timestamp, // send current server time so we can compensate for clock differences
			'queue'     => $queue_id,       // sync or full_sync
			'home'      => \Jetpack_Sync_Functions::home_url(),  // Send home url option to check for Identity Crisis server-side
			'siteurl'   => \Jetpack_Sync_Functions::site_url(),  // Send siteurl option to check for Identity Crisis server-side
			'cd'        => sprintf( '%.4f', $checkout_duration ),   // Time spent retrieving queue items from the DB
			'pd'        => sprintf( '%.4f', $preprocess_duration ), // Time spent converting queue items into data to send
		);

		// Has the site opted in to IDC mitigation?
		if ( \Jetpack::sync_idc_optin() ) {
			$query_args['idc'] = true;
		}

		if ( \Jetpack_Options::get_option( 'migrate_for_idc', false ) ) {
			$query_args['migrate_for_idc'] = true;
		}

		$query_args['timeout'] = \Jetpack_Sync_Settings::is_doing_cron() ? 30 : 15;

		/**
		 * Filters query parameters appended to the Sync request URL sent to WordPress.com.
		 *
		 * @since 4.7.0
		 *
		 * @param array $query_args associative array of query parameters.
		 */
		$query_args = apply_filters( 'jetpack_sync_send_data_query_args', $query_args );

		$url = add_query_arg( $query_args, \Jetpack::xmlrpc_api_url() );

		$rpc = new \Jetpack_IXR_Client(
			array(
				'url'     => $url,
				'user_id' => JETPACK_MASTER_USER,
				'timeout' => $query_args['timeout'],
			)
		);

		$result = $rpc->query( 'jetpack.syncActions', $data );

		if ( ! $result ) {
			return $rpc->get_jetpack_error();
		}

		$response = $rpc->getResponse();

		// Check if WordPress.com IDC mitigation blocked the sync request
		if ( is_array( $response ) && isset( $response['error_code'] ) ) {
			$error_code              = $response['error_code'];
			$allowed_idc_error_codes = array(
				'jetpack_url_mismatch',
				'jetpack_home_url_mismatch',
				'jetpack_site_url_mismatch',
			);

			if ( in_array( $error_code, $allowed_idc_error_codes ) ) {
				\Jetpack_Options::update_option(
					'sync_error_idc',
					\Jetpack::get_sync_error_idc_option( $response )
				);
			}

			return new WP_Error(
				'sync_error_idc',
				esc_html__( 'Sync has been blocked from WordPress.com because it would cause an identity crisis', 'jetpack' )
			);
		}

		return $response;
	}

	function do_initial_sync() {
		// Lets not sync if we are not suppose to.
		if ( ! $this->sync_allowed() ) {
			return false;
		}

		$initial_sync_config = array(
			'options'   => true,
			'functions' => true,
			'constants' => true,
			'users'     => array( get_current_user_id() ),
		);

		if ( is_multisite() ) {
			$initial_sync_config['network_options'] = true;
		}

		$this->do_full_sync( $initial_sync_config );
	}

	function do_full_sync( $modules = null ) {
		if ( ! $this->sync_allowed() ) {
			return false;
		}

		$full_sync_module = \Jetpack_Sync_Modules::get_module( 'full-sync' );

		if ( ! $full_sync_module ) {
			return false;
		}

		$this->initialize_listener();

		$full_sync_module->start( $modules );

		return true;
	}

	function jetpack_cron_schedule( $schedules ) {
		if ( ! isset( $schedules[ $this::DEFAULT_SYNC_CRON_INTERVAL_NAME ] ) ) {
			$schedules[ $this::DEFAULT_SYNC_CRON_INTERVAL_NAME ] = array(
				'interval' => $this::DEFAULT_SYNC_CRON_INTERVAL_VALUE,
				'display'  => sprintf(
					esc_html( _n( 'Every minute', 'Every %d minutes', intval( $this::DEFAULT_SYNC_CRON_INTERVAL_VALUE / 60 ), 'jetpack' ) ),
					intval( $this::DEFAULT_SYNC_CRON_INTERVAL_VALUE / 60 )
				),
			);
		}
		return $schedules;
	}

	function do_cron_sync() {
		$this->do_cron_sync_by_type( 'sync' );
	}

	function do_cron_full_sync() {
		$this->do_cron_sync_by_type( 'full_sync' );
	}

	/**
	 * Try to send actions until we run out of things to send,
	 * or have to wait more than 15s before sending again,
	 * or we hit a lock or some other sending issue
	 *
	 * @param string $type Sync type. Can be `sync` or `full_sync`.
	 */
	function do_cron_sync_by_type( $type ) {
		if ( ! $this->sync_allowed() || ( 'sync' !== $type && 'full_sync' !== $type ) ) {
			return;
		}

		$this->initialize_sender();

		$time_limit = \Jetpack_Sync_Settings::get_setting( 'cron_sync_time_limit' );
		$start_time = time();

		do {
			$next_sync_time = $this->sender->get_next_sync_time( $type );

			if ( $next_sync_time ) {
				$delay = $next_sync_time - time() + 1;
				if ( $delay > 15 ) {
					break;
				} elseif ( $delay > 0 ) {
					sleep( $delay );
				}
			}

			$result = 'full_sync' === $type ? $this->sender->do_full_sync() : $this->sender->do_sync();
		} while ( $result && ! is_wp_error( $result ) && ( $start_time + $time_limit ) > time() );
	}

	function initialize_listener() {
		$this->listener = new \Jetpack_Sync_Listener( $this );
	}

	function initialize_sender() {
		$this->sender = \Jetpack_Sync_Sender::get_instance();

		// bind the sending process
		add_filter( 'jetpack_sync_send_data', array( $this, 'send_data' ), 10, 6 );
	}

	function initialize_woocommerce() {
		if ( false === class_exists( 'WooCommerce' ) ) {
			return;
		}
		add_filter( 'jetpack_sync_modules', array( $this, 'add_woocommerce_sync_module' ) );
	}

	function add_woocommerce_sync_module( $sync_modules ) {
		$sync_modules[] = 'Jetpack_Sync_Module_WooCommerce';
		return $sync_modules;
	}

	function initialize_wp_super_cache() {
		if ( false === function_exists( 'wp_cache_is_enabled' ) ) {
			return;
		}
		add_filter( 'jetpack_sync_modules', array( $this, 'add_wp_super_cache_sync_module' ) );
	}

	function add_wp_super_cache_sync_module( $sync_modules ) {
		$sync_modules[] = 'Jetpack_Sync_Module_WP_Super_Cache';
		return $sync_modules;
	}

	function sanitize_filtered_sync_cron_schedule( $schedule ) {
		$schedule  = sanitize_key( $schedule );
		$schedules = wp_get_schedules();

		// Make sure that the schedule has actually been registered using the `cron_intervals` filter.
		if ( isset( $schedules[ $schedule ] ) ) {
			return $schedule;
		}

		return $this->DEFAULT_SYNC_CRON_INTERVAL_NAME;
	}

	function get_start_time_offset( $schedule = '', $hook = '' ) {
		$start_time_offset = is_multisite()
			? mt_rand( 0, ( 2 * $this->DEFAULT_SYNC_CRON_INTERVAL_VALUE ) )
			: 0;

		/**
		 * Allows overriding the offset that the sync cron jobs will first run. This can be useful when scheduling
		 * cron jobs across multiple sites in a network.
		 *
		 * @since 4.5.0
		 *
		 * @param int    $start_time_offset
		 * @param string $hook
		 * @param string $schedule
		 */
		return intval(
			apply_filters(
				'jetpack_sync_cron_start_time_offset',
				$start_time_offset,
				$hook,
				$schedule
			)
		);
	}

	function maybe_schedule_sync_cron( $schedule, $hook ) {
		if ( ! $hook ) {
			return;
		}
		$schedule = $this->sanitize_filtered_sync_cron_schedule( $schedule );

		$start_time = time() + $this->get_start_time_offset( $schedule, $hook );
		if ( ! wp_next_scheduled( $hook ) ) {
			// Schedule a job to send pending queue items once a minute
			wp_schedule_event( $start_time, $schedule, $hook );
		} elseif ( $schedule != wp_get_schedule( $hook ) ) {
			// If the schedule has changed, update the schedule
			wp_clear_scheduled_hook( $hook );
			wp_schedule_event( $start_time, $schedule, $hook );
		}
	}

	function clear_sync_cron_jobs() {
		wp_clear_scheduled_hook( 'jetpack_sync_cron' );
		wp_clear_scheduled_hook( 'jetpack_sync_full_cron' );
	}

	function init_sync_cron_jobs() {
		add_filter( 'cron_schedules', array( $this, 'jetpack_cron_schedule' ) );

		add_action( 'jetpack_sync_cron', array( $this, 'do_cron_sync' ) );
		add_action( 'jetpack_sync_full_cron', array( $this, 'do_cron_full_sync' ) );

		/**
		 * Allows overriding of the default incremental sync cron schedule which defaults to once every 5 minutes.
		 *
		 * @since 4.3.2
		 *
		 * @param string $this->DEFAULT_SYNC_CRON_INTERVAL_NAME
		 */
		$incremental_sync_cron_schedule = apply_filters( 'jetpack_sync_incremental_sync_interval', $this::DEFAULT_SYNC_CRON_INTERVAL_NAME );
		$this->maybe_schedule_sync_cron( $incremental_sync_cron_schedule, 'jetpack_sync_cron' );

		/**
		 * Allows overriding of the full sync cron schedule which defaults to once every 5 minutes.
		 *
		 * @since 4.3.2
		 *
		 * @param string $this->DEFAULT_SYNC_CRON_INTERVAL_NAME
		 */
		$full_sync_cron_schedule = apply_filters( 'jetpack_sync_full_sync_interval', $this::DEFAULT_SYNC_CRON_INTERVAL_NAME );
		$this->maybe_schedule_sync_cron( $full_sync_cron_schedule, 'jetpack_sync_full_cron' );
	}

	function cleanup_on_upgrade( $new_version = null, $old_version = null ) {
		if ( wp_next_scheduled( 'jetpack_sync_send_db_checksum' ) ) {
			wp_clear_scheduled_hook( 'jetpack_sync_send_db_checksum' );
		}

		$is_new_sync_upgrade = version_compare( $old_version, '4.2', '>=' );
		if ( ! empty( $old_version ) && $is_new_sync_upgrade && version_compare( $old_version, '4.5', '<' ) ) {
			$this->clear_sync_cron_jobs();
			\Jetpack_Sync_Settings::update_settings(
				array(
					'render_filtered_content' => Jetpack_Sync_Defaults::$default_render_filtered_content,
				)
			);
		}
	}

	/**
	 * Get the sync status
	 *
	 * @param string|null $fields A comma-separated string of the fields to include in the array from the JSON response.
	 * @return array
	 */
	function get_sync_status( $fields = null ) {
		$this->initialize_sender();

		$sync_module     = \Jetpack_Sync_Modules::get_module( 'full-sync' );
		$queue           = $this->sender->get_sync_queue();
		$full_queue      = $this->sender->get_full_sync_queue();
		$cron_timestamps = array_keys( _get_cron_array() );
		$next_cron       = $cron_timestamps[0] - time();

		$checksums = array();

		if ( ! empty( $fields ) ) {
			$store         = new \Jetpack_Sync_WP_Replicastore();
			$fields_params = array_map( 'trim', explode( ',', $fields ) );

			if ( in_array( 'posts_checksum', $fields_params, true ) ) {
				$checksums['posts_checksum'] = $store->posts_checksum();
			}
			if ( in_array( 'comments_checksum', $fields_params, true ) ) {
				$checksums['comments_checksum'] = $store->comments_checksum();
			}
			if ( in_array( 'post_meta_checksum', $fields_params, true ) ) {
				$checksums['post_meta_checksum'] = $store->post_meta_checksum();
			}
			if ( in_array( 'comment_meta_checksum', $fields_params, true ) ) {
				$checksums['comment_meta_checksum'] = $store->comment_meta_checksum();
			}
		}

		$full_sync_status = ( $sync_module ) ? $sync_module->get_status() : array();

		return array_merge(
			$full_sync_status,
			$checksums,
			array(
				'cron_size'            => count( $cron_timestamps ),
				'next_cron'            => $next_cron,
				'queue_size'           => $queue->size(),
				'queue_lag'            => $queue->lag(),
				'queue_next_sync'      => ( $this->sender->get_next_sync_time( 'sync' ) - microtime( true ) ),
				'full_queue_size'      => $full_queue->size(),
				'full_queue_lag'       => $full_queue->lag(),
				'full_queue_next_sync' => ( $this->sender->get_next_sync_time( 'full_sync' ) - microtime( true ) ),
			)
		);
	}
}
