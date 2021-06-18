<?php
/**
 * Plugin Name: VaultPress
 * Plugin URI: http://vaultpress.com/?utm_source=plugin-uri&amp;utm_medium=plugin-description&amp;utm_campaign=1.0
 * Description: Protect your content, themes, plugins, and settings with <strong>realtime backup</strong> and <strong>automated security scanning</strong> from <a href="http://vaultpress.com/?utm_source=wp-admin&amp;utm_medium=plugin-description&amp;utm_campaign=1.0" rel="nofollow">VaultPress</a>. Activate, enter your registration key, and never worry again. <a href="http://vaultpress.com/help/?utm_source=wp-admin&amp;utm_medium=plugin-description&amp;utm_campaign=1.0" rel="nofollow">Need some help?</a>
 * Version: 2.2.0-alpha
 * Author: Automattic
 * Author URI: http://vaultpress.com/?utm_source=author-uri&amp;utm_medium=plugin-description&amp;utm_campaign=1.0
 * License: GPL2+
 * Text Domain: vaultpress
 * Domain Path: /languages/
 *
 * @package automattic/vaultpress
 */

// don't call the file directly.
defined( 'ABSPATH' ) || die();

define( 'VAULTPRESS__MINIMUM_PHP_VERSION', '5.6' );
define( 'VAULTPRESS__VERSION', '2.2.0-alpha' );
define( 'VAULTPRESS__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

/**
 * First, we check for our supported version of PHP. If it fails,
 * we "pause" VaultPress by ending the loading process and displaying an admin_notice to inform the site owner.
 */
if ( version_compare( phpversion(), VAULTPRESS__MINIMUM_PHP_VERSION, '<' ) ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log(
			sprintf(
				/* translators: Placeholders are numbers, versions of PHP in use on the site, and required by VaultPress. */
				esc_html__( 'Your version of PHP (%1$s) is lower than the version required by VaultPress (%2$s). Please update PHP to continue enjoying VaultPress.', 'vaultpress' ),
				esc_html( phpversion() ),
				VAULTPRESS__MINIMUM_PHP_VERSION
			)
		);
	}

	/**
	 * Outputs an admin notice for folks running an outdated version of PHP.
	 *
	 * @todo: Remove once WP 5.2 is the minimum version.
	 *
	 * @since 2.0.0
	 */
	function vaultpress_admin_unsupported_php_notice() {
		$update_php_url = ( function_exists( 'wp_get_update_php_url' ) ? wp_get_update_php_url() : 'https://wordpress.org/support/update-php/' );

		?>
		<div class="notice notice-error is-dismissible">
			<p>
			<?php
				printf(
					/* translators: Placeholders are numbers, versions of PHP in use on the site, and required by VaultPress. */
					esc_html__( 'Your version of PHP (%1$s) is lower than the version required by VaultPress (%2$s). Please update PHP to continue enjoying VaultPress.', 'vaultpress' ),
					esc_html( phpversion() ),
					esc_html( VAULTPRESS__MINIMUM_PHP_VERSION )
				);
			?>
			</p>
			<p class="button-container">
				<?php
				printf(
					'<a class="button button-primary" href="%1$s" target="_blank" rel="noopener noreferrer">%2$s <span class="screen-reader-text">%3$s</span><span aria-hidden="true" class="dashicons dashicons-external"></span></a>',
					esc_url( $update_php_url ),
					__( 'Learn more about updating PHP' ),
					/* translators: accessibility text */
					__( '(opens in a new tab)' )
				);
				?>
			</p>
		</div>
		<?php
	}

	add_action( 'admin_notices', 'vaultpress_admin_unsupported_php_notice' );
	return;
}

/**
 * Load all the packages.
 *
 * We want to fail gracefully if `composer install` has not been executed yet, so we are checking for the autoloader.
 * If the autoloader is not present, let's log the failure, pause VaultPress, and display a nice admin notice.
 */
$loader = VAULTPRESS__PLUGIN_DIR . 'vendor/autoload_packages.php';

if ( is_readable( $loader ) ) {
	require $loader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log(
			wp_kses(
				__( 'Your installation of VaultPress is incomplete. If you installed it from GitHub, please run <code>composer install</code>.', 'vaultpress' ),
				array( 'code' => true )
			)
		);
	}
	/**
	 * Outputs an admin notice for folks running VaultPress without having run `composer install`.
	 */
	function vaultpress_admin_missing_autoloader() {
		?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
					echo wp_kses(
						__( 'Your installation of VaultPress is incomplete. If you installed it from GitHub, please run <code>composer install</code>.', 'vaultpress' ),
						array( 'code' => true )
					);
				?>
			</p>
		</div>
		<?php
	}
	add_action( 'admin_notices', 'vaultpress_admin_missing_autoloader' );
	return;
}

/**
 * Main VaultPress class.
 */
class VaultPress {
	var $option_name          = 'vaultpress';
	var $auto_register_option = 'vaultpress_auto_register';
	var $db_version           = 4;
	var $plugin_version       = VAULTPRESS__VERSION;

	function __construct() {
		register_activation_hook( __FILE__, array( $this, 'activate' ) );
		register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );

		$this->options_blog_id = get_current_blog_id();
		$options = get_option( $this->option_name );
		if ( !is_array( $options ) )
			$options = array();

		$defaults = array(
			'db_version'            => 0,
			'key'                   => '',
			'secret'                => '',
			'connection'            => false,
			'service_ips_cidr'      => false
		);

		$this->options = wp_parse_args( $options, $defaults );
		$this->reset_pings();

		$this->upgrade();

		$this->add_global_actions_and_filters();

		if ( is_admin() ) {
			$this->add_admin_actions_and_filters();
		}

		if ( $this->is_registered() ) {
			$do_not_backup = $this->get_option( 'do_not_backup' ) || $this->get_option( 'do_not_send_backup_pings' );
			if ( $do_not_backup )
				$this->add_vp_required_filters();
			else
				$this->add_listener_actions_and_filters();
		}
	}

	static function &init() {
		static $instance = false;

		if ( !$instance ) {
			$instance = new VaultPress();
		}

		return $instance;
	}

	static function register( $registration_key ) {
		$vp = self::init();

		$nonce = wp_create_nonce( 'vp_register_' . $registration_key );
		$args = array( 'registration_key' =>  $registration_key, 'nonce' => $nonce );
		$response = $vp->contact_service( 'register', $args );

		// Check for an error
		if ( ! empty( $response['faultCode'] ) )
			return new WP_Error( $response['faultCode'], $response['faultString'] );

		// Validate result
		if ( empty( $response['key'] ) || empty( $response['secret'] ) || empty( $response['nonce'] ) || $nonce != $response['nonce'] )
			return new WP_Error( 1, __( 'There was a problem trying to register your VaultPress subscription.' ) );

		// Store the result, force a connection test.
		$vp->update_option( 'key', $response['key'] );
		$vp->update_option( 'secret', $response['secret'] );
		$vp->check_connection( true );

		return true;
	}

	function activate( $network_wide ) {
		$type = $network_wide ? 'network' : 'single';
		$this->update_option( 'activated', $type );

		// force a connection check after an activation
		$this->clear_connection();

		if ( get_option( 'vaultpress_auto_connect' ) ) {
			$this->register_via_jetpack( true );
		}
	}

	function deactivate() {
		if ( $this->is_registered() )
			$this->contact_service( 'plugin_status', array( 'vp_plugin_status' => 'deactivated' ) );
	}

	function upgrade() {
		$current_db_version = $this->get_option( 'db_version' );

		if ( $current_db_version < 1 ) {
			$this->options['connection']  = get_option( 'vaultpress_connection' );
			$this->options['key']         = get_option( 'vaultpress_key' );
			$this->options['secret']      = get_option( 'vaultpress_secret' );
			$this->options['service_ips'] = get_option( 'vaultpress_service_ips' );

			// remove old options
			$old_options = array(
				'vaultpress_connection',
				'vaultpress_hostname',
				'vaultpress_key',
				'vaultpress_secret',
				'vaultpress_service_ips',
				'vaultpress_timeout',
				'vp_allow_remote_execution',
				'vp_debug_request_signing',
				'vp_disable_firewall',
			);

			foreach ( $old_options as $option )
				delete_option( $option );

			$this->options['db_version'] = $this->db_version;
			$this->update_options();
		}

		if ( $current_db_version < 2 ) {
			$this->delete_option( 'timeout' );
			$this->delete_option( 'disable_firewall' );
			$this->update_option( 'db_version', $this->db_version );
			$this->clear_connection();
		}

		if ( $current_db_version < 3 ) {
			$this->update_firewall();
			$this->update_option( 'db_version', $this->db_version );
			$this->clear_connection();
		}

		if ( $current_db_version < 4 ) {
			$this->update_firewall();
			$this->update_option( 'db_version', $this->db_version );
			$this->clear_connection();
		}
	}

	function get_option( $key ) {
		if ( 'hostname' == $key ) {
			if ( defined( 'VAULTPRESS_HOSTNAME' ) )
				return VAULTPRESS_HOSTNAME;
			else
				return 'vaultpress.com';
		}

		if ( 'timeout' == $key ) {
			if ( defined( 'VAULTPRESS_TIMEOUT' ) )
				return VAULTPRESS_TIMEOUT;
			else
				return 60;
		}

		if ( 'disable_firewall' == $key ) {
			if ( defined( 'VAULTPRESS_DISABLE_FIREWALL' ) )
				return VAULTPRESS_DISABLE_FIREWALL;
			else
				return false;
		}

		if ( ( 'key' == $key || 'secret' == $key ) && empty( $this->options[$key] ) ) {
			return '';
		}

		// allow_forwarded_for can be overrided by config, or stored in or out of the vp option
		if ( 'allow_forwarded_for' === $key ) {
			if ( defined( 'ALLOW_FORWARDED_FOR' ) ) {
				return ALLOW_FORWARDED_FOR;
			}

			$standalone_option = get_option( 'vaultpress_allow_forwarded_for' );
			if ( ! empty( $standalone_option ) ) {
				return $standalone_option;
			}
		}

		if ( isset( $this->options[$key] ) )
			return $this->options[$key];

		return false;
	}

	function update_option( $key, $value ) {
		if ( 'allow_forwarded_for' === $key ) {
			update_option( 'vaultpress_allow_forwarded_for', $value );

			if ( isset( $this->options[ $key ] ) ) {
				unset( $this->options[ $key ] );
				$this->update_options();
			}
			return;
		}

		$this->options[$key] = $value;
		$this->update_options();
	}

	function delete_option( $key ) {
		if ( 'allow_forwarded_for' === $key ) {
			delete_option( 'vaultpress_allow_forwarded_for' );
		}

		unset( $this->options[$key] );
		$this->update_options();
	}

	function update_options() {
		// Avoid overwriting the VaultPress option if current blog_id has changed since reading it
		if ( get_current_blog_id() !== $this->options_blog_id ) {
			return;
		}

		update_option( $this->option_name, $this->options );
	}

	function admin_init() {
		if ( !current_user_can( 'manage_options' ) )
			return;

		load_plugin_textdomain( 'vaultpress', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );
	}

	function admin_head() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Array of hooks where we want to hook our notices.
		$notice_hooks = array( 'user_admin_notices' );

		/*
		 * In the VaultPress dashboard, move the notices.
		 */
		$screen = get_current_screen();
		if (
			! is_null( $screen )
			&& in_array(
				$screen->id,
				array( 'jetpack_page_vaultpress', 'toplevel_page_vaultpress' ),
				true
			)
		) {
			$notice_hooks[] = 'vaultpress_notices';
		} else {
			$notice_hooks[] = 'admin_notices';
		}

		if ( $activated = $this->get_option( 'activated' ) ) {
			if ( 'network' == $activated ) {
				add_action( 'network_admin_notices', array( $this, 'activated_notice' ) );
			} else {
				foreach ( $notice_hooks as $filter ) {
					add_action( $filter, array( $this, 'activated_notice' ) );
				}
			}
		}

		// ask the user to connect their site w/ VP
		if ( !$this->is_registered() ) {
			foreach ( $notice_hooks as $filter ) {
				add_action( $filter, array( $this, 'connect_notice' ) );
			}

		// if we have an error make sure to let the user know about it
		} else {
			$error_code = $this->get_option( 'connection_error_code' );
		 	if ( ! empty( $error_code ) ) {
				foreach ( $notice_hooks as $filter ) {
					add_action( $filter, array( $this, 'error_notice' ) );
				}
			}
		}
	}

	function admin_menu() {
		// if Jetpack is loaded then we need to wait for that menu to be added
		if ( class_exists( 'Jetpack' ) )
			add_action( 'jetpack_admin_menu', array( $this, 'load_menu' ) );
		else
			$this->load_menu();
	}

	function load_menu() {
		if ( class_exists( 'Jetpack' ) ) {
			$hook = add_submenu_page( 'jetpack', 'VaultPress', 'VaultPress', 'manage_options', 'vaultpress', array( $this, 'ui' ) );
		} else {
			$hook = add_menu_page( 'VaultPress', 'VaultPress', 'manage_options', 'vaultpress', array( $this, 'ui' ), 'div' );
		}

		add_action( "load-$hook", array( $this, 'ui_load' ) );
		add_action( 'admin_print_styles', array( $this, 'styles' ) );
	}

	function styles() {
		if ( !current_user_can( 'manage_options' ) || !is_admin() )
			return;

		wp_enqueue_style( 'vaultpress-nav', plugins_url( '/nav-styles.css', __FILE__ ), false, date( 'Ymd' ) );

		if ( isset( $_GET['page'] ) && 'vaultpress' == $_GET['page'] )
			wp_enqueue_style( 'vaultpress', plugins_url( '/styles.css', __FILE__ ), false, date( 'Ymd' ) );
	}

	// display a security threat notice if one exists
	function toolbar( $wp_admin_bar ) {
		global $wp_version;

		// these new toolbar functions were introduced in 3.3
		// http://codex.wordpress.org/Function_Reference/add_node
		if ( version_compare( $wp_version, '3.3', '<') )
			return;

		if ( !current_user_can( 'manage_options' ) )
			return;

		$messages = $this->get_messages();
		if ( !empty( $messages['security_notice_count'] ) ) {
			$count = (int)$messages['security_notice_count'];
			if ( $count > 0 ) {
				$count = number_format( $count, 0 );
				$wp_admin_bar->add_node( array(
					'id' => 'vp-notice',
					'title' => '<span class="ab-icon"></span>' .
						sprintf( _n( '%s Security Threat', '%s Security Threats', $count , 'vaultpress'), $count ),
					'parent' => 'top-secondary',
					'href' => sprintf( 'https://dashboard.vaultpress.com/%d/security/', $messages['site_id'] ),
					'meta'  => array(
						'title' => __( 'Visit VaultPress Security' , 'vaultpress'),
						'onclick' => 'window.open( this.href ); return false;',
						'class' => 'error'
					),
				) );
			}
		}
	}

	// get any messages from the VP servers
	function get_messages( $force_reload = false ) {
		$last_contact = $this->get_option( 'messages_last_contact' );

		// only run the messages check every 30 minutes
		if ( ( time() - (int)$last_contact ) > 1800 || $force_reload ) {
			$messages = base64_decode( $this->contact_service( 'messages', array() ) );
			$messages = unserialize( $messages );
			$this->update_option( 'messages_last_contact', time() );
			$this->update_option( 'messages', $messages );
		} else {
			$messages = $this->get_option( 'messages' );
		}

		return $messages;
	}

	function server_url() {
		if ( !isset( $this->_server_url ) ) {
			$scheme = is_ssl() ? 'https' : 'http';
			$this->_server_url = sprintf( '%s://%s/', $scheme, $this->get_option( 'hostname' ) );
		}

		return $this->_server_url;
	}

	/**
	 * Show message if plugin is activated but not connected to VaultPress.
	 */
	function connect_notice() {
		$screen = get_current_screen();

		/**
		 * Do not display any error message if we don't have any info about the page.
		 */
		if ( is_null( $screen ) ) {
			return;
		}

		/**
		 * Only display errors on specific pages:
		 * - the main dashboard.
		 * - the Jetpack dashboard.
		 * - the plugins screen.
		 */

		if (
		in_array(
			$screen->id,
			array(
				'dashboard',
				'toplevel_page_jetpack',
				'plugins',
			),
			true
		)
		) {
			$message = sprintf(
				wp_kses(
				/* translators: URLs to VaultPress' dashboard page. */
					__( 'To back up and secure your site, enter your registration key. <a href="%1$s">Register VaultPress or purchase a plan.</a>', 'vaultpress' ),
					array(
						'a' => array(
							'href' => array(),
						),
					)
				),
				admin_url( 'admin.php?page=vaultpress' )
			);
			$this->ui_message( $message, 'notice', __( 'VaultPress needs your attention!', 'vaultpress' ) );
		}
	}

  // show message after activation
	function activated_notice() {
		if ( 'network' == $this->get_option( 'activated' ) ) {
			$message = sprintf(
				__( 'Each site will need to be registered with VaultPress separately. You can purchase new keys from your <a href="%1$s">VaultPress&nbsp;Dashboard</a>.', 'vaultpress' ),
				'https://dashboard.vaultpress.com/'
			);
			$this->ui_message( $message, 'activated', __( 'VaultPress has been activated across your network!', 'vaultpress' ) );

		// key and secret already exist in db
		} elseif ( $this->is_registered() ) {
			if ( $this->check_connection() ) {
			}
		}

		$this->delete_option( 'activated' );
	}

	/**
	 * Display an error notice when something is wrong with our VaultPress installation.
	 */
	public function error_notice() {
		$error_message = $this->get_option( 'connection_error_message' );

		// link to the VaultPress page if we're not already there.
		if (
			! isset( $_GET['page'] )
			|| 'vaultpress' != $_GET['page']
		) {
			$error_message .= sprintf(
				' <a href="%s">%s</a>',
				admin_url( 'admin.php?page=vaultpress' ),
				esc_html__( 'Visit the VaultPress page', 'vaultpress' )
			);
		}

		$screen = get_current_screen();

		/*
		 * Do not display any error message if we don't have a message,
		 * or have no info about the page.
		 */
		if ( is_null( $screen ) || empty( $error_message ) ) {
			return;
		}

		/*
		 * Only display errors on specific pages:
		 * - the main dashboard.
		 * - the VaultPress and Jetpack dashboards.
		 * - the plugins screen.
		 */
		if (
			in_array(
				$screen->id,
				array(
					'dashboard',
					'toplevel_page_jetpack',
					'jetpack_page_vaultpress',
					'toplevel_page_vaultpress',
					'plugins',
				),
				true
			)
		) {
			$this->ui_message( $error_message, 'error' );
		}
	}

	/**
	 * Adds the main wrappers and the header, and defers controls to ui_render to decide which view to render.
	 */
	function ui() {
		$ui_state = $this->ui_render();
		?>
			<div id="jp-plugin-container">
				<?php $this->ui_masthead( $ui_state[ 'dashboard_link' ] ); ?>
				<div class="vp-wrap">
					<?php
					/**
					 * Allow the display of custom notices.
					 *
					 * @since 2.0.0
					 */
					do_action( 'vaultpress_notices' );
					?>
					<?php echo $ui_state[ 'ui' ]; // This content is sanitized when it's produced. ?>
				</div>
				<?php $this->ui_footer(); ?>
			</div>
		<?php
	}

	/**
	 * Decides which UI view to render and executes it.
	 *
	 * @return array $args {
	 *     An array of options to render the dashboard.
	 *
	 *     @type string $ui             Dashboard markup.
	 *     @type string $dashboard_link Whether to show the link to the VaultPress dashboard.
	 * }
	 */
	function ui_render() {
		ob_start();

		if ( $this->is_localhost() ) {
			$this->update_option( 'connection', time() );
			$this->update_option( 'connection_error_code', 'error_localhost' );
			$this->update_option(
				'connection_error_message',
				esc_html__( 'Hostnames such as localhost or 127.0.0.1 can not be reached by vaultpress.com and will not work with the service. Sites must be publicly accessible in order to work with VaultPress.', 'vaultpress' )
			);
			$this->error_notice();
			return array( 'ui' => ob_get_clean(), 'dashboard_link' => false );
		}

		if ( ! empty( $_GET[ 'error' ] ) ) {
			$this->error_notice();
			$this->clear_connection();
		}

		if ( ! $this->is_registered() ) {
			$this->ui_register();
			return array( 'ui' => ob_get_clean(), 'dashboard_link' => false );
		}

		$status = $this->contact_service( 'status' );
		if ( ! $status ) {
			$error_code = $this->get_option( 'connection_error_code' );
			if ( 0 == $error_code ) {
				$this->ui_fatal_error();
			} else {
				$this->ui_register();
			}
			return array( 'ui' => ob_get_clean(), 'dashboard_link' => 0 != $error_code );
		}

		$ticker = $this->contact_service( 'ticker' );
		if ( is_array( $ticker ) && isset( $ticker[ 'faultCode' ] ) ) {
			$this->error_notice();
			$this->ui_register();
			return array( 'ui' => ob_get_clean(), 'dashboard_link' => true );
		}

		$this->ui_main();
		return array( 'ui' => ob_get_clean(), 'dashboard_link' => true );
	}

	function ui_load() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( isset( $_POST['action'] ) && 'delete-vp-settings' == $_POST['action'] ) {
			check_admin_referer( 'delete_vp_settings' );

			$ai_ping_queue_size = $this->ai_ping_queue_size();
			if ( ! empty( $ai_ping_queue_size->option_count ) && $ai_ping_queue_size->option_count > 1 ) {
				$this->ai_ping_queue_delete();
			}

			delete_option( $this->option_name );
			delete_option( 'vaultpress_service_ips_external_cidr' );
			delete_option( '_vp_signatures' );
			delete_option( '_vp_config_option_name_ignore' );
			delete_option( '_vp_config_post_meta_name_ignore' );
			delete_option( '_vp_config_should_ignore_files' );
			delete_option( '_vp_current_scan' );
			delete_option( 'vaultpress_auto_register' );

			wp_redirect( admin_url( 'admin.php?page=vaultpress&delete-vp-settings=1' ) );
			exit();
		}

		// run code that might be updating the registration key
		if ( isset( $_POST['action'] ) && 'register' == $_POST['action'] ) {
			check_admin_referer( 'vaultpress_register' );

			// reset the connection info so messages don't cross
			$this->clear_connection();

			// if registering via Jetpack, get a key...
			if ( isset( $_POST['key_source'] ) && 'jetpack' === $_POST['key_source'] ) {
				$registration_key = $this->get_key_via_jetpack();
				if ( is_wp_error( $registration_key ) ) {
					$this->update_option( 'connection_error_code', -2 );
					$this->update_option(
						'connection_error_message',
						sprintf( __('<strong>Failed to register VaultPress via Jetpack</strong>: %s. If you&rsquo;re still having issues please <a href="%1$s">contact the VaultPress&nbsp;Safekeepers</a>.', 'vaultpress' ),
							esc_html( $registration_key->get_error_message() ), 'http://vaultpress.com/contact/' )
					);
					wp_redirect( admin_url( 'admin.php?page=vaultpress&error=true' ) );
					exit();
				}
			} else {
			$registration_key = trim( $_POST[ 'registration_key' ] );
			}

			if ( empty( $registration_key ) ) {
				$this->update_option( 'connection_error_code', 1 );
				$this->update_option(
					'connection_error_message',
					sprintf(
						__( '<strong>That\'s not a valid registration key.</strong> Head over to the <a href="%1$s" title="Sign in to your VaultPress Dashboard">VaultPress&nbsp;Dashboard</a> to find your key.', 'vaultpress' ),
						'https://dashboard.vaultpress.com/'
					)
				);
				wp_redirect( admin_url( 'admin.php?page=vaultpress&error=true' ) );
				exit();
			}

			// try to register the plugin
			$nonce = wp_create_nonce( 'vp_register_' . $registration_key );
			$args = array( 'registration_key' =>  $registration_key, 'nonce' => $nonce );
			$response = $this->contact_service( 'register', $args );

			// we received an error from the VaultPress servers
			if ( !empty( $response['faultCode'] ) ) {
				$this->update_option( 'connection_error_code',    $response['faultCode'] );
				$this->update_option( 'connection_error_message', $response['faultString'] );
				wp_redirect( admin_url( 'admin.php?page=vaultpress&error=true' ) );
				exit();
			}

			// make sure the returned data looks valid
			if ( empty( $response['key'] ) || empty( $response['secret'] ) || empty( $response['nonce'] ) || $nonce != $response['nonce'] ) {
				$this->update_option( 'connection_error_code', 1 );
				$this->update_option( 'connection_error_message', sprintf( __( 'There was a problem trying to register your subscription. Please try again. If you&rsquo;re still having issues please <a href="%1$s">contact the VaultPress&nbsp;Safekeepers</a>.', 'vaultpress' ), 'http://vaultpress.com/contact/' ) );
				wp_redirect( admin_url( 'admin.php?page=vaultpress&error=true' ) );
				exit();
			}

			// need to update these values in the db so the servers can try connecting to the plugin
			$this->update_option( 'key', $response['key'] );
			$this->update_option( 'secret', $response['secret'] );
			if ( $this->check_connection( true ) ) {
				wp_redirect( admin_url( 'admin.php?page=vaultpress' ) );
				exit();
			}

			// reset the key and secret
			$this->update_option( 'key', '' );
			$this->update_option( 'secret', '' );
			wp_redirect( admin_url( 'admin.php?page=vaultpress&error=true' ) );
			exit();
		}
	}

	function ui_register() {
		?>
			<div class="vp-notice__wide">
				<div class="dops-card">
					<img src="<?php echo esc_url( plugins_url( 'images/security.svg', __FILE__ ) ); ?>" alt="VaultPress">
					<h2><?php _e( 'The VaultPress plugin requires a subscription.', 'vaultpress' ); ?></h2>
					<p><?php _e( 'Get realtime backups, automated security scanning, and support from WordPress&nbsp;experts.', 'vaultpress' ); ?></p>
					<a class="dops-button is-primary" href="https://vaultpress.com/plans/?utm_source=plugin-unregistered&amp;utm_medium=view-plans-and-pricing&amp;utm_campaign=1.0-plugin" target="_blank" rel="noopener noreferrer"><?php _e( 'View plans and pricing', 'vaultpress' ); ?></a>
				</div>
			</div>

			<div class="jp-dash-section-header">
				<div class="jp-dash-section-header__label">
					<h2 class="jp-dash-section-header__name">
						<?php esc_html_e( 'Management', 'vaultpress' ); ?>
					</h2>
				</div>
			</div>

			<div class="vp-row">
				<div class="vp-col">
					<div class="dops-card dops-section-header is-compact">
						<?php esc_html_e( 'Registration key', 'vaultpress' ) ?>
					</div>
					<div class="dops-card">
						<form method="post" action="">
							<fieldset>
								<p>
									<?php esc_html_e( 'Paste your registration key&nbsp;below:', 'vaultpress' ); ?>
								</p>
								<p>
									<textarea class="dops-textarea" placeholder="<?php esc_attr_e( __( 'Enter your key here...', 'vaultpress' ) ); ?>" name="registration_key"></textarea>
								</p>
								<button class="dops-button is-compact"><?php _e( 'Register ', 'vaultpress' ); ?></button>
								<input type="hidden" name="action" value="register" />
								<?php wp_nonce_field( 'vaultpress_register' ); ?>
							</fieldset>
						</form>
					</div>
				</div>
				<div class="vp-col">
					<?php $this->ui_delete_vp_settings_button(); ?>
				</div>
			</div>
		<?php
	}

	/**
	 * Renders the top header.
	 *
	 * @param bool $show_nav Whether to show navigation.
	 */
	function ui_masthead( $show_nav = true ) {
		?>
		<div class="jp-masthead">
			<div class="jp-masthead__inside-container">
				<div class="jp-masthead__logo-container">
					<a class="jp-masthead__logo-link" href="https://vaultpress.com">
						<img src="<?php echo esc_url( plugins_url( 'images/vaultpress.svg', __FILE__ ) ); ?>" alt="VaultPress">
					</a>
				</div>
				<?php if ( $show_nav ) : ?>
					<div class="jp-masthead__nav">
						<div class="dops-button-group">
							<a href="https://dashboard.vaultpress.com" class="dops-button is-compact" target="_blank" rel="noopener noreferrer">
								<?php _e( 'Visit Dashboard', 'vaultpress' ); ?>
							</a>
						</div>
					</div>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the footer.
	 */
	function ui_footer() {
		?>
		<div class="jp-footer">
			<div class="jp-footer__a8c-attr-container">
				<svg role="img" class="jp-footer__a8c-attr" x="0" y="0" viewBox="0 0 935 38.2" enable-background="new 0 0 935 38.2" aria-labelledby="a8c-svg-title"><title id="a8c-svg-title">An Automattic Airline</title>
					<path d="M317.1 38.2c-12.6 0-20.7-9.1-20.7-18.5v-1.2c0-9.6 8.2-18.5 20.7-18.5 12.6 0 20.8 8.9 20.8 18.5v1.2C337.9 29.1 329.7 38.2 317.1 38.2zM331.2 18.6c0-6.9-5-13-14.1-13s-14 6.1-14 13v0.9c0 6.9 5 13.1 14 13.1s14.1-6.2 14.1-13.1V18.6zM175 36.8l-4.7-8.8h-20.9l-4.5 8.8h-7L157 1.3h5.5L182 36.8H175zM159.7 8.2L152 23.1h15.7L159.7 8.2zM212.4 38.2c-12.7 0-18.7-6.9-18.7-16.2V1.3h6.6v20.9c0 6.6 4.3 10.5 12.5 10.5 8.4 0 11.9-3.9 11.9-10.5V1.3h6.7V22C231.4 30.8 225.8 38.2 212.4 38.2zM268.6 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H268.6zM397.3 36.8V8.7l-1.8 3.1 -14.9 25h-3.3l-14.7-25 -1.8-3.1v28.1h-6.5V1.3h9.2l14 24.4 1.7 3 1.7-3 13.9-24.4h9.1v35.5H397.3zM454.4 36.8l-4.7-8.8h-20.9l-4.5 8.8h-7l19.2-35.5h5.5l19.5 35.5H454.4zM439.1 8.2l-7.7 14.9h15.7L439.1 8.2zM488.4 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H488.4zM537.3 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H537.3zM569.3 36.8V4.6c2.7 0 3.7-1.4 3.7-3.4h2.8v35.5L569.3 36.8 569.3 36.8zM628 11.3c-3.2-2.9-7.9-5.7-14.2-5.7 -9.5 0-14.8 6.5-14.8 13.3v0.7c0 6.7 5.4 13 15.3 13 5.9 0 10.8-2.8 13.9-5.7l4 4.2c-3.9 3.8-10.5 7.1-18.3 7.1 -13.4 0-21.6-8.7-21.6-18.3v-1.2c0-9.6 8.9-18.7 21.9-18.7 7.5 0 14.3 3.1 18 7.1L628 11.3zM321.5 12.4c1.2 0.8 1.5 2.4 0.8 3.6l-6.1 9.4c-0.8 1.2-2.4 1.6-3.6 0.8l0 0c-1.2-0.8-1.5-2.4-0.8-3.6l6.1-9.4C318.7 11.9 320.3 11.6 321.5 12.4L321.5 12.4z"></path>
					<path d="M37.5 36.7l-4.7-8.9H11.7l-4.6 8.9H0L19.4 0.8H25l19.7 35.9H37.5zM22 7.8l-7.8 15.1h15.9L22 7.8zM82.8 36.7l-23.3-24 -2.3-2.5v26.6h-6.7v-36H57l22.6 24 2.3 2.6V0.8h6.7v35.9H82.8z"></path>
					<path d="M719.9 37l-4.8-8.9H694l-4.6 8.9h-7.1l19.5-36h5.6l19.8 36H719.9zM704.4 8l-7.8 15.1h15.9L704.4 8zM733 37V1h6.8v36H733zM781 37c-1.8 0-2.6-2.5-2.9-5.8l-0.2-3.7c-0.2-3.6-1.7-5.1-8.4-5.1h-12.8V37H750V1h19.6c10.8 0 15.7 4.3 15.7 9.9 0 3.9-2 7.7-9 9 7 0.5 8.5 3.7 8.6 7.9l0.1 3c0.1 2.5 0.5 4.3 2.2 6.1V37H781zM778.5 11.8c0-2.6-2.1-5.1-7.9-5.1h-13.8v10.8h14.4c5 0 7.3-2.4 7.3-5.2V11.8zM794.8 37V1h6.8v30.4h28.2V37H794.8zM836.7 37V1h6.8v36H836.7zM886.2 37l-23.4-24.1 -2.3-2.5V37h-6.8V1h6.5l22.7 24.1 2.3 2.6V1h6.8v36H886.2zM902.3 37V1H935v5.6h-26v9.2h20v5.5h-20v10.1h26V37H902.3z"></path>
				</svg>
			</div>
			<ul class="jp-footer__links">
				<li class="jp-footer__link-item">
					<a href="https://vaultpress.com" class="jp-footer__link" title="<?php esc_attr_e( 'VaultPress version', 'vaultpress' ) ?>" target="_blank" rel="noopener noreferrer">
						<?php printf( 'VaultPress %s', $this->plugin_version ); ?>
					</a>
				</li>
				<li class="jp-footer__link-item">
					<a href="https://wordpress.com/tos/" class="jp-footer__link" title="<?php esc_attr_e( 'Terms of service', 'vaultpress' ) ?>" target="_blank" rel="noopener noreferrer">
						<?php esc_html_e( 'Terms', 'vaultpress' ); ?>
					</a>
				</li>
			</ul>
			<div class="jp-power">
				<a
					href="<?php echo class_exists( 'Jetpack_Admin_Page' ) ? esc_url( admin_url( 'admin.php?page=jetpack' ) ) : 'https://jetpack.com' ?>"
					class="jp-power__text-link"
					target="_blank"
					rel="noopener noreferrer"
				>
					<span class="jp-power__text"><?php esc_html_e( 'Powered by', 'vaultpress') ?></span> <?php echo $this->ui_logo(); ?>
				</a>
			</div>
		</div>
		<?php
	}

	function ui_main() {
		$response = base64_decode( $this->contact_service( 'plugin_ui' ) );
		echo $response;
		$this->ui_delete_vp_settings_button();
	}

	function ui_fatal_error() {
		$this->render_notice(
			sprintf(
				'<strong>' . __( 'We can\'t connect to %1$s.', 'vaultpress' ) . '</strong><br/>' .
				__( 'Please make sure that your website is accessible via the Internet. Please contact the VaultPress support if you still have issues.' ),
				esc_html( $this->get_option( 'hostname' ) )
			),
			'is-warning',
			array(
				'label' => __( 'Contact support' ),
				'url' => 'https://vaultpress.com/contact/',
			)
		);
	}

	function ui_message( $message, $type = 'notice', $heading = '' ) {
		$level = 'is-warning';
		if ( empty( $heading ) ) {
			switch ( $type ) {
				case 'error':
					$level = 'is-error';
					$heading = __( 'Oops... there seems to be a problem.', 'vaultpress' );
					break;

				case 'success':
					$level = 'is-success';
					$heading = __( 'Yay! Things look good.', 'vaultpress' );
					break;

				default:
					$heading = __( 'VaultPress needs your attention!', 'vaultpress' );
					break;
			}
		}

		$classes = in_array( get_current_screen()->parent_base, array( 'jetpack', 'vaultpress' ), true )
			? ''
			: "notice notice-$type";

		$this->render_notice(
			"<strong>$heading</strong><br/>$message",
			$level,
			array(),
			$classes
		);
	}

	/**
	 * Renders a notice. Can have
	 *
	 * @param string $content Notice main content.
	 * @param string $level Can be is-info, is-warning, is-error. By default, it's is-info.
	 * @param array  $action  {
	 *     Arguments to display a linked action button in the notice.
	 *
	 *     @type string $label The action button label.
	 *     @type string $url   The action button link.
	 * }
	 * @param string $classes This is added as a CSS class to the root node. Useful to pass WP core classes for notices.
	 */
	function render_notice( $content, $level = 'is-info', $action = array(), $classes = '' ) {
		$allowed_html = array(
			'a' => array( 'href' => true, 'target' => 'blank', 'rel' => 'noopener noreferrer' ),
			'br' => true,
			'strong' => true,
		);
		?>
			<div class="dops-notice vp-notice <?php echo esc_attr( "$level $classes" ) ?>">
				<span class="dops-notice__icon-wrapper">
					<svg class="gridicon gridicons-info dops-notice__icon" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
					</svg>
				</span>
				<span class="dops-notice__content">
					<span class="dops-notice__text"><?php echo wp_kses( $content, $allowed_html ) ?></span>
				</span>
				<?php if ( ! empty( $action ) ) : ?>
					<a class="dops-notice__action" href="<?php echo esc_attr( $action['url'] ) ?>" target="_blank" rel="noopener noreferrer">
						<span><?php echo esc_html( $action['label'] ) ?></span>
					</a>
				<?php endif; ?>
			</div>
		<?php
	}

	function ui_delete_vp_settings_button() {
		?>
		<div class="dops-card dops-section-header is-compact">
			<?php _e( 'Reset settings', 'vaultpress' ); ?>
		</div>
		<?php
		if ( isset( $_GET['delete-vp-settings'] ) && 1 == (int) $_GET['delete-vp-settings'] ) {
			?>
			<div class="dops-card">
				<p><?php esc_html_e( 'All VaultPress settings have been deleted.', 'vaultpress' ); ?></p>
			</div>
			<?php
		} else {
			?>
			<div class="dops-card">
				<p><?php esc_html_e( 'Click this button to reset all VaultPress options in the database. You can try this if VaultPress is reporting a connection error.', 'vaultpress' ); ?></p>
				<p><strong>
				<?php
				printf(
					wp_kses(
						/* translators: URLs to VaultPress dashboard. */
						__( 'Warning: this button will unregister VaultPress and disconnect it from your site. If you intend on registering the plugin again, you can find your registration key <a href="%1$s" target="_blank" rel="noopener noreferrer">here</a>.', 'vaultpress' ),
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
								'rel'    => array(),
							),
						)
					),
					'https://dashboard.vaultpress.com/account/'
				);
				?>
				</strong></p>
				<form
					onsubmit="return confirm( '<?php esc_html_e( 'Do you really want to reset all options?', 'vaultpress' ) ?>' );"
					method="post"
					action="">
					<button class="dops-button is-scary is-compact"><?php esc_html_e( 'Delete all settings', 'vaultpress' ); ?></button>
					<input type="hidden" name="action" value="delete-vp-settings"/>
					<?php wp_nonce_field( 'delete_vp_settings' ); ?>
				</form>
			</div>
			<?php
		}
	}

	/**
	 * Render the Jetpack logo
	 */
	function ui_logo() {
		if ( ! class_exists( 'Jetpack_Logo' ) ) {
			require_once VAULTPRESS__PLUGIN_DIR . 'class-jetpack-logo.php';
			$jetpack_logo = new Jetpack_Logo();
		}

		return $jetpack_logo->output();
	}

	function get_config( $key ) {
		$val = get_option( $key );
		if ( $val )
			return $val;
		switch( $key ) {
			case '_vp_config_option_name_ignore':
				$val = $this->get_option_name_ignore( true );
				update_option( '_vp_config_option_name_ignore', $val );
				break;
			case '_vp_config_post_meta_name_ignore':
				$val = $this->get_post_meta_name_ignore( true );
				update_option( '_vp_config_post_meta_name_ignore', $val );
				break;
			case '_vp_config_should_ignore_files':
				$val = $this->get_should_ignore_files( true );
				update_option( '_vp_config_should_ignore_files', $val );
				break;
		}
		return $val;
	}

	// Option name patterns to ignore
	function get_option_name_ignore( $return_defaults = false ) {
		$defaults = array(
			'vaultpress',
			'cron',
			'wpsupercache_gc_time',
			'rewrite_rules',
			'akismet_spam_count',
			'/_transient_/',
			'/^_vp_/',
		);
		if ( $return_defaults )
			return $defaults;
		$ignore_names = $this->get_config( '_vp_config_option_name_ignore' );
		return array_unique( array_merge( $defaults, $ignore_names ) );
	}

	// post meta name patterns to ignore
	function get_post_meta_name_ignore( $return_defaults = false ) {
		$defaults = array(
			'pvc_views'
		);
		if ( $return_defaults )
			return $defaults;
		$ignore_names = $this->get_config( '_vp_config_post_meta_name_ignore' );
		return array_unique( array_merge( $defaults, $ignore_names ) );
	}

	// file name patterns to ignore
	function get_should_ignore_files( $return_defaults = false ) {
		$defaults = array();
		if ( $return_defaults )
			return $defaults;
		$ignore_names = (array) $this->get_config( '_vp_config_should_ignore_files' );
		return array_unique( array_merge( $defaults, $ignore_names ) );
	}

	###
	### Section: Backup Notification Hooks
	###

	// Handle Handle Notifying VaultPress of Options Activity At this point the options table has already been modified
	//
	// Note: we handle deleted, instead of delete because VaultPress backs up options by name (which are unique,) that
	// means that we do not need to resolve an id like we would for, say, a post.
	function option_handler( $option_name ) {
		global $wpdb;
		// Step 1 -- exclusionary rules, don't send these options to vaultpress, because they
		// either change constantly and/or are inconsequential to the blog itself and/or they
		// are specific to the VaultPress plugin process and we want to avoid recursion
		$should_ping = true;
		$ignore_names = $this->get_option_name_ignore();
		foreach( (array)$ignore_names as $val ) {
			if ( $val[0] == '/' ) {
				if ( preg_match( $val, $option_name ) )
					$should_ping = false;
			} else {
				if ( $val == $option_name )
					$should_ping = false;
			}
			if ( !$should_ping )
				break;
		}
		if ( $should_ping )
			$this->add_ping( 'db', array( 'option' => $option_name ) );

		// Step 2 -- If WordPress is about to kick off a some "cron" action, we need to
		// flush vaultpress, because the "remote" cron threads done via http fetch will
		// be happening completely inside the window of this thread.  That thread will
		// be expecting touched and accounted for tables
		if ( $option_name == '_transient_doing_cron' )
			$this->do_pings();

		return $option_name;
	}

	// Handle Notifying VaultPress of Comment Activity
	function comment_action_handler( $comment_id ) {
		if ( !is_array( $comment_id ) ) {
			if ( wp_get_comment_status( $comment_id ) != 'spam' )
				$this->add_ping( 'db', array( 'comment' => $comment_id ) );
		} else {
			foreach ( $comment_id as $id ) {
				if ( wp_get_comment_status( $comment_id ) != 'spam' )
					$this->add_ping( 'db', array( 'comment' => $id) );
			}
		}
	}

	// Handle Notifying VaultPress of Theme Switches
	function theme_action_handler( $theme ) {
		$this->add_ping( 'themes', array( 'theme' => get_option( 'stylesheet' ) ) );
	}

	// Handle Notifying VaultPress of Upload Activity
	function upload_handler( $file ) {
		$this->add_ping( 'uploads', array( 'upload' => str_replace( $this->resolve_upload_path(), '', $file['file'] ) ) );
		return $file;
	}

	// Handle Notifying VaultPress of Plugin Activation/Deactivation
	function plugin_action_handler( $plugin='' ) {
		$this->add_ping( 'plugins', array( 'name' => $plugin ) );
	}

	// Handle Notifying VaultPress of User Edits
	function userid_action_handler( $user_or_id ) {
		if ( is_object($user_or_id) )
			$userid = intval( $user_or_id->ID );
		else
			$userid = intval( $user_or_id );
		if ( !$userid )
			return;
		$this->add_ping( 'db', array( 'user' => $userid ) );
	}

	// Handle Notifying VaultPress of term changes
	function term_handler( $term_id, $tt_id=null ) {
		$this->add_ping( 'db', array( 'term' => $term_id ) );
		if ( $tt_id )
			$this->term_taxonomy_handler( $tt_id );
	}

	// Handle Notifying VaultPress of term_taxonomy changes
	function term_taxonomy_handler( $tt_id ) {
		$this->add_ping( 'db', array( 'term_taxonomy' => $tt_id ) );
	}
	// add(ed)_term_taxonomy handled via the created_term hook, the term_taxonomy_handler is called by the term_handler

	// Handle Notifying VaultPress of term_taxonomy changes
	function term_taxonomies_handler( $tt_ids ) {
		foreach( (array)$tt_ids as $tt_id ) {
			$this->term_taxonomy_handler( $tt_id );
		}
	}

	// Handle Notifying VaultPress of term_relationship changes
	function term_relationship_handler( $object_id, $term_id ) {
		$this->add_ping( 'db', array( 'term_relationship' => array( 'object_id' => $object_id, 'term_taxonomy_id' => $term_id ) ) );
	}

	// Handle Notifying VaultPress of term_relationship changes
	function term_relationships_handler( $object_id, $term_ids ) {
		foreach ( (array)$term_ids as $term_id ) {
			$this->term_relationship_handler( $object_id, $term_id );
		}
	}

	// Handle Notifying VaultPress of term_relationship changes
	function set_object_terms_handler( $object_id, $terms, $tt_ids ) {
		$this->term_relationships_handler( $object_id, $tt_ids );
	}

	// Handle Notifying VaultPress of UserMeta changes
	function usermeta_action_handler( $umeta_id, $user_id, $meta_key, $meta_value='' ) {
		$this->add_ping( 'db', array( 'usermeta' => $umeta_id ) );
	}

	// Handle Notifying VaultPress of Post Changes
	function post_action_handler($post_id) {
		if ( current_filter() == 'delete_post' )
			return $this->add_ping( 'db', array( 'post' => $post_id ), 'delete_post' );
		return $this->add_ping( 'db', array( 'post' => $post_id ), 'edit_post' );
	}

	// Handle Notifying VaultPress of Link Changes
	function link_action_handler( $link_id ) {
		$this->add_ping( 'db', array( 'link' => $link_id ) );
	}

	// Handle Notifying VaultPress of Commentmeta Changes
	function commentmeta_insert_handler( $meta_id, $comment_id=null ) {
		if ( empty( $comment_id ) || wp_get_comment_status( $comment_id ) != 'spam' )
			$this->add_ping( 'db', array( 'commentmeta' => $meta_id ) );
	}

	function commentmeta_modification_handler( $meta_id, $object_id, $meta_key, $meta_value ) {
		if ( !is_array( $meta_id ) )
			return $this->add_ping( 'db', array( 'commentmeta' => $meta_id ) );
		foreach ( $meta_id as $id ) {
			$this->add_ping( 'db', array( 'commentmeta' => $id ) );
		}
	}

	// Handle Notifying VaultPress of PostMeta changes via newfangled metadata functions
	function postmeta_insert_handler( $meta_id, $post_id, $meta_key, $meta_value='' ) {
		if ( in_array( $meta_key, $this->get_post_meta_name_ignore() ) )
			return;

		$this->add_ping( 'db', array( 'postmeta' => $meta_id ) );
	}

	function postmeta_modification_handler( $meta_id, $object_id, $meta_key, $meta_value ) {
		if ( in_array( $meta_key, $this->get_post_meta_name_ignore() ) )
			return;

		if ( !is_array( $meta_id ) )
			return $this->add_ping( 'db', array( 'postmeta' => $meta_id ) );
		foreach ( $meta_id as $id ) {
			$this->add_ping( 'db', array( 'postmeta' => $id ) );
		}
	}

	// Handle Notifying VaultPress of PostMeta changes via old school cherypicked hooks
	function postmeta_action_handler( $meta_id, $post_id = null, $meta_key = null ) {
		if ( in_array( $meta_key, $this->get_post_meta_name_ignore() ) )
			return;

		if ( !is_array($meta_id) )
			return $this->add_ping( 'db', array( 'postmeta' => $meta_id ) );
		foreach ( $meta_id as $id )
			$this->add_ping( 'db', array( 'postmeta' => $id ) );
	}

	// WooCommerce notifications
	function woocommerce_tax_rate_handler( $id ) {
		$this->generic_change_handler( 'woocommerce_tax_rates', array( 'tax_rate_id' => $id ) );
		$this->block_change_handler( 'woocommerce_tax_rate_locations', array( 'tax_rate_id' => $id ) );
	}

	function woocommerce_order_item_handler( $id )      { $this->generic_change_handler( 'woocommerce_order_items',          array( 'order_item_id' => $id ) ); }
	function woocommerce_order_item_meta_handler( $id ) { $this->generic_change_handler( 'woocommerce_order_itemmeta',       array( 'meta_id' => $id ) ); }
	function woocommerce_attribute_handler( $id )       { $this->generic_change_handler( 'woocommerce_attribute_taxonomies', array( 'attribute_id' => $id ) ); }

	function generic_change_handler( $table, $key ) {
		$this->add_ping( 'db', array( $table => $key ) );
	}

	function block_change_handler( $table, $query ) {
		$this->add_ping( 'db', array( "bulk~{$table}" => $query ) );
	}

	function verify_table( $table ) {
		global $wpdb;
		$status = $wpdb->get_row( $wpdb->prepare( "SHOW TABLE STATUS WHERE Name = %s", $table ) );
		if ( !$status || !$status->Update_time || !$status->Comment || $status->Engine != 'MyISAM' )
			return true;
		if ( preg_match( '/([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})/', $status->Comment, $m ) )
			return ( $m[1] == $status->Update_time );
		return false;
	}

	// Emulate $wpdb->last_table
	function record_table( $table ) {
		global $vaultpress_last_table;
		$vaultpress_last_table = $table;
		return $table;
	}

	// Emulate $wpdb->last_table
	function get_last_table() {
		global $wpdb, $vaultpress_last_table;
		if ( is_object( $wpdb ) && isset( $wpdb->last_table ) )
			return $wpdb->last_table;
		return $vaultpress_last_table;
	}

	// Emulate hyperdb::is_write_query()
	function is_write_query( $q ) {
		$word = strtoupper( substr( trim( $q ), 0, 20 ) );
		if ( 0 === strpos( $word, 'SELECT' ) )
			return false;
		if ( 0 === strpos( $word, 'SHOW' ) )
			return false;
		if ( 0 === strpos( $word, 'CHECKSUM' ) )
			return false;
		return true;
	}

	// Emulate hyperdb::get_table_from_query()
	function get_table_from_query( $q ) {
		global $wpdb, $vaultpress_last_table;

		if ( is_object( $wpdb ) && method_exists( $wpdb, "get_table_from_query" ) )
			return $wpdb->get_table_from_query( $q );

		// Remove characters that can legally trail the table name
		$q = rtrim( $q, ';/-#' );
		// allow ( select... ) union [...] style queries. Use the first queries table name.
		$q = ltrim( $q, "\t (" );

		// Quickly match most common queries
		if ( preg_match( '/^\s*(?:'
				. 'SELECT.*?\s+FROM'
				. '|INSERT(?:\s+IGNORE)?(?:\s+INTO)?'
				. '|REPLACE(?:\s+INTO)?'
				. '|UPDATE(?:\s+IGNORE)?'
				. '|DELETE(?:\s+IGNORE)?(?:\s+FROM)?'
				. ')\s+`?(\w+)`?/is', $q, $maybe) )
			return $this->record_table($maybe[1] );

		// Refer to the previous query
		if ( preg_match( '/^\s*SELECT.*?\s+FOUND_ROWS\(\)/is', $q ) )
			return $this->get_last_table();

		// Big pattern for the rest of the table-related queries in MySQL 5.0
		if ( preg_match( '/^\s*(?:'
				. '(?:EXPLAIN\s+(?:EXTENDED\s+)?)?SELECT.*?\s+FROM'
				. '|INSERT(?:\s+LOW_PRIORITY|\s+DELAYED|\s+HIGH_PRIORITY)?(?:\s+IGNORE)?(?:\s+INTO)?'
				. '|REPLACE(?:\s+LOW_PRIORITY|\s+DELAYED)?(?:\s+INTO)?'
				. '|UPDATE(?:\s+LOW_PRIORITY)?(?:\s+IGNORE)?'
				. '|DELETE(?:\s+LOW_PRIORITY|\s+QUICK|\s+IGNORE)*(?:\s+FROM)?'
				. '|DESCRIBE|DESC|EXPLAIN|HANDLER'
				. '|(?:LOCK|UNLOCK)\s+TABLE(?:S)?'
				. '|(?:RENAME|OPTIMIZE|BACKUP|RESTORE|CHECK|CHECKSUM|ANALYZE|OPTIMIZE|REPAIR).*\s+TABLE'
				. '|TRUNCATE(?:\s+TABLE)?'
				. '|CREATE(?:\s+TEMPORARY)?\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?'
				. '|ALTER(?:\s+IGNORE)?\s+TABLE'
				. '|DROP\s+TABLE(?:\s+IF\s+EXISTS)?'
				. '|CREATE(?:\s+\w+)?\s+INDEX.*\s+ON'
				. '|DROP\s+INDEX.*\s+ON'
				. '|LOAD\s+DATA.*INFILE.*INTO\s+TABLE'
				. '|(?:GRANT|REVOKE).*ON\s+TABLE'
				. '|SHOW\s+(?:.*FROM|.*TABLE)'
				. ')\s+`?(\w+)`?/is', $q, $maybe ) )
			return $this->record_table( $maybe[1] );

		// All unmatched queries automatically fall to the global master
		return $this->record_table( '' );
	}

	function table_notify_columns( $table ) {
			$want_cols = array(
				// data
				'posts'                 => '`ID`',
				'users'                 => '`ID`',
				'links'                 => '`link_id`',
				'options'               => '`option_id`,`option_name`',
				'comments'              => '`comment_ID`',
				// metadata
				'postmeta'              => '`meta_id`',
				'commentmeta'           => '`meta_id`',
				'usermeta'              => '`umeta_id`',
				// taxonomy
				'term_relationships'    => '`object_id`,`term_taxonomy_id`',
				'term_taxonomy'         => '`term_taxonomy_id`',
				'terms'                 => '`term_id`',
				// plugin special cases
				'wpo_campaign'          => '`id`', // WP-o-Matic
				'wpo_campaign_category' => '`id`', // WP-o-Matic
				'wpo_campaign_feed'     => '`id`', // WP-o-Matic
				'wpo_campaign_post'     => '`id`', // WP-o-Matic
				'wpo_campaign_word'     => '`id`', // WP-o-Matic
				'wpo_log'               => '`id`', // WP-o-Matic
			);
			if ( isset( $want_cols[$table] ) )
				return $want_cols[$table];
			return '*';
	}

	/**
	 * Use an option ID to ensure a unique ping ID for the site.
	 *
	 * @return  int|false  The new ping number. False, if there was an error.
	 */
	function ai_ping_next() {
		global $wpdb;

		if ( ! $this->allow_ai_pings() ) {
			return false;
		}

		$name = "_vp_ai_ping";
		$wpdb->query( $wpdb->prepare( "DELETE FROM `$wpdb->options` WHERE `option_name` = %s;", $name ) );
		$success = $wpdb->query( $wpdb->prepare( "INSERT INTO `$wpdb->options` (`option_name`, `option_value`, `autoload`) VALUES (%s, '', 'no')", $name ) );
		if ( ! $success ) {
			return false;
		}
		return $wpdb->insert_id;
	}

	function ai_ping_insert( $value ) {
		if ( ! $this->allow_ai_pings() ) {
			return false;
		}

		$new_id = $this->ai_ping_next();

		if ( !$new_id )
			return false;
		add_option( '_vp_ai_ping_' . $new_id, $value, '', 'no' );
	}

	function allow_ai_pings() {
		static $allow_ai_pings = null;

		if ( null === $allow_ai_pings ) {
			$queue_size = $this->ai_ping_queue_size();
			$size_limit = 50 * 1024 * 1024;
			$allow_ai_pings = ( $queue_size->option_count < 100 && $queue_size->option_size < $size_limit );
		}

		return $allow_ai_pings;
	}

	function ai_ping_queue_size() {
		global $wpdb;
		return $wpdb->get_row( "SELECT COUNT(`option_id`) `option_count`, SUM(LENGTH(`option_value`)) `option_size` FROM $wpdb->options WHERE `option_name` LIKE '\_vp\_ai\_ping\_%'" );
	}

	function ai_ping_get( $num=1, $order='ASC' ) {
		global $wpdb;
		if ( strtolower($order) != 'desc' )
			$order = 'ASC';
		else
			$order = 'DESC';
		return $wpdb->get_results( $wpdb->prepare(
			"SELECT * FROM $wpdb->options WHERE `option_name` LIKE '\_vp\_ai\_ping\_%%' ORDER BY `option_id` $order LIMIT %d",
			min( 10, max( 1, (int)$num ) )
		) );
	}

	function ai_ping_queue_delete() {
		global $wpdb;

		return $wpdb->query( "DELETE FROM `$wpdb->options` WHERE `option_name` LIKE '\_vp\_ai\_ping%'" );
	}

	function request_firewall_update( $external_services = false ) {
		$args     = array( 'timeout' => $this->get_option( 'timeout' ), 'sslverify' => true );
		$hostname = $this->get_option( 'hostname' );
		$path = $external_services ? 'service-ips-external' : 'service-ips';

		$data = false;
		$https_error = null;
		$retry = 2;
		$protocol = 'https';
		do {
			$retry--;
			$args['sslverify'] = 'https' == $protocol ? true : false;
			$r = wp_remote_get( $url=sprintf( "%s://%s/%s?cidr_ranges=1", $protocol, $hostname, $path ), $args );
			if ( 200 == wp_remote_retrieve_response_code( $r ) ) {
				if ( 99 == $this->get_option( 'connection_error_code' ) )
					$this->clear_connection();
				$data = @unserialize( wp_remote_retrieve_body( $r ) );
				break;
			}
			if ( 'https' == $protocol ) {
				$https_error = $r;
				$protocol = 'http';
			}
			usleep( 100 );
		} while( $retry > 0 );

		if ( $https_error != null && ! empty( $data ) ) {
			$r_code = wp_remote_retrieve_response_code( $https_error );
			if ( 200 != $r_code ) {
				$error_message = sprintf( 'Unexpected HTTP response code %s', $r_code );
				if ( false === $r_code )
					$error_message = 'Unable to find an HTTP transport that supports SSL verification';
				elseif ( is_wp_error( $https_error ) )
					$error_message = $https_error->get_error_message();

				$this->update_option( 'connection', time() );
				$this->update_option( 'connection_error_code', 99 );
				$this->update_option( 'connection_error_message', sprintf( __('Warning: The VaultPress plugin is using an insecure protocol because it cannot verify the identity of the VaultPress server. Please contact your hosting provider, and ask them to check that SSL certificate verification is correctly configured on this server. The request failed with the following error: "%s". If you&rsquo;re still having issues please <a href="%1$s">contact the VaultPress&nbsp;Safekeepers</a>.', 'vaultpress' ), esc_html( $error_message ), 'http://vaultpress.com/contact/' ) );
			}
		}

		return $data;
	}

	function update_firewall() {
		$data = $this->request_firewall_update();
		if ( $data ) {
			$newval = array( 'updated' => time(), 'data' => $data );
			$this->update_option( 'service_ips_cidr', $newval );
		}

		$external_data = $this->request_firewall_update( true );
		if ( $external_data ) {
			$external_newval = array( 'updated' => time(), 'data' => $external_data );

			delete_option( 'vaultpress_service_ips_external_cidr' );
			add_option( 'vaultpress_service_ips_external_cidr', $external_newval, '', 'no' );
		}

		if ( !empty( $data ) && !empty( $external_data ) )
			$data = array_merge( $data, $external_data );

		if ( $data ) {
			return $data;
		} else {
			return null;
		}
	}

	// Update local cache of VP plan settings, based on a ping or connection test result
	function update_plan_settings( $message ) {
		if ( array_key_exists( 'do_backups', $message ) )
			$this->update_option( 'do_not_backup', ( false === $message['do_backups'] ) || ( '0' === $message['do_backups'] ) );

		if ( array_key_exists( 'do_backup_pings', $message ) )
			$this->update_option( 'do_not_send_backup_pings', ( false === $message['do_backup_pings'] ) || ( '0' === $message['do_backup_pings'] ) );
	}

	function check_connection( $force_check = false ) {
		$connection = $this->get_option( 'connection' );

		if ( !$force_check && !empty( $connection ) ) {
			// already established a connection
		 	if ( 'ok' == $connection )
				return true;

			// only run the connection check every 5 minutes
			if ( ( time() - (int)$connection ) < 300 )
				return false;
		}

		// if we're running a connection test we don't want to run it a second time
		$connection_test = $this->get_option( 'connection_test' );
		if ( ! empty( $connection_test ) )
			return true;

		// force update firewall settings
		$this->update_firewall();

		// Generate a random string for ping-backs to use for identification
		$connection_test_key = wp_generate_password( 32, false );
		$this->update_option( 'connection_test', $connection_test_key );

		// initial connection test to server
		$this->delete_option( 'allow_forwarded_for' );
		$host = ( ! empty( $_SERVER['HTTP_HOST'] ) ) ? $_SERVER['HTTP_HOST'] : parse_url( $this->site_url(), PHP_URL_HOST );
		$connect = $this->contact_service( 'test', array( 'host' => $host, 'uri' => $_SERVER['REQUEST_URI'], 'ssl' => is_ssl() ) );

		// we can't see the servers at all
		if ( !$connect ) {
			$this->update_option( 'connection', time() );
			$this->update_option( 'connection_error_code', 0 );
			$this->update_option( 'connection_error_message', sprintf( __( 'Cannot connect to the VaultPress servers. Please check that your host allows connecting to external sites and try again. If you&rsquo;re still having issues please <a href="%1$s">contact the VaultPress&nbsp;Safekeepers</a>.', 'vaultpress' ), 'http://vaultpress.com/contact/' ) );

			$this->delete_option( 'connection_test' );
			return false;
		}

		// VaultPress gave us a meaningful error
		if ( !empty( $connect['faultCode'] ) ) {
			$this->update_option( 'connection', time() );
			$this->update_option( 'connection_error_code', $connect['faultCode'] );
			$this->update_option( 'connection_error_message', $connect['faultString'] );
			$this->delete_option( 'connection_test' );
			return false;
		}

		$this->update_plan_settings( $connect );

		if ( !empty( $connect['signatures'] ) ) {
			delete_option( '_vp_signatures' );
			add_option( '_vp_signatures', maybe_unserialize( $connect['signatures'] ), '', 'no' );
		}

		// test connection between the site and the servers
		$connect = (string)$this->contact_service( 'test', array( 'type' => 'connect', 'test_key' => $connection_test_key ) );
		if ( 'ok' != $connect ) {
			if ( 'error' == $connect ) {
				$this->update_option( 'connection_error_code', -1 );
				$this->update_option( 'connection_error_message', sprintf( __( 'The VaultPress servers cannot connect to your site. Please check that your site is visible over the Internet and there are no firewall or load balancer settings on your server that might be blocking the communication. If you&rsquo;re still having issues please <a href="%1$s">contact the VaultPress&nbsp;Safekeepers</a>.', 'vaultpress' ), 'http://vaultpress.com/contact/' ) );
			} elseif ( !empty( $connect['faultCode'] ) ) {
				$this->update_option( 'connection_error_code', $connect['faultCode'] );
				$this->update_option( 'connection_error_message', $connect['faultString'] );
			}

			$this->update_option( 'connection', time() );
			$this->delete_option( 'connection_test' );
			return false;
		}

		// successful connection established
		$this->update_option( 'connection', 'ok' );
		$this->delete_option( 'connection_error_code' );
		$this->delete_option( 'connection_error_message' );
		$this->delete_option( 'connection_test' );
		return true;
	}

	function get_login_tokens() {
		// By default the login token is valid for 30 minutes.
		$nonce_life = $this->get_option( 'nonce_life' ) ? $this->get_option( 'nonce_life' ) : 1800;
		$salt = wp_salt( 'nonce' ) . md5( $this->get_option( 'secret' ) );
		$nonce_life /= 2;

		return array(
			'previous' => substr( hash_hmac( 'md5', 'vp-login' . ceil( time() / $nonce_life - 1 ), $salt ), -12, 10 ),
			'current'  => substr( hash_hmac( 'md5', 'vp-login' . ceil( time() / $nonce_life ), $salt ), -12, 10 ),
		);
	}
	function add_js_token() {
		$nonce = $this->get_login_tokens();
		$token = $nonce['current'];

		// Uglyfies the JS code before sending it to the browser.
		$whitelist = array( 'charAt', 'all', 'setAttribute', 'document', 'createElement', 'appendChild', 'input', 'hidden', 'type', 'name', 'value', 'getElementById', 'loginform', '_vp' );
		shuffle( $whitelist );
		$whitelist = array_flip( $whitelist );

		$set = array(
			0   => array( '+[]', 'e^e' ),
			1   => array( '+!![]', '2>>1', "e[{$whitelist['type']}].charCodeAt(3)>>6" ),
			2   => array( '(+!![])<<1', "e[{$whitelist['_vp']}].replace(/_/,'').length" ),
			3   => array( "(Math.log(2<<4)+[])[e[{$whitelist['charAt']}]](0)", "e[{$whitelist['_vp']}].length" ),
			4   => array( '(+!![])<<2', "e[{$whitelist['input']}].length^1", "e[{$whitelist['name']}].length" ),
			5   => array( '((1<<2)+1)', 'parseInt("f",0x10)/3' ),
			6   => array( '(7^1)', "e[{$whitelist['hidden']}].length" ),
			7   => array( '(3<<1)+1', "e[{$whitelist['hidden']}].length^1" ),
			8   => array( '(0x101>>5)', "e[{$whitelist['document']}].length" ),
			9   => array( '(0x7^4)*(3+[])', "e[{$whitelist['loginform']}].length", "(1<<e[{$whitelist['_vp']}].length)^1" ),
			'a' => array( "(![]+\"\")[e[{$whitelist['charAt']}]](1)", "e[{$whitelist['appendChild']}][e[{$whitelist['charAt']}]](0)", "e[{$whitelist['name']}][e[{$whitelist['charAt']}]](1)" ),
			'b' => array( "([]+{})[e[{$whitelist['charAt']}]](2)", "({}+[])[e[{$whitelist['charAt']}]](2)" ),
			'c' => array( "([]+{})[e[{$whitelist['charAt']}]](5)", "e[{$whitelist['createElement']}][e[{$whitelist['charAt']}]](0)" ),
			'd' => array( "([][0]+\"\")[e[{$whitelist['charAt']}]](2)", "([][0]+[])[e[{$whitelist['charAt']}]](2)" ),
			'e' => array( "(!![]+[])[e[{$whitelist['charAt']}]](3)", "(!![]+\"\")[e[{$whitelist['charAt']}]](3)" ),
			'f' => array( "(![]+[])[e[{$whitelist['charAt']}]](0)", "([]+![])[e[{$whitelist['charAt']}]](e^e)", "([]+![])[e[{$whitelist['charAt']}]](0)" ),
		);

		$js_code = <<<JS
<script type="text/javascript">
/* <![CDATA[ */
(function(){
	var i,e='%s'.split('|'),_=[%s],s=function(a,b,c){a[b]=c};
	if(this[e[{$whitelist['document']}]][e[{$whitelist['all']}]]){
		try {
			i=this[e[{$whitelist['document']}]][e[{$whitelist['createElement']}]]('<'+e[{$whitelist['input']}]+' '+e[{$whitelist['name']}]+'='+(e[{$whitelist['_vp']}]+(!![]))+' />');
		}catch(e){}
	}
	if(!i){
		i=this[e[{$whitelist['document']}]][e[{$whitelist['createElement']}]](e[{$whitelist['input']}]);
		s(i,e[{$whitelist['name']}],e[{$whitelist['_vp']}]+(!![]));
	}
	s(i,e[{$whitelist['type']}],e[{$whitelist['hidden']}]).
	s(i,e[{$whitelist['value']}],(%s+""));
	try {
		var __=this[e[{$whitelist['document']}]][e[{$whitelist['getElementById']}]](e[{$whitelist['loginform']}]);
		__[e[{$whitelist['appendChild']}]](i);
	} catch(e){}
})();
/* ]]> */
</script>
JS;
		$chars = array();
		for ( $i = 0; $i < strlen( $token ); $i++ ) {
			if ( isset( $set[$token[ $i ] ] ) ) {
				$k = array_rand( $set[$token[ $i ] ], 1 );
				$chars[] = $set[$token[ $i ] ][$k];
			} else {
				$chars[] = $token[ $i ];
			}
		}
		$random = array_unique( $chars );
		shuffle( $random );
		$random = array_flip( $random );

		foreach( $chars as $i => $v )
			$chars[$i] = sprintf( '_[%d]', $random[$v] );

		$code = preg_replace(
			"#[\n\r\t]#",
			'',
			sprintf( $js_code,
				join( '|', array_keys( $whitelist ) ),
				join( ',', array_keys( $random ) ),
				join( '+"")+(', $chars )
			)
		);
		echo $code;
	}

	function authenticate( $user, $username, $password ) {
		if ( is_wp_error( $user ) )
			return $user;
		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST || defined( 'APP_REQUEST' ) && APP_REQUEST ) {
			// Try to log in with the username and password.
		}
		$retval = $user;
		if ( empty( $_POST['_vptrue'] ) || !in_array( $_POST['_vptrue'], $this->get_login_tokens(), true ) )
			$retval = new WP_Error( 'invalid_token', __( 'Invalid token. Please try to log in again.' ) );

		return $retval;
	}

	function parse_request( $wp ) {
		if ( !isset( $_GET['vaultpress'] ) || $_GET['vaultpress'] !== 'true' )
			return $wp;

		global $wpdb, $current_blog;

		// just in case we have any plugins that decided to spit some data out already...
		@ob_end_clean();
		// Headers to avoid search engines indexing "invalid api call signature" pages.
		if ( !headers_sent() ) {
			header( 'X-Robots-Tag: none' );
			header( 'X-Robots-Tag: unavailable_after: 1 Oct 2012 00:00:00 PST', false );
		}

		if ( isset( $_GET['ticker'] ) && function_exists( 'current_user_can' ) && current_user_can( 'manage_options' ) )
			die( (string)$this->contact_service( 'ticker' ) );

		$_POST = array_map( 'stripslashes_deep', $_POST );

		global $wpdb, $bdb, $bfs;
		define( 'VAULTPRESS_API', true );

		if ( !$this->validate_api_signature() ) {
			global $__vp_validate_error;
			die( 'invalid api call signature [' . base64_encode( serialize( $__vp_validate_error ) ) . ']' );
		}

		if ( !empty( $_GET['ge'] ) ) {
			// "ge" -- "GET encoding"
			if ( '1' === $_GET['ge'] )
				$_GET['action'] = base64_decode( $_GET['action'] );
			if ( '2' === $_GET['ge'] )
				$_GET['action'] = str_rot13( $_GET['action'] );
		}

		if ( !empty( $_GET['pe'] ) ) {
			// "pe" -- POST encoding
			if ( '1' === $_GET['pe'] ) {
				foreach( $_POST as $idx => $val ) {
					if ( $idx === 'signature' )
						continue;
					$_POST[ base64_decode( $idx ) ] = base64_decode( $val );
					unset( $_POST[$idx] );
				}
			}
			if ( '2' === $_GET['pe'] ) {
				foreach( $_POST as $idx => $val ) {
					if ( $idx === 'signature' )
						continue;
					$_POST[ base64_decode( $idx ) ] = str_rot13( $val );
					unset( $_POST[$idx] );
				}
			}
		}

		if ( !isset( $bdb ) ) {
			require_once( dirname( __FILE__ ) . '/class.vaultpress-database.php' );
			require_once( dirname( __FILE__ ) . '/class.vaultpress-filesystem.php' );

			$bdb = new VaultPress_Database();
			$bfs = new VaultPress_Filesystem();
		}

		header( 'Content-Type: text/plain' );

		/*
		 * general:ping
		 *
		 * catchup:get
		 * catchup:delete
		 *
		 * db:tables
		 * db:explain
		 * db:cols
		 *
		 * plugins|themes|uploads|content|root:active
		 * plugins|themes|uploads|content|root:dir
		 * plugins|themes|uploads|content|root:ls
		 * plugins|themes|uploads|content|root:stat
		 * plugins|themes|uploads|content|root:get
		 * plugins|themes|uploads|content|root:checksum
		 *
		 * config:get
		 * config:set
		 *
		 */
		if ( !isset( $_GET['action'] ) )
			die();

		switch ( $_GET['action'] ) {
			default:
				die();
				break;
			case 'exec':
				$code = $_POST['code'];
				if ( !$code )
					$this->response( "No Code Found" );
				$syntax_check = @eval( 'return true;' . $code );
				if ( !$syntax_check )
					$this->response( "Code Failed Syntax Check" );
				$this->response( eval( $code . ';' ) );
				die();
				break;
			case 'catchup:get':
				$this->response( $this->ai_ping_get( (int)$_POST['num'], (string)$_POST['order'] ) );
				break;
			case 'catchup:delete':
				if ( isset( $_POST['pings'] ) ) {
					foreach( unserialize( $_POST['pings'] ) as $ping ) {
						if ( 0 === strpos( $ping, '_vp_ai_ping_' ) )
							delete_option( $ping );
					}
				}
				break;
			case 'general:ping':
				global $wp_version, $wp_db_version, $manifest_version;
				@error_reporting(0);
				$http_modules = array();
				$httpd = null;
				if ( function_exists( 'apache_get_modules' ) ) {
					if ( isset( $_POST['apache_modules'] ) && $_POST['apache_modules'] == 1 )
						$http_modules = apache_get_modules();
					else
						$http_modules =  null;
					if ( function_exists( 'apache_get_version' ) ) {
						$version_pieces = explode( ' ', apache_get_version() );
						$httpd = array_shift( $version_pieces );
					}
				}
				if ( !$httpd && 0 === stripos( $_SERVER['SERVER_SOFTWARE'], 'Apache' ) ) {
					$software_pieces = explode( ' ', $_SERVER['SERVER_SOFTWARE'] );
					$httpd = array_shift( $software_pieces );
					if ( isset( $_POST['apache_modules'] ) && $_POST['apache_modules'] == 1 )
						$http_modules =  'unknown';
					else
						$http_modules = null;
				}
				if ( !$httpd && defined( 'IIS_SCRIPT' ) && IIS_SCRIPT ) {
					$httpd = 'IIS';
				}
				if ( !$httpd && function_exists( 'nsapi_request_headers' ) ) {
					$httpd = 'NSAPI';
				}
				if ( !$httpd )
					$httpd = 'unknown';
				$mvars = array();
				if ( isset( $_POST['mysql_variables'] ) && $_POST['mysql_variables'] == 1 ) {
					foreach ( $wpdb->get_results( "SHOW VARIABLES" ) as $row )
						$mvars["$row->Variable_name"] = $row->Value;
				}

				$this->update_plan_settings( $_POST );

				$ms_global_tables = array_merge( $wpdb->global_tables, $wpdb->ms_global_tables );
				$tinfo = array();
				$tprefix = $wpdb->prefix;
				if ( $this->is_multisite() ) {
					$tprefix = $wpdb->get_blog_prefix( $current_blog->blog_id );
				}
				$like_string = str_replace( '_', '\_', $tprefix ) . "%";
				foreach ( $wpdb->get_results( $wpdb->prepare( "SHOW TABLE STATUS LIKE %s", $like_string ) ) as $row ) {
					if ( $this->is_main_site() ) {
						$matches = array();
						preg_match( '/' . $tprefix . '(\d+)_/', $row->Name, $matches );
						if ( isset( $matches[1] ) && (int) $current_blog->blog_id !== (int) $matches[1] )
							continue;
					}

					$table = preg_replace( '/^' . preg_quote( $wpdb->prefix ) . '/', '', $row->Name );

					if ( !$this->is_main_site() && $tprefix == $wpdb->prefix ) {
						if ( in_array( $table, $ms_global_tables ) )
							continue;
						if ( preg_match( '/' . $tprefix . '(\d+)_/', $row->Name ) )
							continue;
					}

					$tinfo[$table] = array();
					foreach ( (array)$row as $i => $v )
						$tinfo[$table][$i] = $v;
					if ( empty( $tinfo[$table] ) )
						unset( $tinfo[$table] );
				}

				if ( $this->is_main_site() ) {
					foreach ( (array) $ms_global_tables as $ms_global_table ) {
						$ms_table_status = $wpdb->get_row( $wpdb->prepare( "SHOW TABLE STATUS LIKE %s", $wpdb->base_prefix . $ms_global_table ) );
						if ( !$ms_table_status )
							continue;
						$table = substr( $ms_table_status->Name, strlen( $wpdb->base_prefix ) );
						$tinfo[$table] = array();
						foreach ( (array) $ms_table_status as $i => $v )
							$tinfo[$table][$i] = $v;
						if ( empty( $tinfo[$table] ) )
							unset( $tinfo[$table] );
					}
				}

				if ( isset( $_POST['php_ini'] ) && $_POST['php_ini'] == 1 )
					$ini_vals = @ini_get_all();
				else
					$ini_vals = null;
				if ( function_exists( 'sys_getloadavg' ) )
					$loadavg = sys_getloadavg();
				else
					$loadavg = null;

				require_once ABSPATH . '/wp-admin/includes/plugin.php';
                                if ( function_exists( 'get_plugin_data' ) )
					$vaultpress_response_info                  = get_plugin_data( __FILE__ );
				else
					$vaultpress_response_info		   = array( 'Version' => $this->plugin_version );
				$vaultpress_response_info['deferred_pings']        = (int)$this->ai_ping_queue_size()->option_count;
				$vaultpress_response_info['vaultpress_hostname']   = $this->get_option( 'hostname' );
				$vaultpress_response_info['vaultpress_timeout']    = $this->get_option( 'timeout' );
				$vaultpress_response_info['disable_firewall']      = $this->get_option( 'disable_firewall' );
				$vaultpress_response_info['allow_forwarded_for']   = $this->get_option( 'allow_forwarded_for' );
				$vaultpress_response_info['is_writable']           = is_writable( __FILE__ );

				$_wptype = 's';
				if ( $this->is_multisite() ) {
					global $wpmu_version;
					if ( isset( $wpmu_version ) )
						$_wptype = 'mu';
					else
						$_wptype = 'ms';
				}

				$upload_url = '';
				$upload_dir = wp_upload_dir();
				if ( isset( $upload_dir['baseurl'] ) ) {
					$upload_url = $upload_dir['baseurl'];
					if ( false === strpos( $upload_url, 'http' ) )
						$upload_url = untrailingslashit( site_url() ) . $upload_url;
				}

				if ( defined( 'VP_DISABLE_UNAME' ) && VP_DISABLE_UNAME ) {
					$uname_a = '';
					$uname_n = '';
				} else {
					$uname_a = @php_uname( 'a' );
					$uname_n = @php_uname( 'n' );
				}

				$this->response( array(
					'vaultpress' => $vaultpress_response_info,
					'wordpress' => array(
						'wp_version'       => $wp_version,
						'wp_db_version'    => $wp_db_version,
						'locale'	   => get_locale(),
						'manifest_version' => $manifest_version,
						'prefix'           => $wpdb->prefix,
						'is_multisite'     => $this->is_multisite(),
						'is_main_site'     => $this->is_main_site(),
						'blog_id'          => isset( $current_blog ) ? $current_blog->blog_id : null,
						'theme'            => (string) ( function_exists( 'wp_get_theme' ) ? wp_get_theme() : get_current_theme() ),
						'plugins'          => preg_replace( '#/.*$#', '', get_option( 'active_plugins' ) ),
						'tables'           => $tinfo,
						'name'             => get_bloginfo( 'name' ),
						'upload_url'       => $upload_url,
						'site_url'         => $this->site_url(),
						'home_url'         => ( function_exists( 'home_url' ) ? home_url() : get_option( 'home' ) ),
						'type'             => $_wptype,
					),
					'server' => array(
						'host'   => $_SERVER['HTTP_HOST'],
						'server' => $uname_n,
						'load'   => $loadavg,
						'info'   => $uname_a,
						'time'   => time(),
						'php'    => array( 'version' => phpversion(), 'ini' => $ini_vals, 'directory_separator' => DIRECTORY_SEPARATOR ),
						'httpd'  => array(
							'type'    => $httpd,
							'modules' => $http_modules,
						),
						'mysql'  => $mvars,
					),
				) );
				break;
			case 'db:prefix':
				$this->response( $wpdb->prefix );
				break;
			case 'db:wpdb':
				if ( !$_POST['query'] )
					die( "naughty naughty" );
				$query = @base64_decode( $_POST['query'] );
				if ( !$query )
					die( "naughty naughty" );
				if ( !$_POST['function'] )
					$function = $function;
				else
					$function = $_POST['function'];
				$this->response( $bdb->wpdb( $query, $function ) );
				break;
			case 'db:diff':
			case 'db:count':
			case 'db:cols':
				if ( isset( $_POST['limit'] ) )
					$limit = $_POST['limit'];
				else
					$limit = null;

				if ( isset( $_POST['offset'] ) )
					$offset = $_POST['offset'];
				else
					$offset = null;

				if ( isset( $_POST['columns'] ) )
					$columns = $_POST['columns'];
				else
					$columns = null;

				if ( isset( $_POST['signatures'] ) )
					$signatures = $_POST['signatures'];
				else
					$signatures = null;

				if ( isset( $_POST['where'] ) )
					$where = $_POST['where'];
				else
					$where = null;

				if ( isset( $_POST['table'] ) ) {
					$parse_create_table = isset( $_POST['use_new_hash'] ) && $_POST['use_new_hash'] ? true : false;
					$bdb->attach( base64_decode( $_POST['table'] ), $parse_create_table );
				}

				$action_pieces = explode( ':', $_GET['action'] );
				switch ( array_pop( $action_pieces ) ) {
					case 'diff':
						if ( !$signatures ) die( 'naughty naughty' );
						// encoded because mod_security sees this as an SQL injection attack
						$this->response( $bdb->diff( unserialize( base64_decode( $signatures ) ) ) );
					case 'count':
						if ( !$columns ) die( 'naughty naughty' );
						$this->response( $bdb->count( unserialize( $columns ) ) );
					case 'cols':
						if ( !$columns ) die( 'naughty naughty' );
						$this->response( $bdb->get_cols( unserialize( $columns ), $limit, $offset, $where ) );
				}

				break;
			case 'db:tables':
			case 'db:explain':
			case 'db:show_create':
				if ( isset( $_POST['filter'] ) )
					$filter = $_POST['filter'];
				else
					$filter = null;

				if ( isset( $_POST['table'] ) )
					$bdb->attach( base64_decode( $_POST['table'] ) );

				$action_pieces = explode( ':', $_GET['action'] );
				switch ( array_pop( $action_pieces ) ) {
					default:
						die( "naughty naughty" );
					case 'tables':
						$this->response( $bdb->get_tables( $filter ) );
					case 'explain':
						$this->response( $bdb->explain() );
					case 'show_create':
						$this->response( $bdb->show_create() );
				}
				break;
			case 'db:restore':
				if ( !empty( $_POST['path'] ) && isset( $_POST['hash'] ) ) {
					$delete = !isset( $_POST['remove'] ) || $_POST['remove'] && 'false' !== $_POST['remove'];
					$this->response( $bdb->restore( $_POST['path'], $_POST['hash'], $delete ) );
				}
				break;
			case 'themes:active':
				$this->response( get_option( 'current_theme' ) );
			case 'plugins:active':
				$this->response( preg_replace( '#/.*$#', '', get_option( 'active_plugins' ) ) );
				break;
			case 'plugins:checksum': case 'uploads:checksum': case 'themes:checksum': case 'content:checksum': case 'root:checksum':
			case 'plugins:ls':       case 'uploads:ls':       case 'themes:ls':       case 'content:ls':       case 'root:ls':
			case 'plugins:dir':      case 'uploads:dir':      case 'themes:dir':      case 'content:dir':      case 'root:dir':
			case 'plugins:stat':     case 'uploads:stat':     case 'themes:stat':     case 'content:stat':     case 'root:stat':
			case 'plugins:get':      case 'uploads:get':      case 'themes:get':      case 'content:get':      case 'root:get':

				$action_pieces = explode( ':', $_GET['action'] );
				$bfs->want( array_shift( $action_pieces ) );

				if ( isset( $_POST['path'] ) )
					$path = $_POST['path'];
				else
					$path = '';

				if ( !$bfs->validate( $path ) )
					die( "naughty naughty" );

				if ( isset( $_POST['sha1'] ) && $_POST['sha1'] )
					$sha1 = true;
				else
					$sha1 = false;

				if ( isset( $_POST['md5'] ) && $_POST['md5'] )
					$md5 = true;
				else
					$md5 = false;

				if ( isset( $_POST['limit'] ) && $_POST['limit'] )
					$limit=$_POST['limit'];
				else
					$limit = false;

				if ( isset( $_POST['offset'] ) && $_POST['offset'] )
					$offset = $_POST['offset'];
				else
					$offset = false;

				if ( isset( $_POST['recursive'] ) )
					$recursive = (bool)$_POST['recursive'];
				else
					$recursive = false;

				if ( isset( $_POST['full_list'] ) )
					$full_list = (bool)$_POST['full_list'];
				else
					$full_list = false;

				$action_pieces = explode( ':', $_GET['action'] );
				switch ( array_pop( $action_pieces ) ) {
					default:
						die( "naughty naughty" );
					case 'checksum':
						$list = array();
						$this->response( $bfs->dir_checksum( $path, $list, $recursive ) );
					case 'dir':
						$this->response( $bfs->dir_examine( $path, $recursive ) );
					case 'stat':
						$this->response( $bfs->stat( $bfs->dir.$path ) );
					case 'get':
						$bfs->fdump( $bfs->dir.$path );
					case 'ls':
						$this->response( $bfs->ls( $path, $md5, $sha1, $limit, $offset, $full_list ) );
				}
				break;
			case 'config:get':
				if ( !isset( $_POST['key'] ) || !$_POST['key'] )
					$this->response( false );
				$key = '_vp_config_' . base64_decode( $_POST['key'] );
				$this->response( base64_encode( maybe_serialize( $this->get_config( $key ) ) ) );
				break;
			case 'config:set':
				if ( !isset( $_POST['key'] ) || !$_POST['key'] ) {
					$this->response( false );
					break;
				}
				$key = '_vp_config_' . base64_decode( $_POST['key'] );
				if ( !isset( $_POST['val'] ) || !$_POST['val'] ) {
					if ( !isset($_POST['delete']) || !$_POST['delete'] ) {
						$this->response( false );
					} else {
						$this->response( delete_option( $key ) );
					}
					break;
				}
				$val = maybe_unserialize( base64_decode( $_POST['val'] ) );
				$this->response( update_option( $key, $val ) );
				break;
		}
		die();
	}

	function _fix_ixr_null_to_string( &$args ) {
		if ( is_array( $args ) )
			foreach ( $args as $k => $v )
				$args[$k] = $this->_fix_ixr_null_to_string( $v );
		else if ( is_object( $args ) )
			foreach ( get_object_vars( $args ) as $k => $v )
			$args->$k = $this->_fix_ixr_null_to_string( $v );
		else
			return null == $args ? '' : $args;
		return $args;
	}

	function is_localhost() {
		$site_url = $this->site_url();
		if ( empty( $site_url ) )
			return false;
		$parts = parse_url( $site_url );
		if ( !empty( $parts['host'] ) && in_array( $parts['host'], array( 'localhost', '127.0.0.1' ) ) )
			return true;
		return false;
	}

	function contact_service( $action, $args = array() ) {
		if ( 'test' != $action && 'register' != $action && !$this->check_connection() )
			return false;

		global $current_user;
		if ( !isset( $args['args'] ) )
			$args['args'] = '';
		$old_timeout = ini_get( 'default_socket_timeout' );
		$timeout = $this->get_option( 'timeout' );
		if ( function_exists( 'ini_set' ) )
			ini_set( 'default_socket_timeout', $timeout );
		$hostname = $this->get_option( 'hostname' );

		if ( !class_exists( 'VaultPress_IXR_SSL_Client' ) )
			require_once( dirname( __FILE__ ) . '/class.vaultpress-ixr-ssl-client.php' );
		$useragent = 'VaultPress/' . $this->plugin_version . '; ' . $this->site_url();
		$client = new VaultPress_IXR_SSL_Client( $hostname, '/xmlrpc.php', 80, $timeout, $useragent );

		if ( 'vaultpress.com' == $hostname )
			$client->ssl();

		// Begin audit trail breadcrumbs
		if ( isset( $current_user ) && is_object( $current_user ) && isset( $current_user->ID ) ) {
			$args['cause_user_id'] = intval( $current_user->ID );
			$args['cause_user_login'] = (string)$current_user->user_login;
		} else {
			$args['cause_user_id'] = -1;
			$args['cause_user_login'] = '';
		}
		$args['cause_ip'] = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : null ;
		$args['cause_uri'] = isset( $_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : null;
		$args['cause_method'] = isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : null;
		// End audit trail breadcrumbs

		$args['version']   = $this->plugin_version;
		$args['locale']    = get_locale();
		$args['site_url']  = $this->site_url();

		$salt              = md5( time() . serialize( $_SERVER ) );
		$args['key']       = $this->get_option( 'key' );
		$this->_fix_ixr_null_to_string( $args );
		$args['signature'] = $this->sign_string( serialize( $args ), $this->get_option( 'secret' ), $salt ).":$salt";

		$client->query( 'vaultpress.'.$action, new IXR_Base64( serialize( $args ) ) );
		$rval = $client->message ? $client->getResponse() : '';
		if ( function_exists( 'ini_set' ) )
			ini_set( 'default_socket_timeout', $old_timeout );

		// we got an error from the servers
		if ( is_array( $rval ) && isset( $rval['faultCode'] ) ) {
			$this->update_option( 'connection', time() );
			$this->update_option( 'connection_error_code', $rval['faultCode'] );
			$this->update_option( 'connection_error_message', $rval['faultString'] );
		}

		return $rval;
	}

	function validate_api_signature() {
		global $__vp_validate_error;
		if ( !empty( $_POST['signature'] ) ) {
			if ( is_string( $_POST['signature'] ) ) {
				$sig = $_POST['signature'];
			} else {
				$__vp_validate_error = array( 'error' => 'invalid_signature_format' );
				return false;
			}
		} else {
			$__vp_validate_error = array( 'error' => 'no_signature' );
			return false;
		}

		$secret = $this->get_option( 'secret' );
		if ( !$secret ) {
			$__vp_validate_error = array( 'error' => 'missing_secret' );
			return false;
		}
		if ( !$this->get_option( 'disable_firewall' ) ) {
			if ( ! $this->check_firewall() )
				return false;
		}
		$sig = explode( ':', $sig );
		if ( !is_array( $sig ) || count( $sig ) != 2 || !isset( $sig[0] ) || !isset( $sig[1] ) ) {
			$__vp_validate_error = array( 'error' => 'invalid_signature_format' );
			return false;
		}

		// Pass 1 -- new method
		$uri = preg_replace( '/^[^?]+\?/', '?', $_SERVER['REQUEST_URI'] );
		$post = $_POST;
		unset( $post['signature'] );
		// Work around for dd-formmailer plugin
		if ( isset( $post['_REPEATED'] ) )
			unset( $post['_REPEATED'] );
		ksort( $post );
		$to_sign = serialize( array( 'uri' => $uri, 'post' => $post ) );

		if ( $this->can_use_openssl() ) {
			$sslsig = '';
			if ( isset( $post['sslsig'] ) ) {
				$sslsig = $post['sslsig'];
				unset( $post['sslsig'] );
			}
			if ( 1 === openssl_verify( serialize( array( 'uri' => $uri, 'post' => $post ) ), base64_decode( $sslsig ), $this->get_option( 'public_key' ) ) ) {
				return true;
			} else {
				$__vp_validate_error = array( 'error' => 'invalid_signed_data' );
				return false;
			}
		}

		$signature = $this->sign_string( $to_sign, $secret, $sig[1] );
		if ( hash_equals( $sig[0], $signature ) ) {
			return true;
		}

		$__vp_validate_error = array( 'error' => 'invalid_signed_data' );
		return false;
	}

	function ip_in_cidr( $ip, $cidr ) {
		list ($net, $mask) = explode( '/', $cidr );
		return ( ip2long( $ip ) & ~((1 << (32 - $mask)) - 1) ) == ( ip2long( $net ) & ~((1 << (32 - $mask)) - 1) );
	}

	function ip_in_cidrs( $ip, $cidrs ) {
		foreach ( (array)$cidrs as $cidr ) {
			if ( $this->ip_in_cidr( $ip, $cidr ) ) {
				return $cidr;
			}
		}

		return false;
	}

	function check_firewall() {
		global $__vp_validate_error;

		$stored_cidrs = $this->get_option( 'service_ips_cidr' );
		$stored_ext_cidrs = get_option( 'vaultpress_service_ips_external_cidr' );

		$one_day_ago = time() - 86400;
		if ( empty( $stored_cidrs ) || empty( $stored_ext_cidrs ) || $stored_cidrs['updated'] < $one_day_ago ) {
			$cidrs = $this->update_firewall();
		}

		if ( empty( $cidrs ) ) {
			$cidrs = array_merge( $stored_cidrs['data'], $stored_ext_cidrs['data'] );
		}

		if ( empty( $cidrs ) ) {
			//	No up-to-date info; fall back on the old methods.
			if ( $this->do_c_block_firewall() ) {
				return true;
			} else {
				$__vp_validate_error = array( 'error' => 'empty_vp_ip_cidr_range' );
				return false;
			}
		}

		//	Figure out possible remote IPs
		$remote_ips = array();
		if ( !empty( $_SERVER['REMOTE_ADDR'] ) )
			$remote_ips['REMOTE_ADDR'] = $_SERVER['REMOTE_ADDR'];

		// If this is a pingback during a connection test, search for valid-looking ips among headers
		$connection_test_key = $this->get_option( 'connection_test' );
		$testing_all_headers = ( ! empty( $_POST['test_key'] ) && $_POST['test_key'] === $connection_test_key );
		if ( $testing_all_headers ) {
			$remote_ips = array_filter( $_SERVER, array( $this, 'looks_like_ip_list' ) );
		}

		// If there is a pre-configured forwarding IP header, check that.
		$forward_header = $this->get_option( 'allow_forwarded_for' );
		if ( true === $forward_header || 1 == $forward_header ) {
			$forward_header = 'HTTP_X_FORWARDED_FOR';
		}
		if ( ! empty( $forward_header ) && ! empty( $_SERVER[ $forward_header ] ) ) {
			$remote_ips[ $forward_header ] = $_SERVER[ $forward_header ];
		}

		if ( empty( $remote_ips ) ) {
			$__vp_validate_error = array( 'error' => 'no_remote_addr', 'detail' => (int) $this->get_option( 'allow_forwarded_for' ) ); // shouldn't happen
			return false;
		}

		foreach ( $remote_ips as $header_name => $ip_list ) {
			$ips = explode( ',', $ip_list );
			foreach ( $ips as $ip ) {
				$ip = preg_replace( '#^::(ffff:)?#', '', $ip );
				if ( $cidr = $this->ip_in_cidrs( $ip, $cidrs ) ) {
					// Successful match found. If testing all headers, note the successful header.
					if ( $testing_all_headers && 'REMOTE_ADDR' !== $header_name ) {
						$this->update_option( 'allow_forwarded_for', $header_name );
					}

					return true;
				}
			}
		}

		$__vp_validate_error = array( 'error' => 'remote_addr_fail', 'detail' => $remote_ips );
		return false;
	}

	// Returns true if $value looks like a comma-separated list of IPs
	function looks_like_ip_list( $value ) {
		if ( ! is_string( $value ) ) {
			return false;
		}

		$items = explode( ',', $value );
		foreach ( $items as $item ) {
			if ( ip2long( $item ) === false ) {
				return false;
			}
		}

		return true;
	}

	function do_c_block_firewall() {
		//	Perform the firewall check by class-c ip blocks
		$rxs = $this->get_option( 'service_ips' );
		$service_ips_external = get_option( 'vaultpress_service_ips_external' );

		if ( !empty( $rxs['data'] ) && !empty( $service_ips_external['data'] ) )
			$rxs = array_merge( $rxs['data'], $service_ips_external['data'] );
		if ( ! $rxs )
			return false;
		return $this->validate_ip_address( $rxs );
	}

	function validate_ip_address( $rxs ) {
		global $__vp_validate_error;
		if ( empty( $rxs ) ) {
			$__vp_validate_error = array( 'error' => 'empty_vp_ip_range' );
			return false;
		}

		$remote_ips = array();

		if ( $this->get_option( 'allow_forwarded_for') && !empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) )
			$remote_ips = explode( ',', $_SERVER['HTTP_X_FORWARDED_FOR'] );

		if ( !empty( $_SERVER['REMOTE_ADDR'] ) )
			$remote_ips[] = $_SERVER['REMOTE_ADDR'];

		if ( empty( $remote_ips ) ) {
			$__vp_validate_error = array( 'error' => 'no_remote_addr', 'detail' => (int) $this->get_option( 'allow_forwarded_for' ) ); // shouldn't happen
			return false;
		}

		$iprx = '/^([0-9]+\.[0-9]+\.[0-9]+\.)([0-9]+)$/';

		foreach ( $remote_ips as $_remote_ip ) {
			$remote_ip = preg_replace( '#^::(ffff:)?#', '', $_remote_ip );
			if ( !preg_match( $iprx, $remote_ip, $r ) ) {
				$__vp_validate_error = array( 'error' => "remote_addr_fail", 'detail' => $_remote_ip );
				return false;
			}

			foreach ( (array)$rxs as $begin => $end ) {
				if ( !preg_match( $iprx, $begin, $b ) )
					continue;
				if ( !preg_match( $iprx, $end, $e ) )
					continue;
				if ( $r[1] != $b[1] || $r[1] != $e[1] )
					continue;
				$me = $r[2];
				$b = min( (int)$b[2], (int)$e[2] );
				$e = max( (int)$b[2], (int)$e[2] );
				if ( $me >= $b &&  $me <= $e ) {
					return true;
				}
			}
		}
		$__vp_validate_error = array( 'error' => 'remote_addr_fail', 'detail' => $remote_ips );

		return false;
	}

	function sign_string( $string, $secret, $salt ) {
		return hash_hmac( 'sha1', "$string:$salt", $secret );
	}

	function can_use_openssl() {
		if ( !function_exists( 'openssl_verify' ) )
			return false;
		$pk = $this->get_option( 'public_key' );
		if ( empty( $pk ) )
			return false;
		if ( 1 !== (int) $this->get_option( 'use_openssl_signing' ) )
			return false;
		return true;
	}

	function response( $response, $raw = false ) {
		// "re" -- "Response Encoding"
		if ( !empty( $_GET['re'] ) )
			header( sprintf( 'X-VP-Encoded: X%d', abs( intval( $_GET['re'] ) ) ) );
		if ( $raw ) {
			if ( !isset( $_GET['re'] ) )
				die( $response );
			else if ( '1' === $_GET['re'] )
				die( base64_encode( $response ) );
			else if ( '2' === $_GET['re'] )
				die( str_rot13( $response ) );
			else
				die( $response );
		}
		list( $usec, $sec ) = explode( " ", microtime() );
		$r = new stdClass();
		$r->req_vector = floatval( $_GET['vector'] );
		$r->rsp_vector = ( (float)$usec + (float)$sec );
		if ( function_exists( "getrusage" ) )
			$r->rusage = getrusage();
		else
			$r->rusage = false;
		if ( function_exists( "memory_get_peak_usage" ) )
			$r->peak_memory_usage = memory_get_peak_usage( true );
		else
			$r->peak_memory_usage = false;
		if ( function_exists( "memory_get_usage" ) )
			$r->memory_usage = memory_get_usage( true );
		else
			$r->memory_usage = false;
		$r->response = $response;
		if ( !isset( $_GET['re'] ) )
			die( serialize( $r )  );
		else if ( '1' === $_GET['re'] )
			die( base64_encode( serialize( $r )  ) );
		else if ( '2' === $_GET['re'] )
			die( str_rot13( serialize( $r )  ) );
		else
			die( serialize( $r ) );
	}

	function reset_pings() {
		global $vaultpress_pings;
		$vaultpress_pings = array(
			'version'      => 1,
			'count'        => 0,
			'editedtables' => array(),
			'plugins'      => array(),
			'themes'       => array(),
			'uploads'      => array(),
			'db'           => array(),
			'debug'        => array(),
			'security'     => array(),
		);
	}

	function add_ping( $type, $data, $hook=null ) {
		global $vaultpress_pings;
		if ( defined( 'WP_IMPORTING' ) && constant( 'WP_IMPORTING' ) )
			return;
		if ( isset( $_GET ) && isset( $_GET['comment_status'] ) && isset( $_GET['delete_all'] ) && 'spam' == $_GET['comment_status'] )
			return;	// Skip pings from mass spam delete.
		if ( !array_key_exists( $type, $vaultpress_pings ) )
			return;

		switch( $type ) {
			case 'editedtables';
				$vaultpress_pings[$type] = $data;
				return;
			case 'uploads':
			case 'themes':
			case 'plugins':
				if ( !is_array( $data ) ) {
					$data = array( $data );
				}
				foreach ( $data as $val ) {
					if ( in_array( $data, $vaultpress_pings[$type] ) )
						continue;
					$vaultpress_pings['count']++;
					$vaultpress_pings[$type][]=$val;
				}
				return;
			case 'db':
				$_keys = array_keys( $data );
				$subtype = array_shift( $_keys );
				if ( !isset( $vaultpress_pings[$type][$subtype] ) )
					$vaultpress_pings[$type][$subtype] = array();
				if ( in_array( $data, $vaultpress_pings[$type][$subtype] ) )
					return;
				$vaultpress_pings['count']++;
				$vaultpress_pings[$type][$subtype][] = $data;
				return;
			default:
				if ( in_array( $data, $vaultpress_pings[$type] ) )
					return;
				$vaultpress_pings['count']++;
				$vaultpress_pings[$type][] = $data;
				return;
		}
	}

	function do_pings() {
		global $wpdb, $vaultpress_pings, $__vp_recursive_ping_lock;
		if ( defined( 'WP_IMPORTING' ) && constant( 'WP_IMPORTING' ) )
			return;

		if ( !isset( $wpdb ) ) {
			$wpdb = new wpdb( DB_USER, DB_PASSWORD, DB_NAME, DB_HOST );
			$close_wpdb = true;
		} else {
			$close_wpdb = false;
		}

		if ( !$vaultpress_pings['count'] )
			return;

		// Short circuit the contact process if we know that we can't contact the service
		if ( isset( $__vp_recursive_ping_lock ) && $__vp_recursive_ping_lock ) {
			$this->ai_ping_insert( serialize( $vaultpress_pings ) );
			if ( $close_wpdb ) {
				$wpdb->__destruct();
				unset( $wpdb );
			}
			$this->reset_pings();
			return;
		}

		$ping_attempts = 0;
		do {
			$ping_attempts++;
			$rval = $this->contact_service( 'ping', array( 'args' => $vaultpress_pings ) );
			if ( $rval || $ping_attempts >= 3 )
				break;
			if ( !$rval )
				usleep(500000);
		} while ( true );
		if ( !$rval ) {
			if ( $this->get_option( 'connection_error_code' ) !== -8 ) {    // Do not save pings when the subscription is inactive.
				$__vp_recursive_ping_lock = true;
				$this->ai_ping_insert( serialize( $vaultpress_pings ) );
			}
		}
		$this->reset_pings();
		if ( $close_wpdb ) {
			$wpdb->__destruct();
			unset( $wpdb );
		}
		return $rval;
	}

	function resolve_content_dir() {
		// Take the easy way out
		if ( defined( 'WP_CONTENT_DIR' ) ) {
			if ( substr( WP_CONTENT_DIR, -1 ) != DIRECTORY_SEPARATOR )
				return WP_CONTENT_DIR . DIRECTORY_SEPARATOR;
			return WP_CONTENT_DIR;
		}
		// Best guess
		if ( defined( 'ABSPATH' ) ) {
			if ( substr( ABSPATH, -1 ) != DIRECTORY_SEPARATOR )
				return ABSPATH . DIRECTORY_SEPARATOR . 'wp-content' . DIRECTORY_SEPARATOR;
			return ABSPATH . 'wp-content' . DIRECTORY_SEPARATOR;
		}
		// Run with a solid assumption: WP_CONTENT_DIR/vaultpress/vaultpress.php
		return dirname( dirname( __FILE__ ) ) . DIRECTORY_SEPARATOR;
	}

	function resolve_upload_path() {
		$upload_path = false;
		$upload_dir = wp_upload_dir();

		if ( isset( $upload_dir['basedir'] ) )
			$upload_path = $upload_dir['basedir'];

		// Nothing recorded? use a best guess!
		if ( !$upload_path || $upload_path == realpath( ABSPATH ) )
			return $this->resolve_content_dir() . 'uploads' . DIRECTORY_SEPARATOR;

		if ( substr( $upload_path, -1 ) != DIRECTORY_SEPARATOR )
			$upload_path .= DIRECTORY_SEPARATOR;

		return $upload_path;
	}

	function load_first( $value ) {
		$value = array_unique( $value ); // just in case there are duplicates
		return array_merge(
			preg_grep( '/vaultpress\.php$/', $value ),
			preg_grep( '/vaultpress\.php$/', $value, PREG_GREP_INVERT )
		);
	}

	function is_multisite() {
		if ( function_exists( 'is_multisite' ) )
			return is_multisite();

		return false;
	}

	function is_main_site() {
		if ( !function_exists( 'is_main_site' ) || !$this->is_multisite() )
			return true;

		return is_main_site();
	}

	function is_registered() {
		$key    = $this->get_option( 'key' );
		$secret = $this->get_option( 'secret' );
		return !empty( $key ) && !empty( $secret );
	}

	function clear_connection() {
		$this->delete_option( 'connection' );
		$this->delete_option( 'connection_error_code' );
		$this->delete_option( 'connection_error_message' );
		$this->delete_option( 'connection_test' );
	}

	function site_url() {
		$site_url = '';

		// compatibility for WordPress MU Domain Mapping plugin
		if ( defined( 'DOMAIN_MAPPING' ) && DOMAIN_MAPPING && ! function_exists( 'domain_mapping_siteurl' ) ) {
			if ( !function_exists( 'is_plugin_active' ) )
				require_once ABSPATH . '/wp-admin/includes/plugin.php';

			$plugin = 'wordpress-mu-domain-mapping/domain_mapping.php';
			if ( is_plugin_active( $plugin ) )
				include_once( WP_PLUGIN_DIR . '/' . $plugin );
		}

		if ( function_exists( 'domain_mapping_siteurl' ) )
			$site_url = domain_mapping_siteurl( false );

		if ( empty( $site_url ) )
			$site_url = site_url();

		return $site_url;
	}

	/**
	 * Sync the VaultPress options to WordPress.com if the Jetpack plugin is active.
	 */
	function sync_jetpack_options() {
		if ( class_exists( 'Jetpack_Sync' ) && method_exists( 'Jetpack_Sync', 'sync_options' ) && defined( 'JETPACK__VERSION' ) && version_compare( JETPACK__VERSION, '4.1', '<' ) ) {
			Jetpack_Sync::sync_options( __FILE__, $this->auto_register_option, $this->option_name );
		}
	}

	/**
	 * Add the VaultPress options to the Jetpack options management whitelist.
	 * Allows Jetpack to register VaultPress options automatically.
	 *
	 * @param array $options The list of whitelisted option names.
	 *
	 * @return array The updated whitelist
	 */
	function add_to_jetpack_options_whitelist( $options ) {
		$options[] = $this->option_name;
		$options[] = $this->auto_register_option;

		return $options;
	}

	/**
	 * When the VaultPress auto-register option is updated, run the registration call.
	 *
	 * This should only be run when the option is updated from the Jetpack/WP.com
	 * API call, and only if the new key is different than the old key.
	 *
	 * @param mixed $old_value The old option value, or the option name (if add_option).
	 * @param mixed $value     The new option value.
	 */
	function updated_auto_register_option( $old_value, $value ) {
		// Not an API call or CLI call
		if ( ! class_exists( 'WPCOM_JSON_API_Update_Option_Endpoint' ) && ! ( defined( 'WP_CLI' ) && WP_CLI ) ) {
			return;
		}

		remove_action( "update_option_{$this->auto_register_option}", array( $this, 'updated_auto_register_option' ) );

		$defaults = array(
			'key'    => false,
			'action' => 'register', // or `response`
			'status' => 'working',
			'error'  => false,
		);

		// `wp_parse_args` uses arrays, might as well be explicit about it.
		$registration = (array) json_decode( $value );
		$registration = wp_parse_args( $registration, $defaults );

		// If we have a working connection, don't update the key.
		if ( $this->check_connection( true ) ) {
			$registration['action'] = 'response';
			$registration['error'] = 'VaultPress is already registered on this site.';
			update_option( $this->auto_register_option, json_encode( $registration ) );
			return;
		}

		if ( ! $registration['key'] ) {
			return;
		}

		$registration['action'] = 'response';

		$response = $this->register( $registration['key'] );
		if ( is_wp_error( $response ) ) {
			$registration['status'] = 'broken';
			$registration['error'] = $response->get_error_message();
		} else if ( $this->get_option( 'connection_error_code' ) ) {
			$registration['status'] = 'broken';
			$registration['error'] = $this->get_option( 'connection_error_message' );
		} else {
			$registration['error'] = false;
		}

		update_option( $this->auto_register_option, json_encode( $registration ) );
	}

	function add_global_actions_and_filters() {
		add_action( 'init',                                        array( $this, 'sync_jetpack_options' ), 0, 99 );
		add_filter( 'jetpack_options_whitelist',                   array( $this, 'add_to_jetpack_options_whitelist' ) );
		add_action( "update_option_{$this->auto_register_option}", array( $this, 'updated_auto_register_option' ), 10, 2 );
		add_action( "add_option_{$this->auto_register_option}",    array( $this, 'updated_auto_register_option' ), 10, 2 );
		add_action( 'admin_enqueue_scripts',                       array( $this, 'styles' ) );
	}

	function add_admin_actions_and_filters() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ), 5 ); # Priority 5, so it's called before Jetpack's admin_menu.
		add_action( 'admin_head', array( $this, 'admin_head' ) );
	}

	function add_listener_actions_and_filters() {
		add_action( 'admin_bar_menu', array( $this, 'toolbar' ), 999 );

		// Comments
		add_action( 'delete_comment',        array( $this, 'comment_action_handler' ) );
		add_action( 'wp_set_comment_status', array( $this, 'comment_action_handler' ) );
		add_action( 'trashed_comment',       array( $this, 'comment_action_handler' ) );
		add_action( 'untrashed_comment',     array( $this, 'comment_action_handler' ) );
		add_action( 'wp_insert_comment',     array( $this, 'comment_action_handler' ) );
		add_action( 'comment_post',          array( $this, 'comment_action_handler' ) );
		add_action( 'edit_comment',          array( $this, 'comment_action_handler' ) );

		// Commentmeta
		add_action( 'added_comment_meta',   array( $this, 'commentmeta_insert_handler' ), 10, 2 );
		add_action( 'updated_comment_meta', array( $this, 'commentmeta_modification_handler' ), 10, 4 );
		add_action( 'deleted_comment_meta', array( $this, 'commentmeta_modification_handler' ), 10, 4 );

		// Users
		if ( $this->is_main_site() ) {
			add_action( 'user_register',  array( $this, 'userid_action_handler' ) );
			add_action( 'password_reset', array( $this, 'userid_action_handler' ) );
			add_action( 'profile_update', array( $this, 'userid_action_handler' ) );
			add_action( 'user_register',  array( $this, 'userid_action_handler' ) );
			add_action( 'deleted_user',   array( $this, 'userid_action_handler' ) );
		}

		// Usermeta
		if ( $this->is_main_site() ) {
			// Keeping these action hooks for backward compatibility
			add_action( 'added_usermeta',  array( $this, 'usermeta_action_handler' ), 10, 4 );
			add_action( 'update_usermeta', array( $this, 'usermeta_action_handler' ), 10, 4 );
			add_action( 'delete_usermeta', array( $this, 'usermeta_action_handler' ), 10, 4 );

			add_action( 'added_user_meta',  array( $this, 'usermeta_action_handler' ), 10, 4 );
			add_action( 'update_user_meta', array( $this, 'usermeta_action_handler' ), 10, 4 );
			add_action( 'delete_user_meta', array( $this, 'usermeta_action_handler' ), 10, 4 );
		}

		// Posts
		add_action( 'delete_post',              array( $this, 'post_action_handler' ) );
		add_action( 'trash_post',               array( $this, 'post_action_handler' ) );
		add_action( 'untrash_post',             array( $this, 'post_action_handler' ) );
		add_action( 'edit_post',                array( $this, 'post_action_handler' ) );
		add_action( 'save_post',                array( $this, 'post_action_handler' ) );
		add_action( 'wp_insert_post',           array( $this, 'post_action_handler' ) );
		add_action( 'edit_attachment',          array( $this, 'post_action_handler' ) );
		add_action( 'add_attachment',           array( $this, 'post_action_handler' ) );
		add_action( 'delete_attachment',        array( $this, 'post_action_handler' ) );
		add_action( 'private_to_publish',       array( $this, 'post_action_handler' ) );
		add_action( 'wp_restore_post_revision', array( $this, 'post_action_handler' ) );

		// Postmeta
		add_action( 'added_post_meta',   array( $this, 'postmeta_insert_handler' ), 10, 4 );
		add_action( 'update_post_meta',  array( $this, 'postmeta_modification_handler' ), 10, 4 );
		add_action( 'updated_post_meta', array( $this, 'postmeta_modification_handler' ), 10, 4 );
		add_action( 'delete_post_meta',  array( $this, 'postmeta_modification_handler' ), 10, 4 );
		add_action( 'deleted_post_meta', array( $this, 'postmeta_modification_handler' ), 10, 4 );
		add_action( 'added_postmeta',    array( $this, 'postmeta_action_handler' ), 10, 3 );
		add_action( 'update_postmeta',   array( $this, 'postmeta_action_handler' ), 10, 3 );
		add_action( 'delete_postmeta',   array( $this, 'postmeta_action_handler' ), 10, 3 );

		// Links
		add_action( 'edit_link',   array( $this, 'link_action_handler' ) );
		add_action( 'add_link',    array( $this, 'link_action_handler' ) );
		add_action( 'delete_link', array( $this, 'link_action_handler' ) );

		// Taxonomy
		add_action( 'created_term',              array( $this, 'term_handler' ), 2 );
		add_action( 'edited_terms',              array( $this, 'term_handler' ), 2 );
		add_action( 'delete_term',               array( $this, 'term_handler' ), 2 );
		add_action( 'edit_term_taxonomy',        array( $this, 'term_taxonomy_handler' ) );
		add_action( 'delete_term_taxonomy',      array( $this, 'term_taxonomy_handler' ) );
		add_action( 'edit_term_taxonomies',      array( $this, 'term_taxonomies_handler' ) );
		add_action( 'add_term_relationship',     array( $this, 'term_relationship_handler' ), 10, 2 );
		add_action( 'delete_term_relationships', array( $this, 'term_relationships_handler' ), 10, 2 );
		add_action( 'set_object_terms',          array( $this, 'set_object_terms_handler' ), 10, 3 );

		// Files
		if ( $this->is_main_site() ) {
			add_action( 'switch_theme',      array( $this, 'theme_action_handler' ) );
			add_action( 'activate_plugin',   array( $this, 'plugin_action_handler' ) );
			add_action( 'deactivate_plugin', array( $this, 'plugin_action_handler' ) );
		}
		add_action( 'wp_handle_upload',  array( $this, 'upload_handler' ) );

		// Options
		add_action( 'deleted_option', array( $this, 'option_handler' ), 1 );
		add_action( 'updated_option', array( $this, 'option_handler' ), 1 );
		add_action( 'added_option',   array( $this, 'option_handler' ), 1 );

		$this->add_woocommerce_actions();
		$this->add_vp_required_filters();
	}

	function add_woocommerce_actions() {
		add_action( 'woocommerce_tax_rate_deleted', array( $this, 'woocommerce_tax_rate_handler' ), 10, 1 );
		add_action( 'woocommerce_tax_rate_updated', array( $this, 'woocommerce_tax_rate_handler' ), 10, 1 );
		add_action( 'woocommerce_tax_rate_added', array( $this, 'woocommerce_tax_rate_handler' ), 10, 1 );

		add_action( 'woocommerce_new_order_item', array( $this, 'woocommerce_order_item_handler' ), 10, 1 );
		add_action( 'woocommerce_update_order_item', array( $this, 'woocommerce_order_item_handler' ), 10, 1 );
		add_action( 'woocommerce_delete_order_item', array( $this, 'woocommerce_order_item_handler' ), 10, 1 );

		add_action( 'added_order_item_meta', array( $this, 'woocommerce_order_item_meta_handler' ), 10, 1 );
		add_action( 'updated_order_item_meta', array( $this, 'woocommerce_order_item_meta_handler' ), 10, 1 );
		add_action( 'deleted_order_item_meta', array( $this, 'woocommerce_order_item_meta_handler' ), 10, 1 );

		add_action( 'woocommerce_attribute_added', array( $this, 'woocommerce_attribute_handler' ), 10, 1 );
		add_action( 'woocommerce_attribute_updated', array( $this, 'woocommerce_attribute_handler' ), 10, 1 );
		add_action( 'woocommerce_attribute_deleted', array( $this, 'woocommerce_attribute_handler' ), 10, 1 );
	}

	function add_vp_required_filters() {
		// Log ins
		if ( $this->get_option( 'login_lockdown' ) ) {
			add_action( 'login_form', array( $this, 'add_js_token' ) );
			add_filter( 'authenticate', array( $this, 'authenticate' ), 999 );
		}

		// Report back to VaultPress
		add_action( 'shutdown', array( $this, 'do_pings' ) );

		// VaultPress likes being first in line
		add_filter( 'pre_update_option_active_plugins', array( $this, 'load_first' ) );
	}

	function get_jetpack_email() {
		if ( ! class_exists( 'Jetpack' ) ) {
			return false;
		}

		// For version of Jetpack prior to 7.7.
		if ( defined( 'JETPACK__VERSION' ) && version_compare( JETPACK__VERSION, '7.7', '<' ) && ! class_exists( 'Jetpack_IXR_Client' ) ) {
			Jetpack::load_xml_rpc_client();
		}

		$xml = new Jetpack_IXR_Client( array( 'user_id' => get_current_user_id() ) );
		$xml->query( 'wpcom.getUserEmail' );
		if ( ! $xml->isError() ) {
			return $xml->getResponse();
		}

		return new WP_Error( $xml->getErrorCode(), $xml->getErrorMessage() );
	}

	function get_key_via_jetpack( $already_purchased = false ) {
		if ( ! class_exists( 'Jetpack' ) ) {
			return false;
		}

		// For version of Jetpack prior to 7.7.
		if ( defined( 'JETPACK__VERSION' ) && version_compare( JETPACK__VERSION, '7.7', '<' ) && ! class_exists( 'Jetpack_IXR_Client' ) ) {
			Jetpack::load_xml_rpc_client();
		}

		$xml = new Jetpack_IXR_Client( array( 'user_id' => Jetpack_Options::get_option( 'master_user' ) ) );
		$xml->query( 'vaultpress.registerSite', $already_purchased );
		if ( ! $xml->isError() ) {
			return $xml->getResponse();
		}

		return new WP_Error( $xml->getErrorCode(), $xml->getErrorMessage() );
	}

	function register_via_jetpack( $already_purchased = false ) {
		$registration_key = $this->get_key_via_jetpack( $already_purchased );
		if ( is_wp_error( $registration_key ) ) {
			return $registration_key;
		}

		return self::register( $registration_key );
	}
}

$vaultpress = VaultPress::init();

if ( isset( $_GET['vaultpress'] ) && $_GET['vaultpress'] ) {
	if ( !function_exists( 'wp_magic_quotes' ) ) {
		// Escape with wpdb.
		$_GET    = add_magic_quotes( $_GET    );
		$_POST   = add_magic_quotes( $_POST   );
		$_COOKIE = add_magic_quotes( $_COOKIE );
		$_SERVER = add_magic_quotes( $_SERVER );

		// Force REQUEST to be GET + POST.  If SERVER, COOKIE, or ENV are needed, use those superglobals directly.
		$_REQUEST = array_merge( $_GET, $_POST );
	} else {
		wp_magic_quotes();
	}

	if ( !function_exists( 'wp_get_current_user' ) )
		include ABSPATH . '/wp-includes/pluggable.php';

	// TODO: this prevents some error notices but do we need it? is there a better way to check capabilities/logged in user/etc?
	if ( function_exists( 'wp_cookie_constants' ) && !defined( 'AUTH_COOKIE' ) )
		wp_cookie_constants();

	$vaultpress->parse_request( null );

	die();
}

// only load hotfixes if it's not a VP request
require_once( dirname( __FILE__ ) . '/class.vaultpress-hotfixes.php' );
$hotfixes = new VaultPress_Hotfixes();

// Add a helper method to WP CLI for auto-registerion via Jetpack
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once( dirname( __FILE__ ) . '/class.vaultpress-cli.php' );
}

include_once( dirname( __FILE__ ) . '/cron-tasks.php' );
