<?php
require_once dirname( __FILE__ ) . '/class.jetpack-sync-deflate-codec.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-functions.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-full.php';

class Jetpack_Sync_Client {
	static $default_options_whitelist = array(
		'stylesheet',
		'/^theme_mods_.*$/',
		'blogname',
		'home',
		'siteurl',
		'blogdescription',
		'blog_charset',
		'permalink_structure',
		'category_base',
		'tag_base',
		'comment_moderation',
		'default_comment_status',
		'thread_comments',
		'thread_comments_depth',
		'jetpack_site_icon_url',
		'social_notifications_like',
		'page_on_front',
		'rss_use_excerpt',
		'subscription_options',
		'stb_enabled',
		'stc_enabled',
		'comment_registration',
		'require_name_email',
		'show_avatars',
		'avatar_default',
		'avatar_rating',
		'highlander_comment_form_prompt',
		'jetpack_comment_form_color_scheme',
		'stats_options',
		'gmt_offset',
		'timezone_string',
		'jetpack_sync_non_public_post_stati',
		'jetpack_options',
		'site_icon', // (int) - ID of core's Site Icon attachment ID
		'default_post_format',
		'default_category',
		'large_size_w',
		'large_size_h',
		'thumbnail_size_w',
		'thumbnail_size_h',
		'medium_size_w',
		'medium_size_h',
		'thumbnail_crop',
		'image_default_link_type',
		'site_logo',
		'sharing-options',
		'sharing-services',
		'post_count',
		'default_ping_status',
		'sticky_posts',
		'disabled_likes',
		'blog_public',
		'default_pingback_flag',
		'require_name_email',
		'close_comments_for_old_posts',
		'close_comments_days_old',
		'thread_comments',
		'thread_comments_depth',
		'page_comments',
		'comments_per_page',
		'default_comments_page',
		'comment_order',
		'comments_notify',
		'moderation_notify',
		'social_notifications_like',
		'social_notifications_reblog',
		'social_notifications_subscribe',
		'comment_whitelist',
		'comment_max_links',
		'moderation_keys',
		'blacklist_keys',
		'lang_id',
		'wga',
		'disabled_likes',
		'disabled_reblogs',
		'jetpack_comment_likes_enabled',
		'twitter_via',
		'twitter-cards-site-tag'
	);

	static $default_constants_whitelist = array(
		'EMPTY_TRASH_DAYS',
		'WP_POST_REVISIONS',
		'AUTOMATIC_UPDATER_DISABLED',
		'ABSPATH',
		'WP_CONTENT_DIR',
		'FS_METHOD',
		'DISALLOW_FILE_EDIT',
		'DISALLOW_FILE_MODS',
		'WP_AUTO_UPDATE_CORE',
		'WP_HTTP_BLOCK_EXTERNAL',
		'WP_ACCESSIBLE_HOSTS',
		'JETPACK__VERSION'
	);

	static $default_callable_whitelist = array(
		'wp_max_upload_size'           => 'wp_max_upload_size',
		'is_main_network'              => array( 'Jetpack', 'is_multi_network' ),
		'is_multi_site'                => 'is_multisite',
		'main_network_site'            => 'network_site_url',
		'single_user_site'             => array( 'Jetpack', 'is_single_user_site' ),
		'has_file_system_write_access' => array( 'Jetpack_Sync_Functions', 'file_system_write_access' ),
		'is_version_controlled'        => array( 'Jetpack_Sync_Functions', 'is_version_controlled' ),
		'modules'                      => array( 'Jetpack_Sync_Functions', 'get_modules' )
	);

	static $default_multisite_callable_whitelist = array(
		'network_name'                        => array( 'Jetpack', 'network_name' ),
		'network_allow_new_registrations'     => array( 'Jetpack', 'network_allow_new_registrations' ),
		'network_add_new_users'               => array( 'Jetpack', 'network_add_new_users' ),
		'network_site_upload_space'           => array( 'Jetpack', 'network_site_upload_space' ),
		'network_upload_file_types'           => array( 'Jetpack', 'network_upload_file_types' ),
		'network_enable_administration_menus' => array( 'Jetpack', 'network_enable_administration_menus' ),
	);

	// TODO: move this to server? - these are theme support values
	// that should be synced as jetpack_current_theme_supports_foo option values
	static $default_theme_support_whitelist = array(
		'post-thumbnails',
		'post-formats',
		'custom-header',
		'custom-background',
		'custom-logo',
		'menus',
		'automatic-feed-links',
		'editor-style',
		'widgets',
		'html5',
		'title-tag',
		'jetpack-social-menu',
		'jetpack-responsive-videos',
		'infinite-scroll',
		'site-logo',
	);

	static $default_network_options_whitelist = array( 'site_name' );
	static $constants_checksum_option_name = 'jetpack_constants_sync_checksum';
	static $functions_checksum_option_name = 'jetpack_functions_sync_checksum';
	static $default_send_buffer_size = 20;
	static $default_taxonomy_whitelist = array();

	private $sync_queue;
	private $full_sync_client;
	private $codec;
	private $options_whitelist;
	private $constants_whitelist;
	private $meta_types = array( 'post', 'comment' );
	private $callable_whitelist;
	private $network_options_whitelist;
	private $taxonomy_whitelist;

	// singleton functions
	private static $instance;

	public static function getInstance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	// this is necessary because you can't use "new" when you declare instance properties >:(
	protected function __construct() {
		$this->set_defaults();
		$this->init();
	}

	private function init() {

		$handler = array( $this, 'action_handler' );

		// constants
		add_action( 'jetpack_sync_current_constants', $handler, 10 );

		// functions
		add_action( 'jetpack_sync_current_callables', $handler, 10 );

		// posts
		add_action( 'wp_insert_post', $handler, 10, 3 );
		add_action( 'deleted_post', $handler, 10 );

		// comments
		add_action( 'wp_insert_comment', $handler, 10, 2 );
		add_action( 'deleted_comment', $handler, 10 );
		add_action( 'trashed_comment', $handler, 10 );
		add_action( 'spammed_comment', $handler, 10 );

		// even though it's messy, we implement these hooks because 
		// the edit_comment hook doesn't include the data
		// so this saves us a DB read for every comment event
		foreach ( array( '', 'trackback', 'pingback' ) as $comment_type ) {
			foreach ( array( 'unapproved', 'approved' ) as $comment_status ) {
				add_action( "comment_{$comment_status}_{$comment_type}", $handler, 10, 2 );
			}
		}

		// options
		add_action( 'added_option', $handler, 10, 2 );
		add_action( 'updated_option', $handler, 10, 3 );
		add_action( 'deleted_option', $handler, 10, 1 );

		// Sync Core Icon: Detect changes in Core's Site Icon and make it syncable.
		add_action( 'add_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );
		add_action( 'update_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );
		add_action( 'delete_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );

		// wordpress version
		add_action( 'upgrader_process_complete', array( $this, 'send_wp_version' ), 10, 2 );
		add_action( 'jetpack_sync_wp_version', $handler );
		// themes
		add_action( 'switch_theme', array( $this, 'send_theme_info' ) );
		add_action( 'jetpack_sync_current_theme_support', $handler, 10 ); // custom hook, see meta-hooks below

		// post-meta, and in the future - other meta?
		foreach ( $this->meta_types as $meta_type ) {
			// we need to make sure we don't commit before we receive these,
			// because they're invoked after meta changes are saved to the DB
			add_action( "added_{$meta_type}_meta", $handler, 99, 4 );
			add_action( "updated_{$meta_type}_meta", $handler, 99, 4 );
			add_action( "deleted_{$meta_type}_meta", $handler, 99, 4 );
		}

		// synthetic actions for full sync
		add_action( 'jetpack_full_sync_start', $handler );
		add_action( 'jetpack_full_sync_end', $handler );
		add_action( 'jetpack_full_sync_option', $handler, 10, 2 );

		add_action( 'jetpack_full_sync_posts', $handler ); // also sends post meta and terms 
		add_action( 'jetpack_full_sync_comments', $handler ); // also send comments meta

		/**
		 * Other hooks - fire synthetic hooks for all the properties we need to sync,
		 * e.g. when a theme changes
		 */

		// themes
		add_action( 'set_site_transient_update_plugins', $handler, 10, 1 );
		add_action( 'set_site_transient_update_themes', $handler, 10, 1 );
		add_action( 'set_site_transient_update_core', $handler, 10, 1 );

		// multi site network options
		if ( $this->is_multisite ) {
			add_action( 'add_site_option', $handler, 10, 2 );
			add_action( 'update_site_option', $handler, 10, 3 );
			add_action( 'delete_site_option', $handler, 10, 1 );
		}

		/**
		 * Sync all pending actions with server
		 */
		add_action( 'jetpack_sync_actions', array( $this, 'do_sync' ) );

		// terms
		add_action( 'created_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'edited_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'jetapack_sync_save_term', $handler, 10, 4 );
		add_action( 'delete_term', $handler, 10, 5 );

		// users
		add_action( 'user_register', array( $this, 'save_user_handler' ) );
		add_action( 'profile_update', array( $this, 'save_user_handler' ), 10, 2 );
		add_action( 'jetapack_sync_save_user', $handler, 10, 2 );
		add_action( 'deleted_user', $handler, 10, 2 );
	}

	// TODO: Refactor to use one set whitelist function, with one is_whitelisted.
	function set_options_whitelist( $options ) {
		$this->options_whitelist = $options;
	}

	function set_constants_whitelist( $constants ) {
		$this->constants_whitelist = $constants;
	}

	function get_callable_whitelist( $functions ) {
		return $this->callable_whitelist;
	}

	function set_callable_whitelist( $functions ) {
		$this->callable_whitelist = $functions;
	}

	function set_network_options_whitelist( $options ) {
		$this->network_options_whitelist = $options;
	}

	function set_send_buffer_size( $size ) {
		$this->sync_queue->set_checkout_size( $size );
	}

	function set_taxonomy_whitelist( $taxonomies ) {
		$this->taxonomy_whitelist = $taxonomies;
	}

	function is_whitelisted_option( $option ) {
		foreach ( $this->options_whitelist as $whitelisted_option ) {
			if ( $whitelisted_option[0] === '/' && preg_match( $whitelisted_option, $option ) ) {
				return true;
			} elseif ( $whitelisted_option === $option ) {
				return true;
			}
		}

		return false;
	}

	function is_whitelisted_network_option( $option ) {
		return $this->is_multisite && in_array( $option, $this->network_options_whitelist );
	}

	function set_codec( iJetpack_Sync_Codec $codec ) {
		$this->codec = $codec;
	}

	function set_full_sync_client( $full_sync_client ) {
		if ( $this->full_sync_client ) {
			remove_action( 'jetpack_sync_full', array( $this->full_sync_client, 'start' ) );
		}

		$this->full_sync_client = $full_sync_client;

		/**
		 * Sync all objects in the database with the server
		 */
		add_action( 'jetpack_sync_full', array( $this->full_sync_client, 'start' ) );
	}

	function get_full_sync_client() {
		return $this->full_sync_client;
	}

	function action_handler() {
		// TODO: it's really silly to have this function here - it should be
		// wherever we initialize the action listeners or we're just wasting cycles
		if ( Jetpack::is_development_mode() || Jetpack::is_staging_site() ) {
			return false;
		}

		$current_filter = current_filter();
		$args           = func_get_args();

		if ( $current_filter === 'wp_insert_post' && $args[1]->post_type === 'revision' ) {
			return;
		}

		if ( in_array( $current_filter, array( 'deleted_option', 'added_option', 'updated_option' ) )
		     &&
		     ! $this->is_whitelisted_option( $args[0] )
		) {
			return;
		}

		if ( in_array( $current_filter, array( 'delete_site_option', 'add_site_option', 'update_site_option' ) )
		     &&
		     ! $this->is_whitelisted_network_option( $args[0] )
		) {
			return;
		}

		// don't sync private meta
		if ( preg_match( '/^(added|updated|deleted)_.*_meta$/', $current_filter ) && $args[2][0] === '_' ) {
			return;
		}

		$this->sync_queue->add( array(
			$current_filter,
			$args
		) );
	}

	function send_theme_info() {
		global $_wp_theme_features;
		do_action( 'jetpack_sync_current_theme_support', $_wp_theme_features );
	}

	function send_wp_version( $update, $meta_data ) {
		if ( 'update' === $meta_data['action'] && 'core' === $meta_data['type'] ) {
			global $wp_version;
			do_action( 'jetpack_sync_wp_version', $wp_version );
		}
	}

	function save_term_handler( $term_id, $tt_id, $taxonomy ) {
		$term_object = WP_Term::get_instance( $term_id, $taxonomy );
		do_action( 'jetapack_sync_save_term', $term_id, $tt_id, $taxonomy, $term_object );
	}

	function save_user_handler( $user_id, $old_user_data = null ) {
		$user = get_user_by( 'id', $user_id );
		unset( $user->data->user_pass );
		if ( $old_user_data !== null ) {
			unset( $old_user_data->data->user_pass );
			if ( serialize( $old_user_data->data ) === serialize( $user->data ) ) {
				return;
			}
		}
		do_action( 'jetapack_sync_save_user', $user_id, $user );
	}

	function do_sync() {
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			$this->schedule_sync( "+1 minute" );

			return false;
		}

		$this->maybe_sync_constants();
		$this->maybe_sync_callables();

		$buffer = $this->sync_queue->checkout();

		if ( ! $buffer ) {
			// buffer has no items
			return;
		}

		if ( is_wp_error( $buffer ) ) {
			error_log( 'Error fetching buffer: ' . $buffer->get_error_message() );

			return;
		}

		$items = array_map( array( $this, 'filter_items_before_send' ), $buffer->get_items() );

		$data = $this->codec->encode( $items );

		/**
		 * Fires when data is ready to send to the server.
		 * Return false or WP_Error to abort the sync (e.g. if there's an error)
		 * The items will be automatically re-sent later
		 *
		 * @since 4.1
		 *
		 * @param array $data The action buffer
		 */
		$result = apply_filters( 'jetpack_sync_client_send_data', $data );

		if ( ! $result || is_wp_error( $result ) ) {
			$this->sync_queue->checkin( $buffer );
			// try again in 1 minute
			$this->schedule_sync( "+1 minute" );
		} else {

			// scan the sent data to see if a full sync started or finished
			if ( $this->buffer_includes_action( $buffer, 'jetpack_full_sync_start' ) ) {
				do_action( 'jetpack_full_sync_start_sent' );
				$this->full_sync_client->set_status_sending_started();
			}

			if ( $this->buffer_includes_action( $buffer, 'jetpack_full_sync_end' ) ) {
				do_action( 'jetpack_full_sync_end_sent' );
				$this->full_sync_client->set_status_sending_finished();
			}

			$this->sync_queue->close( $buffer );
			// check if there are any more events in the buffer
			// if so, schedule a cron job to happen soon
			if ( $this->sync_queue->has_any_items() ) {
				$this->schedule_sync( "+1 minute" );
			}
		}
	}

	private function filter_items_before_send( $item ) {
		$current_filter = $item[0];
		$item[1]        = apply_filters( "jetack_sync_before_send_$current_filter", $item[1] );

		return $item;
	}

	private function buffer_includes_action( $buffer, $action_name ) {
		foreach ( $buffer->get_items() as $item ) {
			if ( $item[0] === $action_name ) {
				return true;
			}
		}

		return false;
	}

	private function schedule_sync( $when ) {
		wp_schedule_single_event( strtotime( $when ), 'jetpack_sync_actions' );
	}

	function force_sync_constants() {
		delete_option( self::$constants_checksum_option_name );
		$this->maybe_sync_constants();
	}

	private function maybe_sync_constants() {
		$constants = $this->get_all_constants();
		if ( empty( $constants ) ) {
			return;
		}
		$constants_check_sum = $this->get_check_sum( $constants );
		if ( $constants_check_sum !== (int) get_option( self::$constants_checksum_option_name ) ) {
			do_action( 'jetpack_sync_current_constants', $constants );
			update_option( self::$constants_checksum_option_name, $constants_check_sum );
		}
	}

	private function get_all_constants() {
		return array_combine(
			$this->constants_whitelist,
			array_map( array( $this, 'get_constant' ), $this->constants_whitelist )
		);
	}

	private function get_constant( $constant ) {
		if ( defined( $constant ) ) {
			return constant( $constant );
		}

		return null;
	}

	public function force_sync_callables() {
		delete_option( self::$functions_checksum_option_name );
		$this->maybe_sync_callables();
	}

	private function maybe_sync_callables() {
		$callables = $this->get_all_callables();
		if ( empty( $callables ) ) {
			return;
		}
		$callables_check_sum = $this->get_check_sum( $callables );
		if ( $callables_check_sum !== (int) get_option( self::$functions_checksum_option_name ) ) {
			do_action( 'jetpack_sync_current_callables', $callables );
			update_option( self::$functions_checksum_option_name, $callables_check_sum );
		}
	}

	private function get_all_callables() {
		return array_combine(
			array_keys( $this->callable_whitelist ),
			array_map( array( $this, 'get_callable' ), array_values( $this->callable_whitelist ) )
		);
	}

	private function get_callable( $callable ) {
		return call_user_func( $callable );
	}

	private function get_check_sum( $values ) {
		return crc32( serialize( $values ) );
	}

	function jetpack_sync_core_icon() {
		if ( function_exists( 'get_site_icon_url' ) ) {
			$url = get_site_icon_url();
		} else {
			return;
		}

		require_once( JETPACK__PLUGIN_DIR . 'modules/site-icon/site-icon-functions.php' );
		// If there's a core icon, maybe update the option.  If not, fall back to Jetpack's.
		if ( ! empty( $url ) && $url !== jetpack_site_icon_url() ) {
			// This is the option that is synced with dotcom
			Jetpack_Options::update_option( 'site_icon_url', $url );
		} else if ( empty( $url ) && did_action( 'delete_option_site_icon' ) ) {
			Jetpack_Options::delete_option( 'site_icon_url' );
		}
	}

	function get_sync_queue() {
		return $this->sync_queue;
	}

	function reset_sync_queue() {
		$this->sync_queue->reset();
	}

	function set_defaults() {
		$this->sync_queue = new Jetpack_Sync_Queue( 'sync', self::$default_send_buffer_size );
		$this->set_full_sync_client( Jetpack_Sync_Full::getInstance() );
		$this->codec                     = new Jetpack_Sync_Deflate_Codec();
		$this->constants_whitelist       = self::$default_constants_whitelist;
		$this->options_whitelist         = self::$default_options_whitelist;
		$this->network_options_whitelist = self::$default_network_options_whitelist;
		$this->taxonomy_whitelist        = self::$default_taxonomy_whitelist;
		$this->is_multisite              = is_multisite();

		if ( $this->is_multisite ) {
			$this->callable_whitelist = array_merge( self::$default_callable_whitelist, self::$default_multisite_callable_whitelist );
		} else {
			$this->callable_whitelist = self::$default_callable_whitelist;
		}
	}

	function reset_data() {
		delete_option( self::$constants_checksum_option_name );
		$this->reset_sync_queue();
	}
}
