<?php

class Jetpack_Debugger {

	private static function is_jetpack_support_open() {
		try {
			$url = add_query_arg( 'ver', JETPACK__VERSION, 'https://jetpack.com/is-support-open/' );
			$response = wp_remote_request( esc_url_raw( $url ) );
			if ( is_wp_error( $response ) ) {
				return false;
			}
			$body = wp_remote_retrieve_body( $response );
			$json = json_decode( $body );
			return ( ( bool ) $json->is_support_open );
		}
		catch ( Exception $e ) {
			return true;
		}
	}

	private static function what_jetpack_plan() {
		$plan = Jetpack::get_active_plan();
		$plan = ! empty( $plan['class'] ) ? $plan['class'] : 'undefined';
		return 'JetpackPlan' . $plan;
	}

	static function seconds_to_time( $seconds ) {
		$units = array(
			"week"   => 7*24*3600,
			"day"    =>   24*3600,
			"hour"   =>      3600,
			"minute" =>        60,
			"second" =>         1,
		);
		// specifically handle zero
		if ( $seconds == 0 ) return "0 seconds";
		$human_readable = "";
		foreach ( $units as $name => $divisor ) {
			if ( $quot = intval( $seconds / $divisor) ) {
				$human_readable .= "$quot $name";
				$human_readable .= ( abs( $quot ) > 1 ? "s" : "" ) . ", ";
				$seconds -= $quot * $divisor;
			}
		}
		return substr( $human_readable, 0, -2 );
	}

	public static function jetpack_increase_timeout() {
		return 30; // seconds
	}

	public static function disconnect_and_redirect() {
		$can_disconnect = isset( $_GET['disconnect'] ) && $_GET['disconnect'] && isset( $_GET['nonce'] ) && wp_verify_nonce( $_GET['nonce'], 'jp_disconnect' );
		if ( $can_disconnect ) {
			if ( Jetpack::is_active() ) {
				Jetpack::disconnect();
				wp_safe_redirect( Jetpack::admin_url() );
				exit;
			}
		}
	}

	public static function jetpack_debug_display_handler() {
		if ( ! current_user_can( 'manage_options' ) )
			wp_die( esc_html__('You do not have sufficient permissions to access this page.', 'jetpack' ) );

		$current_user = wp_get_current_user();

		$user_id = get_current_user_id();
		$user_tokens = Jetpack_Options::get_option( 'user_tokens' );
		if ( is_array( $user_tokens ) && array_key_exists( $user_id, $user_tokens ) ) {
			$user_token = $user_tokens[$user_id];
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
			$debug_info .= "\r\n" . esc_html( $label . ": " . Jetpack_Options::get_option( $option_name ) );
		}

		$debug_info .= "\r\n" . esc_html( "USER_ID: " . $user_id );
		$debug_info .= "\r\n" . esc_html( "USER_TOKEN: " . $user_token );
		$debug_info .= "\r\n" . esc_html( "PHP_VERSION: " . PHP_VERSION );
		$debug_info .= "\r\n" . esc_html( "WORDPRESS_VERSION: " . $GLOBALS['wp_version'] );
		$debug_info .= "\r\n" . esc_html( "JETPACK__VERSION: " . JETPACK__VERSION );
		$debug_info .= "\r\n" . esc_html( "JETPACK__PLUGIN_DIR: " . JETPACK__PLUGIN_DIR );
		$debug_info .= "\r\n" . esc_html( "SITE_URL: " . site_url() );
		$debug_info .= "\r\n" . esc_html( "HOME_URL: " . home_url() );
		$debug_info .= "\r\n" . esc_html( "PLAN: " . self::what_jetpack_plan() );

		$debug_info .= "\r\n";
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-modules.php';
		$sync_module = Jetpack_Sync_Modules::get_module( 'full-sync' );
		$sync_statuses = $sync_module->get_status();
		$human_readable_sync_status = array();
		foreach( $sync_statuses  as $sync_status => $sync_status_value ) {
			$human_readable_sync_status[ $sync_status ] =
				in_array( $sync_status, array( 'started', 'queue_finished', 'send_started', 'finished' ) )
				? date( 'r', $sync_status_value ) : $sync_status_value ;
		}

		$debug_info .= "\r\n". sprintf( esc_html__( 'Jetpack Sync Full Status: `%1$s`', 'jetpack' ), print_r( $human_readable_sync_status, 1 ) );

		require_once JETPACK__PLUGIN_DIR. 'sync/class.jetpack-sync-sender.php';

		$queue = Jetpack_Sync_Sender::get_instance()->get_sync_queue();

		$debug_info .= "\r\n". sprintf( esc_html__( 'Sync Queue size: %1$s', 'jetpack' ), $queue->size() );
		$debug_info .= "\r\n". sprintf( esc_html__( 'Sync Queue lag: %1$s', 'jetpack' ), self::seconds_to_time( $queue->lag() ) );

		$full_sync_queue = Jetpack_Sync_Sender::get_instance()->get_full_sync_queue();

		$debug_info .= "\r\n". sprintf( esc_html__( 'Full Sync Queue size: %1$s', 'jetpack' ), $full_sync_queue->size() );
		$debug_info .= "\r\n". sprintf( esc_html__( 'Full Sync Queue lag: %1$s', 'jetpack' ), self::seconds_to_time( $full_sync_queue->lag() ) );

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-functions.php';
		$idc_urls = array(
			'home'       => Jetpack_Sync_Functions::home_url(),
			'siteurl'    => Jetpack_Sync_Functions::site_url(),
			'WP_HOME'    => Jetpack_Constants::is_defined( 'WP_HOME' ) ? Jetpack_Constants::get_constant( 'WP_HOME' ) : '',
			'WP_SITEURL' => Jetpack_Constants::is_defined( 'WP_SITEURL' ) ? Jetpack_Constants::get_constant( 'WP_SITEURL' ) : '',
		);
		$debug_info .= "\r\n". esc_html( sprintf(  'Sync IDC URLs: %s', json_encode( $idc_urls ) ) );
		$debug_info .= "\r\n". esc_html( sprintf(  'Sync error IDC option: %s', json_encode( Jetpack_Options::get_option( 'sync_error_idc' ) ) ) );
		$debug_info .= "\r\n". esc_html( sprintf(  'Sync IDC Optin: %s', (string) Jetpack::sync_idc_optin() ) );

		$debug_info .= "\r\n";

		foreach ( array (
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
					  'REMOTE_ADDR'
				  ) as $header ) {
			if ( isset( $_SERVER[ $header ] ) ) {
				$debug_info .= "\r\n" . esc_html( $header . ": " . $_SERVER[ $header ] );
			}
		}

		$debug_info .= "\r\n" . esc_html( "PROTECT_TRUSTED_HEADER: " . json_encode( get_site_option( 'trusted_ip_header' ) ) );

		$debug_info .= "\r\n\r\nTEST RESULTS:\r\n\r\n";
		$debug_raw_info = '';


		$tests = array();

		$tests['HTTP']['result'] = wp_remote_get( preg_replace( '/^https:/', 'http:', JETPACK__API_BASE ) . 'test/1/' );
		$tests['HTTP']['fail_message'] = esc_html__( 'Your site isn’t reaching the Jetpack servers.', 'jetpack' );

		$tests['HTTPS']['result'] = wp_remote_get( preg_replace( '/^http:/', 'https:', JETPACK__API_BASE ) . 'test/1/' );
		$tests['HTTPS']['fail_message'] = esc_html__( 'Your site isn’t securely reaching the Jetpack servers.', 'jetpack' );

		$identity_crisis_message = '';
		if ( $identity_crisis = Jetpack::check_identity_crisis() ) {
			$identity_crisis_message .= sprintf(
				__( 'Your url is set as `%1$s`, but your WordPress.com connection lists it as `%2$s`!', 'jetpack' ),
				$identity_crisis['home'],
				$identity_crisis['wpcom_home']
			);
			$identity_crisis = new WP_Error( 'identity-crisis', $identity_crisis_message, $identity_crisis );
		} else {
			$identity_crisis = 'PASS';
		}
		$tests['IDENTITY_CRISIS']['result'] = $identity_crisis;
		$tests['IDENTITY_CRISIS']['fail_message'] = esc_html__( 'Something has gotten mixed up in your Jetpack Connection!', 'jetpack' );

		$self_xml_rpc_url = site_url( 'xmlrpc.php' );

		$testsite_url = Jetpack::fix_url_for_bad_hosts( JETPACK__API_BASE . 'testsite/1/?url=' );

		add_filter( 'http_request_timeout', array( 'Jetpack_Debugger', 'jetpack_increase_timeout' ) );

		$tests['SELF']['result'] = wp_remote_get( $testsite_url . $self_xml_rpc_url );
		if ( is_wp_error( $tests['SELF']['result'] ) && 0 == strpos( $tests['SELF']['result']->get_error_message(), 'Operation timed out' ) ){
			$tests['SELF']['fail_message'] = esc_html__( 'Your site did not get a response from our debugging service in the expected timeframe. If you are not experiencing other issues, this could be due to a slow connection between your site and our server.', 'jetpack' );
		} else {
			$tests['SELF']['fail_message'] = esc_html__( 'It looks like your site can not communicate properly with Jetpack.', 'jetpack' );
		}

		remove_filter( 'http_request_timeout', array( 'Jetpack_Debugger', 'jetpack_increase_timeout' ) );

		?>
		<div class="wrap">
			<h2><?php esc_html_e( 'Jetpack Debugging Center', 'jetpack' ); ?></h2>
			<?php if ( isset( $can_disconnect ) && $can_disconnect ) : ?>
				<div id="message" class="updated notice notice-success is-dismissible"><p><?php esc_html_e( 'This site was successfully disconnected.', 'jetpack' ) ?> <a href="<?php echo esc_url( Jetpack::admin_url() ); ?>"><?php esc_html_e( 'Go to connection screen.', 'jetpack' ); ?></a></p>
					<button type="button" class="notice-dismiss"><span class="screen-reader-text"><?php esc_html_e( 'Dismiss this notice.', 'jetpack' ); ?></span></button></div>
			<?php else: ?>
				<h3><?php _e( "Testing your site's compatibility with Jetpack...", 'jetpack' ); ?></h3>
				<div class="jetpack-debug-test-container">
					<?php
					ob_start();
					foreach ( $tests as $test_name => $test_info ) :
						if ( 'PASS' !== $test_info['result'] && ( is_wp_error( $test_info['result'] ) ||
								false == ( $response_code = wp_remote_retrieve_response_code( $test_info['result'] ) )  ||
								'200' != $response_code ) ) {
							$debug_info .= $test_name . ": FAIL\r\n";
							?>
							<div class="jetpack-test-error">
							<p>
								<a class="jetpack-test-heading" href="#"><?php echo $test_info['fail_message']; ?>
									<span class="noticon noticon-collapse"></span>
								</a>
							</p>
						<pre class="jetpack-test-details"><?php echo esc_html( $test_name ); ?>:
							<?php echo esc_html( is_wp_error( $test_info['result'] ) ? $test_info['result']->get_error_message() : print_r( $test_info['result'], 1 ) ); ?></pre>
							</div><?php
						} else {
							$debug_info .= $test_name . ": PASS\r\n";
						}
						$debug_raw_info .= "\r\n\r\n" . $test_name . "\r\n" . esc_html( is_wp_error( $test_info['result'] ) ? $test_info['result']->get_error_message() : print_r( $test_info['result'], 1 ) );
						?>
					<?php endforeach;
					$html = ob_get_clean();

					if ( '' == trim( $html ) ) {
						echo '<div class="jetpack-tests-succed">' . esc_html__( 'Your Jetpack setup looks a-okay!', 'jetpack' ) . '</div>';
					} else {
						echo '<h3>' . esc_html__( 'There seems to be a problem with your site’s ability to communicate with Jetpack!', 'jetpack' ) . '</h3>';
						echo $html;
					}
					$debug_info .= "\r\n\r\nRAW TEST RESULTS:" . $debug_raw_info ."\r\n";
					?>
				</div>
			<?php endif; ?>

			<div class="entry-content">
				<h3><?php esc_html_e( 'Trouble with Jetpack?', 'jetpack' ); ?></h3>
				<h4><?php esc_html_e( 'It may be caused by one of these issues, which you can diagnose yourself:', 'jetpack' ); ?></h4>
				<ol>
					<li><b><em><?php esc_html_e( 'A known issue.', 'jetpack' ); ?></em></b>  <?php echo sprintf( __( 'Some themes and plugins have <a href="%1$s" target="_blank">known conflicts</a> with Jetpack – check the <a href="%2$s" target="_blank">list</a>. (You can also browse the <a href="%3$s" target="_blank">Jetpack support pages</a> or <a href="%4$s" target="_blank">Jetpack support forum</a> to see if others have experienced and solved the problem.)', 'jetpack' ), 'http://jetpack.com/support/getting-started-with-jetpack/known-issues/', 'http://jetpack.com/support/getting-started-with-jetpack/known-issues/', 'http://jetpack.com/support/', 'https://wordpress.org/support/plugin/jetpack' ); ?></li>
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
					<li><b><em><?php esc_html_e( 'A problem with your XMLRPC file.', 'jetpack' ); ?></em></b>  <?php echo sprintf( __( 'Load your <a href="%s">XMLRPC file</a>. It should say “XML-RPC server accepts POST requests only.” on a line by itself.', 'jetpack' ), site_url( 'xmlrpc.php' ) ); ?>
						<ul>
							<li>- <?php esc_html_e( "If it's not by itself, a theme or plugin is displaying extra characters. Try steps 2 and 3.", 'jetpack' ); ?></li>
							<li>- <?php esc_html_e( "If you get a 404 message, contact your web host. Their security may block XMLRPC.", 'jetpack' ); ?></li>
						</ul>
					</li>
					<?php if ( current_user_can( 'jetpack_disconnect' ) && Jetpack::is_active() ) : ?>
						<li>
							<strong><em><?php esc_html_e( 'A connection problem with WordPress.com.', 'jetpack' ); ?></em></strong>
							<?php
							echo wp_kses(
								sprintf(
									__( 'Jetpack works by connecting to WordPress.com for a lot of features. Sometimes, when the connection gets messed up, you need to disconnect and reconnect to get things working properly. <a href="%s">Disconnect from WordPress.com</a>', 'jetpack' ),
									wp_nonce_url(
										Jetpack::admin_url( array( 'page' => 'jetpack-debugger', 'disconnect' => true ) ),
										'jp_disconnect',
										'nonce'
									)
								),
								array( 'a' => array( 'href'  => array(), 'class' => array() ) )
							);
							?>
						</li>
					<?php endif; ?>
				</ol>
				<?php if ( self::is_jetpack_support_open() ): ?>
				<p class="jetpack-show-contact-form"><?php echo sprintf( __( 'If none of these help you find a solution, <a href="%s">click here to contact Jetpack support</a>. Tell us as much as you can about the issue and what steps you\'ve tried to resolve it, and one of our Happiness Engineers will be in touch to help.', 'jetpack' ), Jetpack::admin_url( array( 'page' => 'jetpack-debugger', 'contact' => true ) ) ); ?>
				</p>
				<?php endif; ?>
				<hr />
				<?php if ( Jetpack::is_active() ) : ?>
					<div id="connected-user-details">
						<h3><?php esc_html_e( 'More details about your Jetpack settings', 'jetpack' ); ?></h3>
						<p><?php printf(
							/* translators: %s is an e-mail address */
							__( 'The primary connection is owned by <strong>%s</strong>\'s WordPress.com account.', 'jetpack' ),
							esc_html( Jetpack::get_master_user_email() )
						); ?></p>
					</div>
				<?php else : ?>
					<div id="dev-mode-details">
						<p><?php printf(
							__( 'Would you like to use Jetpack on your local development site? You can do so thanks to <a href="%s">Jetpack\'s development mode</a>.', 'jetpack' ),
							'https://jetpack.com/support/development-mode/'
						); ?></p>
					</div>
				<?php endif; ?>
				<?php if (
					current_user_can( 'jetpack_manage_modules' )
					&& ( Jetpack::is_development_mode() || Jetpack::is_active() )
				) {
					printf(
						'<p><a href="%1$s">%2$s</a></p>',
						Jetpack::admin_url( 'page=jetpack_modules' ),
						esc_html__( 'Access the full list of Jetpack modules available on your site.', 'jetpack' )
					);
				} ?>
			</div>
			<div id="contact-message" <?php if( ! isset( $_GET['contact'] ) ) {?>  style="display:none" <?php } ?>>
			<?php if ( self::is_jetpack_support_open() ): ?>
				<form id="contactme" method="post" action="https://jetpack.com/contact-support/">
					<input type="hidden" name="action" value="submit">
					<input type="hidden" name="jetpack" value="needs-service">

					<input type="hidden" name="contact_form" id="contact_form" value="1">
					<input type="hidden" name="blog_url" id="blog_url" value="<?php echo esc_attr( site_url() ); ?>">
					<?php
						$subject_line = sprintf(
							/* translators: %s is the URL of the site */
							_x( 'from: %s Jetpack contact form', 'Support request email subject line', 'jetpack' ),
							esc_attr( site_url() )
						);

						if ( Jetpack::is_development_version() ) {
							$subject_line = 'BETA ' . $subject_line;
						}

						$subject_line_input = printf(
							'<input type="hidden" name="subject" id="subject" value="%s"">',
							$subject_line
						);
					?>
					<div id="category_div" class="formbox">
						<label class="h" for="category"><?php esc_html_e( 'What do you need help with?', 'jetpack' ); ?></label>
						<ul>
						<?php
						/**
						 * Set up an array of ticket categories.
						 * (reasons why a user would contact us.)
						 */
						$categories = array(
							'Connection' => esc_html__( "I'm having trouble connecting Jetpack to WordPress.com", 'jetpack' ),
							'Billing'    => esc_html__( 'I have a billing or plans question', 'jetpack' ),
							'Backups'    => esc_html__( 'I need help with backing up my site.', 'jetpack' ),
							'Restores'   => esc_html__( 'I have a problem restoring my site.', 'jetpack' ),
							'Security'   => esc_html__( 'I have security concerns / my site is hacked', 'jetpack' ),
							'Priority'   => esc_html__( "My site is down / I can't access my site", 'jetpack' ),
							/* translators: Last item in a list of reasons to contact Jetpack support. */
							'Other'      => esc_html__( 'Something Else', 'jetpack' ),
						);

						foreach ( $categories as $value => $label ) { ?>
							<li><label for="<?php echo esc_attr( $value ); ?>">
								<input
									id="<?php echo esc_attr( $value ); ?>"
									name="category"
									type="radio"
									value="<?php echo esc_attr( $value ); ?>"
									<?php checked( esc_attr( $value ), 'Other' ); ?>
								/>
								<?php echo esc_html( $label ); ?>
							</label></li>
						<?php } ?>
						</ul>
					</div>

					<div class="formbox">
						<label for="message" class="h"><?php esc_html_e( 'Please describe the problem you are having.', 'jetpack' ); ?></label>
						<textarea name="message" cols="40" rows="7" id="did"></textarea>
					</div>

					<div id="name_div" class="formbox">
						<label class="h" for="your_name"><?php esc_html_e( 'Name', 'jetpack' ); ?></label>
			  			<span class="errormsg"><?php esc_html_e( 'Let us know your name.', 'jetpack' ); ?></span>
						<input name="your_name" type="text" id="your_name" value="<?php esc_html_e( $current_user->display_name, 'jetpack'); ?>" size="40">
					</div>

					<div id="email_div" class="formbox">
						<label class="h" for="your_email"><?php esc_html_e( 'Email', 'jetpack' ); ?></label>
			  			<span class="errormsg"><?php esc_html_e( 'Use a valid email address.', 'jetpack' ); ?></span>
						<input name="your_email" type="text" id="your_email" value="<?php esc_html_e( $current_user->user_email, 'jetpack'); ?>" size="40">
					</div>

					<div id="toggle_debug_form_info" class="formbox">
						<p><?php _e( 'The test results and some other useful debug information will be sent to the support team. Please feel free to <a href="#">review/modify</a> this information.', 'jetpack' ); ?></p>
					</div>

					<div id="debug_info_form_div" class="formbox" style="display:none">
						<label class="h" for="debug_info"><?php esc_html_e( 'Debug Info', 'jetpack' ); ?></label>
			  			<textarea name="debug_info" cols="40" rows="7" id="debug_form_info"><?php echo esc_attr( $debug_info ); ?></textarea>
					</div>

					<div style="clear: both;"></div>

					<div id="blog_div" class="formbox">
						<div id="submit_div" class="contact-support">
						<input type="submit" name="submit" value="<?php esc_html_e( 'Submit &#187;', 'jetpack' ); ?>">
						</div>
					</div>
					<div style="clear: both;"></div>
				</form>
			<?php endif; ?>
		</div> <!-- contact-message, hidden by default. -->
		<hr />
		<div id="toggle_debug_info"><a href="#"><?php _e( 'View Advanced Debug Results', 'jetpack' ); ?></a></div>
			<div id="debug_info_div" style="display:none">
			<h4><?php esc_html_e( 'Debug Info', 'jetpack' ); ?></h4>
			<div id="debug_info"><pre><?php echo esc_html( $debug_info ) ; ?></pre></div>
		</div>
		</div>
	<?php
	}

	public static function jetpack_debug_admin_head() {
		?>
		<style type="text/css">

			.jetpack-debug-test-container {
				margin-top: 20px;
				margin-bottom: 30px;
			}

			.jetpack-tests-succed {
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

			.jetpack-test-error a.jetpack-test-heading {
				padding: 4px 6px;
				display: block;
				text-decoration: none;
				color: inherit;
			}

			.jetpack-test-error .noticon {
				float: right;
			}

			form#contactme {
				border: 1px solid #dfdfdf;
				background: #eaf3fa;
				padding: 20px;
				margin: 10px;
				background-color: #eaf3fa;
				border-radius: 5px;
				font-size: 15px;
			}

			form#contactme label.h {
				color: #444;
				display: block;
				font-weight: bold;
				margin: 0 0 7px 10px;
				text-shadow: 1px 1px 0 #fff;
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

			#contact-message ul {
				margin: 0 0 20px 10px;
			}

			#contact-message li {
				margin: 0 0 10px 10px;
				list-style: disc;
				display: list-item;
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

			$( '.jetpack-show-contact-form a' ).on( 'click', function() {
				$( '#contact-message' ).slideToggle();
				return false;
			} );

			$( '#toggle_debug_info a' ).on( 'click', function() {
				$( '#debug_info_div' ).slideToggle();
				return false;
			} );

			$( '#toggle_debug_form_info a' ).on( 'click', function() {
				$( '#debug_info_form_div' ).slideToggle();
				return false;
			} );

			$( 'form#contactme' ).on( "submit", function(e){
				var form = $( this );
				var message = form.find( '#did' );
				var name = form.find( '#your_name' );
				var email = form.find( '#your_email' )
				var validation_error = false;
				if( !name.val() ) {
					name.parents( '.formbox' ).addClass( 'error' );
					validation_error = true;
				}
				if( !email.val() ) {
					email.parents( '.formbox' ).addClass( 'error' );
					validation_error = true;
				}
				if ( validation_error ) {
					return false;
				}
				message.val( message.val() + "\r\n\r\n----------------------------------------------\r\n\r\nDEBUG INFO:\r\n" + $('#debug_form_info').val()  );
				return true;
	    	});

		} );
		</script>
		<?php
	}
}
