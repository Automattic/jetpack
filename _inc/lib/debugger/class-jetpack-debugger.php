<?php
/**
 * Jetpack Debugger functionality allowing for self-service diagnostic information.
 *
 * @package jetpack
 */

/**
 * Class Jetpack_Debugger
 *
 * A namespacing class for functionality related to the in-plugin diagnostic tooling.
 */
class Jetpack_Debugger {

	/**
	 * Determine the active plan and normalize it for the debugger results.
	 *
	 * @return string The plan slug prepended with "JetpackPlan"
	 */
	private static function what_jetpack_plan() {
		$plan = Jetpack_Plan::get();
		$plan = ! empty( $plan['class'] ) ? $plan['class'] : 'undefined';
		return 'JetpackPlan' . $plan;
	}

	/**
	 * Convert seconds to human readable time.
	 *
	 * A dedication function instead of using Core functionality to allow for output in seconds.
	 *
	 * @param int $seconds Number of seconds to convert to human time.
	 *
	 * @return string Human readable time.
	 */
	public static function seconds_to_time( $seconds ) {
		$seconds = intval( $seconds );
		$units   = array(
			'week'   => WEEK_IN_SECONDS,
			'day'    => DAY_IN_SECONDS,
			'hour'   => HOUR_IN_SECONDS,
			'minute' => MINUTE_IN_SECONDS,
			'second' => 1,
		);
		// specifically handle zero.
		if ( 0 === $seconds ) {
			return '0 seconds';
		}
		$human_readable = '';
		foreach ( $units as $name => $divisor ) {
			$quot = intval( $seconds / $divisor );
			if ( $quot ) {
				$human_readable .= "$quot $name";
				$human_readable .= ( abs( $quot ) > 1 ? 's' : '' ) . ', ';
				$seconds        -= $quot * $divisor;
			}
		}
		return substr( $human_readable, 0, -2 );
	}

	/**
	 * Returns 30 for use with a filter.
	 *
	 * To allow time for WP.com to run upstream testing, this function exists to increase the http_request_timeout value
	 * to 30.
	 *
	 * @return int 30
	 */
	public static function jetpack_increase_timeout() {
		return 30; // seconds.
	}

	/**
	 * Disconnect Jetpack and redirect user to connection flow.
	 */
	public static function disconnect_and_redirect() {
		if ( ! ( isset( $_GET['nonce'] ) && wp_verify_nonce( $_GET['nonce'], 'jp_disconnect' ) ) ) {
			return;
		}

		if ( isset( $_GET['disconnect'] ) && $_GET['disconnect'] ) {
			if ( Jetpack::is_active() ) {
				Jetpack::disconnect();
				wp_safe_redirect( Jetpack::admin_url() );
				exit;
			}
		}
	}

	/**
	 * Handles output to the browser for the in-plugin debugger.
	 */
	public static function jetpack_debug_display_handler() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'jetpack' ) );
		}

		$user_id     = get_current_user_id();
		$user_tokens = Jetpack_Options::get_option( 'user_tokens' );
		if ( is_array( $user_tokens ) && array_key_exists( $user_id, $user_tokens ) ) {
			$user_token = $user_tokens[ $user_id ];
		} else {
			$user_token = '[this user has no token]';
		}
		unset( $user_tokens );

		$debug_info = "\r\n";
		foreach ( array(
			'CLIENT_ID'   => 'id',
			'BLOG_TOKEN'  => 'blog_token',
			'MASTER_USER' => 'master_user',
			'CERT'        => 'fallback_no_verify_ssl_certs',
			'TIME_DIFF'   => 'time_diff',
			'VERSION'     => 'version',
			'OLD_VERSION' => 'old_version',
			'PUBLIC'      => 'public',
		) as $label => $option_name ) {
			$debug_info .= "\r\n" . esc_html( $label . ': ' . Jetpack_Options::get_option( $option_name ) );
		}

		$debug_info .= "\r\n" . esc_html( 'USER_ID: ' . $user_id );
		$debug_info .= "\r\n" . esc_html( 'USER_TOKEN: ' . $user_token );
		$debug_info .= "\r\n" . esc_html( 'PHP_VERSION: ' . PHP_VERSION );
		$debug_info .= "\r\n" . esc_html( 'WORDPRESS_VERSION: ' . $GLOBALS['wp_version'] );
		$debug_info .= "\r\n" . esc_html( 'JETPACK__VERSION: ' . JETPACK__VERSION );
		$debug_info .= "\r\n" . esc_html( 'JETPACK__PLUGIN_DIR: ' . JETPACK__PLUGIN_DIR );
		$debug_info .= "\r\n" . esc_html( 'SITE_URL: ' . site_url() );
		$debug_info .= "\r\n" . esc_html( 'HOME_URL: ' . home_url() );
		$debug_info .= "\r\n" . esc_html( 'PLAN: ' . self::what_jetpack_plan() );

		$debug_info .= "\r\n";

		$debug_info .= "\r\n" . '-- SYNC Status -- ';
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-modules.php';
		$sync_module = Jetpack_Sync_Modules::get_module( 'full-sync' );
		if ( $sync_module ) {
			$sync_statuses              = $sync_module->get_status();
			$human_readable_sync_status = array();
			foreach ( $sync_statuses  as $sync_status => $sync_status_value ) {
				$human_readable_sync_status[ $sync_status ] =
					in_array( $sync_status, array( 'started', 'queue_finished', 'send_started', 'finished' ), true )
						? date( 'r', $sync_status_value ) : $sync_status_value;
			}
			/* translators: A string reporting status. Example: "started" */
			$debug_info .= "\r\n" . sprintf( esc_html__( 'Jetpack Sync Full Status: `%1$s`', 'jetpack' ), print_r( $human_readable_sync_status, 1 ) ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
		}

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-sender.php';

		$queue = Jetpack_Sync_Sender::get_instance()->get_sync_queue();

		/* translators: The number of items waiting to be synced. */
		$debug_info .= "\r\n" . sprintf( esc_html__( 'Sync Queue size: %1$s', 'jetpack' ), $queue->size() );
		/* translators: Human-readable time since the oldest item in the sync queue. */
		$debug_info .= "\r\n" . sprintf( esc_html__( 'Sync Queue lag: %1$s', 'jetpack' ), self::seconds_to_time( $queue->lag() ) );

		$full_sync_queue = Jetpack_Sync_Sender::get_instance()->get_full_sync_queue();

		/* translators: The number of items waiting to be synced. */
		$debug_info .= "\r\n" . sprintf( esc_html__( 'Full Sync Queue size: %1$s', 'jetpack' ), $full_sync_queue->size() );
		/* translators: Human-readable time since the oldest item in the sync queue. */
		$debug_info .= "\r\n" . sprintf( esc_html__( 'Full Sync Queue lag: %1$s', 'jetpack' ), self::seconds_to_time( $full_sync_queue->lag() ) );

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-functions.php';
		$idc_urls = array(
			'home'       => Jetpack_Sync_Functions::home_url(),
			'siteurl'    => Jetpack_Sync_Functions::site_url(),
			'WP_HOME'    => Jetpack_Constants::is_defined( 'WP_HOME' ) ? Jetpack_Constants::get_constant( 'WP_HOME' ) : '',
			'WP_SITEURL' => Jetpack_Constants::is_defined( 'WP_SITEURL' ) ? Jetpack_Constants::get_constant( 'WP_SITEURL' ) : '',
		);
		/* translators: List of URLs. */
		$debug_info .= "\r\n" . esc_html( sprintf( 'Sync IDC URLs: %s', wp_json_encode( $idc_urls ) ) );
		/* translators: String of a current option. */
		$debug_info .= "\r\n" . esc_html( sprintf( 'Sync error IDC option: %s', wp_json_encode( Jetpack_Options::get_option( 'sync_error_idc' ) ) ) );
		/* translators: String of a current option. */
		$debug_info .= "\r\n" . esc_html( sprintf( 'Sync IDC Optin: %s', (string) Jetpack::sync_idc_optin() ) );

		$debug_info .= "\r\n";

		foreach ( array(
			'HTTP_HOST',
			'SERVER_PORT',
			'HTTPS',
			'GD_PHP_HANDLER',
			'HTTP_AKAMAI_ORIGIN_HOP',
			'HTTP_CF_CONNECTING_IP',
			'HTTP_CLIENT_IP',
			'HTTP_FASTLY_CLIENT_IP',
			'HTTP_FORWARDED',
			'HTTP_FORWARDED_FOR',
			'HTTP_INCAP_CLIENT_IP',
			'HTTP_TRUE_CLIENT_IP',
			'HTTP_X_CLIENTIP',
			'HTTP_X_CLUSTER_CLIENT_IP',
			'HTTP_X_FORWARDED',
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_IP_TRAIL',
			'HTTP_X_REAL_IP',
			'HTTP_X_VARNISH',
			'REMOTE_ADDR',
		) as $header ) {
			if ( isset( $_SERVER[ $header ] ) ) {
				$debug_info .= "\r\n" . esc_html( $header . ': ' . $_SERVER[ $header ] );
			}
		}

		$debug_info .= "\r\n" . esc_html( 'PROTECT_TRUSTED_HEADER: ' . wp_json_encode( get_site_option( 'trusted_ip_header' ) ) );

		$debug_info .= "\r\n\r\nTEST RESULTS:\r\n\r\n";

		$cxntests = new Jetpack_Cxn_Tests();
		?>
		<div class="wrap">
			<h2><?php esc_html_e( 'Debugging Center', 'jetpack' ); ?></h2>
				<h3><?php esc_html_e( "Testing your site's compatibility with Jetpack...", 'jetpack' ); ?></h3>
				<div class="jetpack-debug-test-container">
					<?php
					if ( $cxntests->pass() ) {
						echo '<div class="jetpack-tests-succeed">' . esc_html__( 'Your Jetpack setup looks a-okay!', 'jetpack' ) . '</div>';
						$debug_info .= "All tests passed.\r\n";
						$debug_info .= print_r( $cxntests->raw_results(), true ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
					} else {
						$failures = $cxntests->list_fails();
						foreach ( $failures as $fail ) {
							echo '<div class="jetpack-test-error">';
							echo '<p><a class="jetpack-test-heading" href="#">' . esc_html( $fail['message'] );
							echo '<span class="noticon noticon-collapse"></span></a></p>';
							echo '<p class="jetpack-test-details">' . esc_html( $fail['resolution'] ) . '</p>';
							echo '</div>';

							$debug_info .= "FAILED TESTS!\r\n";
							$debug_info .= $fail['name'] . ': ' . $fail['message'] . "\r\n";
							$debug_info .= print_r( $cxntests->raw_results(), true ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
						}
					}
					?>
				</div>
			<div class="entry-content">
				<h3><?php esc_html_e( 'Trouble with Jetpack?', 'jetpack' ); ?></h3>
				<h4><?php esc_html_e( 'It may be caused by one of these issues, which you can diagnose yourself:', 'jetpack' ); ?></h4>
				<ol>
					<li><b><em>
						<?php
						esc_html_e( 'A known issue.', 'jetpack' );
						?>
					</em></b>
						<?php
						echo sprintf(
							wp_kses(
								/* translators: URLs to Jetpack support pages. */
								__( 'Some themes and plugins have <a href="%1$s" target="_blank">known conflicts</a> with Jetpack – check the <a href="%2$s" target="_blank">list</a>. (You can also browse the <a href="%3$s" target="_blank">Jetpack support pages</a> or <a href="%4$s" target="_blank">Jetpack support forum</a> to see if others have experienced and solved the problem.)', 'jetpack' ),
								array(
									'a' => array(
										'href'   => array(),
										'target' => array(),
									),
								)
							),
							'http://jetpack.com/support/getting-started-with-jetpack/known-issues/',
							'http://jetpack.com/support/getting-started-with-jetpack/known-issues/',
							'http://jetpack.com/support/',
							'https://wordpress.org/support/plugin/jetpack'
						);
						?>
						</li>
					<li><b><em><?php esc_html_e( 'An incompatible plugin.', 'jetpack' ); ?></em></b>  <?php esc_html_e( "Find out by disabling all plugins except Jetpack. If the problem persists, it's not a plugin issue. If the problem is solved, turn your plugins on one by one until the problem pops up again – there's the culprit! Let us know, and we'll try to help.", 'jetpack' ); ?></li>
					<li>
						<b><em><?php esc_html_e( 'A theme conflict.', 'jetpack' ); ?></em></b>
						<?php
							$default_theme = wp_get_theme( WP_DEFAULT_THEME );

						if ( $default_theme->exists() ) {
							/* translators: %s is the name of a theme */
							echo esc_html( sprintf( __( "If your problem isn't known or caused by a plugin, try activating %s (the default WordPress theme).", 'jetpack' ), $default_theme->get( 'Name' ) ) );
						} else {
							esc_html_e( "If your problem isn't known or caused by a plugin, try activating the default WordPress theme.", 'jetpack' );
						}
						?>
						<?php esc_html_e( "If this solves the problem, something in your theme is probably broken – let the theme's author know.", 'jetpack' ); ?>
					</li>
					<li><b><em><?php esc_html_e( 'A problem with your XMLRPC file.', 'jetpack' ); ?></em></b>
						<?php
						echo sprintf(
							wp_kses(
								/* translators: The URL to the site's xmlrpc.php file. */
								__( 'Load your <a href="%s">XMLRPC file</a>. It should say “XML-RPC server accepts POST requests only.” on a line by itself.', 'jetpack' ),
								array( 'a' => array( 'href' => array() ) )
							),
							esc_attr( site_url( 'xmlrpc.php' ) )
						);
						?>
						<ul>
							<li>- <?php esc_html_e( "If it's not by itself, a theme or plugin is displaying extra characters. Try steps 2 and 3.", 'jetpack' ); ?></li>
							<li>- <?php esc_html_e( 'If you get a 404 message, contact your web host. Their security may block XMLRPC.', 'jetpack' ); ?></li>
						</ul>
					</li>
					<?php if ( current_user_can( 'jetpack_disconnect' ) && Jetpack::is_active() ) : ?>
						<li>
							<strong><em><?php esc_html_e( 'A connection problem with WordPress.com.', 'jetpack' ); ?></em></strong>
							<?php
							echo sprintf(
								wp_kses(
									/* translators: URL to disconnect and reconnect Jetpack. */
									__( 'Jetpack works by connecting to WordPress.com for a lot of features. Sometimes, when the connection gets messed up, you need to disconnect and reconnect to get things working properly. <a href="%s">Disconnect from WordPress.com</a>', 'jetpack' ),
									array(
										'a' => array(
											'href'  => array(),
											'class' => array(),
										),
									)
								),
								esc_attr(
									wp_nonce_url(
										Jetpack::admin_url(
											array(
												'page' => 'jetpack-debugger',
												'disconnect' => true,
											)
										),
										'jp_disconnect',
										'nonce'
									)
								)
							);
							?>
						</li>
					<?php endif; ?>
				</ol>
				<h4><?php esc_html_e( 'Still having trouble?', 'jetpack' ); ?></h4>
				<p><b><em><?php esc_html_e( 'Ask us for help!', 'jetpack' ); ?></em></b>
				<?php
				echo sprintf(
					wp_kses(
						/* translators: URL for Jetpack support. */
						__( '<a href="%s">Contact our Happiness team</a>. When you do, please include the full debug information below.', 'jetpack' ),
						array( 'a' => array( 'href' => array() ) )
					),
					'https://jetpack.com/contact-support/'
				);
				?>
						</p>
				<hr />
				<?php if ( Jetpack::is_active() ) : ?>
					<div id="connected-user-details">
						<h3><?php esc_html_e( 'More details about your Jetpack settings', 'jetpack' ); ?></h3>
						<p>
						<?php
						printf(
							wp_kses(
								/* translators: %s is an e-mail address */
								__( 'The primary connection is owned by <strong>%s</strong>\'s WordPress.com account.', 'jetpack' ),
								array( 'strong' => array() )
							),
							esc_html( Jetpack::get_master_user_email() )
						);
						?>
							</p>
					</div>
				<?php else : ?>
					<div id="dev-mode-details">
						<p>
						<?php
						printf(
							wp_kses(
								/* translators: Link to a Jetpack support page. */
								__( 'Would you like to use Jetpack on your local development site? You can do so thanks to <a href="%s">Jetpack\'s development mode</a>.', 'jetpack' ),
								array( 'a' => array( 'href' => array() ) )
							),
							'https://jetpack.com/support/development-mode/'
						);
						?>
							</p>
					</div>
				<?php endif; ?>
				<?php
				if (
					current_user_can( 'jetpack_manage_modules' )
					&& ( Jetpack::is_development_mode() || Jetpack::is_active() )
				) {
					printf(
						wp_kses(
							'<p><a href="%1$s">%2$s</a></p>',
							array(
								'a' => array( 'href' => array() ),
								'p' => array(),
							)
						),
						esc_attr( Jetpack::admin_url( 'page=jetpack_modules' ) ),
						esc_html__( 'Access the full list of Jetpack modules available on your site.', 'jetpack' )
					);
				}
				?>
			</div>
		<hr />
		<div id="toggle_debug_info"><?php esc_html_e( 'Advanced Debug Results', 'jetpack' ); ?></div>
			<div id="debug_info_div">
			<h4><?php esc_html_e( 'Debug Info', 'jetpack' ); ?></h4>
			<div id="debug_info"><pre><?php echo esc_html( $debug_info ); ?></pre></div>
		</div>
		</div>
		<?php
	}

	/**
	 * Outputs html needed within the <head> for the in-plugin debugger page.
	 */
	public static function jetpack_debug_admin_head() {

		Jetpack_Admin_Page::load_wrapper_styles();
		?>
		<style type="text/css">

			.jetpack-debug-test-container {
				margin-top: 20px;
				margin-bottom: 30px;
			}

			.jetpack-tests-succeed {
				font-size: large;
				color: #8BAB3E;
			}

			.jetpack-test-details {
				margin: 4px 6px;
				padding: 10px;
				overflow: auto;
				display: none;
			}

			.jetpack-test-error {
				margin-bottom: 10px;
				background: #FFEBE8;
				border: solid 1px #C00;
				border-radius: 3px;
			}

			.jetpack-test-error p {
				margin: 0;
				padding: 0;
			}

			p.jetpack-test-details {
				margin: 4px 6px;
				padding: 10px;
			}

			.jetpack-test-error a.jetpack-test-heading {
				padding: 4px 6px;
				display: block;
				text-decoration: none;
				color: inherit;
			}

			.jetpack-test-error .noticon {
				float: right;
			}

			.formbox {
				margin: 0 0 25px 0;
			}

			.formbox input[type="text"], .formbox input[type="email"], .formbox input[type="url"], .formbox textarea, #debug_info_div {
				border: 1px solid #e5e5e5;
				border-radius: 11px;
				box-shadow: inset 0 1px 1px rgba(0,0,0,0.1);
				color: #666;
				font-size: 14px;
				padding: 10px;
				width: 97%;
			}
			#debug_info_div {
				border-radius: 0;
				margin-top: 16px;
				background: #FFF;
				padding: 16px;
			}
			.formbox .contact-support input[type="submit"] {
				float: right;
				margin: 0 !important;
				border-radius: 20px !important;
				cursor: pointer;
				font-size: 13pt !important;
				height: auto !important;
				margin: 0 0 2em 10px !important;
				padding: 8px 16px !important;
				background-color: #ddd;
				border: 1px solid rgba(0,0,0,0.05);
				border-top-color: rgba(255,255,255,0.1);
				border-bottom-color: rgba(0,0,0,0.15);
				color: #333;
				font-weight: 400;
				display: inline-block;
				text-align: center;
				text-decoration: none;
			}

			.formbox span.errormsg {
				margin: 0 0 10px 10px;
				color: #d00;
				display: none;
			}

			.formbox.error span.errormsg {
				display: block;
			}

			#debug_info_div, #toggle_debug_info, #debug_info_div p {
				font-size: 12px;
			}

			#category_div ul li {
				list-style-type: none;
			}

		</style>
		<script type="text/javascript">
		jQuery( document ).ready( function($) {

			$( '#debug_info' ).prepend( 'jQuery version: ' + jQuery.fn.jquery + "\r\n" );
			$( '#debug_form_info' ).prepend( 'jQuery version: ' + jQuery.fn.jquery + "\r\n" );

			$( '.jetpack-test-error .jetpack-test-heading' ).on( 'click', function() {
				$( this ).parents( '.jetpack-test-error' ).find( '.jetpack-test-details' ).slideToggle();
				return false;
			} );

		} );
		</script>
		<?php
	}
}
