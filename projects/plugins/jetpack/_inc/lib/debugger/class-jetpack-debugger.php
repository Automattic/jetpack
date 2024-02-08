<?php
/**
 * Jetpack Debugger functionality allowing for self-service diagnostic information via the legacy jetpack debugger.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;

/**
 * Class Jetpack_Debugger
 *
 * A namespacing class for functionality related to the legacy in-plugin diagnostic tooling.
 */
class Jetpack_Debugger {
	/**
	 * Disconnect Jetpack and redirect user to connection flow.
	 *
	 * Used in class.jetpack-admin.php.
	 */
	public static function disconnect_and_redirect() {
		if ( ! ( isset( $_GET['nonce'] ) && wp_verify_nonce( $_GET['nonce'], 'jp_disconnect' ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			return;
		}

		if ( ! empty( $_GET['disconnect'] ) ) {
			if ( Jetpack::is_connection_ready() ) {
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

		$support_url = Jetpack::is_development_version()
			? Redirect::get_url( 'jetpack-contact-support-beta-group' )
			: Redirect::get_url( 'jetpack-contact-support' );

		$cxntests = new Jetpack_Cxn_Tests();
		?>
		<div class="wrap">
			<div class="jp-static-block">
				<h2><?php esc_html_e( 'Debugging Center', 'jetpack' ); ?></h2>

				<div class="jp-static-block-body">
					<h3><?php esc_html_e( "Testing your site's compatibility with Jetpack...", 'jetpack' ); ?></h3>
					<div class="jetpack-debug-test-container">
						<?php
						if ( $cxntests->pass() ) {
							echo '<div class="jetpack-tests-succeed">' . esc_html__( 'Your Jetpack setup looks a-okay!', 'jetpack' ) . '</div>';
						} else {
							$failures = $cxntests->list_fails();
							foreach ( $failures as $fail ) {
								?>
								<div class="notice notice-error inline">
									<div class="notice-icon-wrapper">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 24 24" width="24" height="24" class="y_IPyP1wIAOhyNaqvXJq" aria-hidden="true" focusable="false"><path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z"></path></svg>
									</div>

									<div class="notice-main-content">
										<div class="notice-title"><?php echo esc_html( $fail['short_description'] ); ?></div>

										<div class="notice-action-bar">
											<div>
												<a href="<?php echo esc_attr( $fail['action'] ); ?>" aria-disabled="false" class="components-button is-primary"><span><?php echo esc_html( $fail['action_label'] ); ?></span></a>
											</div>
										</div>
									</div>
								</div>
								<?php
							}
						}
						?>
					</div>

					<div class="entry-content">
						<h4><?php esc_html_e( 'Trouble with Jetpack?', 'jetpack' ); ?></h4>
						<p><?php esc_html_e( 'It may be caused by one of these issues, which you can diagnose yourself:', 'jetpack' ); ?></p>
						<ol>
							<li><?php esc_html_e( 'A known issue.', 'jetpack' ); ?>
								<?php
								printf(
									wp_kses(
										/* translators: URLs to Jetpack support pages. */
										__( 'Some themes and plugins have <a href="%1$s" target="_blank" rel="noopener noreferrer">known conflicts</a> with Jetpack – check the list. (You can also browse the <a href="%2$s" target="_blank" rel="noopener noreferrer">Jetpack support pages</a> or <a href="%3$s" target="_blank" rel="noopener noreferrer">Jetpack support forum</a> to see if others have experienced and solved the problem.)', 'jetpack' ),
										array(
											'a' => array(
												'href'   => array(),
												'target' => array(),
												'rel'    => array(),
											),
										)
									),
									esc_url( Redirect::get_url( 'jetpack-contact-support-known-issues' ) ),
									esc_url( Redirect::get_url( 'jetpack-support' ) ),
									esc_url( Redirect::get_url( 'wporg-support-plugin-jetpack' ) )
								);
								?>
							</li>
							<li>
								<?php esc_html_e( 'An incompatible plugin.', 'jetpack' ); ?>
								<?php esc_html_e( "Find out by disabling all plugins except Jetpack. If the problem persists, it's not a plugin issue. If the problem is solved, turn your plugins on one by one until the problem pops up again – there's the culprit! Let us know, and we'll try to help.", 'jetpack' ); ?>
							</li>
							<li>
								<?php esc_html_e( 'A theme conflict.', 'jetpack' ); ?>
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
							<li>
								<?php esc_html_e( 'A problem with your XML-RPC file.', 'jetpack' ); ?>
								<?php
								printf(
									wp_kses(
										/* translators: The URL to the site's xmlrpc.php file. */
										__( 'Load your <a href="%s">XML-RPC file</a>. It should say “XML-RPC server accepts POST requests only.” on a line by itself.', 'jetpack' ),
										array( 'a' => array( 'href' => array() ) )
									),
									esc_attr( site_url( 'xmlrpc.php' ) )
								);
								?>
								<ul>
									<li><?php esc_html_e( "If it's not by itself, a theme or plugin is displaying extra characters. Try steps 2 and 3.", 'jetpack' ); ?></li>
									<li><?php esc_html_e( 'If you get a 404 message, contact your web host. Their security may block the XML-RPC file.', 'jetpack' ); ?></li>
								</ul>
							</li>

							<?php if ( current_user_can( 'jetpack_disconnect' ) && Jetpack::is_connection_ready() ) : ?>
								<li>
									<?php esc_html_e( 'A connection problem with WordPress.com.', 'jetpack' ); ?>
									<?php
									printf(
										wp_kses(
											/* translators: URL to disconnect and reconnect Jetpack. */
											__( 'Jetpack works by connecting to WordPress.com for a lot of features. Sometimes, when the connection gets messed up, you need to disconnect and reconnect to get things working properly. <a href="%s">Disconnect from WordPress.com</a>', 'jetpack' ),
											array(
												'a' => array(
													'href' => array(),
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
						<p>
							<?php esc_html_e( 'Ask us for help!', 'jetpack' ); ?>

							<?php
							/**
							 * Offload to new WordPress debug data.
							 */
							printf(
								wp_kses(
									/* translators: URL for Jetpack support. URL for WordPress's Site Health */
									__( '<a href="%1$s">Contact our Happiness team</a>. When you do, please include the <a href="%2$s">full debug information from your site</a>.', 'jetpack' ),
									array( 'a' => array( 'href' => array() ) )
								),
								esc_url( $support_url ),
								esc_url( admin_url() . 'site-health.php?tab=debug' )
							);
							?>
						</p>
					</div>
				</div>
			</div>

			<div class="jp-static-block">
				<h2><?php esc_html_e( 'More details about your Jetpack settings', 'jetpack' ); ?></h2>

				<div class="jp-static-block-body">
					<?php if ( Jetpack::is_connection_ready() ) : ?>
						<div id="connected-user-details">
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
										__( 'Would you like to use Jetpack on your local development site? You can do so thanks to <a href="%s">Jetpack\'s offline mode</a>.', 'jetpack' ),
										array( 'a' => array( 'href' => array() ) )
									),
									esc_url( Redirect::get_url( 'jetpack-support-development-mode' ) )
								);
								?>
							</p>
						</div>
					<?php endif; ?>

					<?php
					if (
						current_user_can( 'jetpack_manage_modules' )
						&& ( ( new Status() )->is_offline_mode() || Jetpack::is_connection_ready() )
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
				margin: 8px 0;
			}

			#connected-user-details p strong {
				word-break: break-all;
			}

			.jetpack-tests-succeed {
				font-size: large;
				color: #069E08;
			}

			.jetpack-test-details {
				margin: 4px 6px;
				padding: 10px;
				overflow: auto;
				display: none;
			}

			.formbox {
				margin: 0 0 25px 0;
			}

			.formbox input[type="text"], .formbox input[type="email"], .formbox input[type="url"], .formbox textarea, #debug_info_div {
				border: 1px solid #dcdcde;
				border-radius: 11px;
				box-shadow: inset 0 1px 1px rgba(0,0,0,0.1);
				color: #646970;
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
				background-color: #dcdcde;
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
