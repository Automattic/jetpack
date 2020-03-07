<?php
/**
 * Jetpack's JITM class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\Tracking;
use Automattic\Jetpack\Connection\Manager;

/**
 * Jetpack just in time messaging through out the admin
 *
 * @since 5.6.0
 */
class JITM {

	const PACKAGE_VERSION = '1.0'; // TODO: Keep in sync with version specified in composer.json.

	/**
	 * Tracking object.
	 *
	 * @var Automattic\Jetpack\Tracking
	 *
	 * @access private
	 */
	private $tracking;

	/**
	 * The configuration method that is called from the jetpack-config package.
	 */
	public static function configure() {
		$jitm = new self();
		$jitm->register();
	}

	/**
	 * JITM constructor.
	 */
	public function __construct() {
		$this->tracking = new Tracking();
	}

	/**
	 * Determines if JITMs are enabled.
	 *
	 * @return bool Enable JITMs.
	 */
	public function register() {
		/**
		 * Filter to turn off all just in time messages
		 *
		 * @since 3.7.0
		 * @since 5.4.0 Correct docblock to reflect default arg value
		 *
		 * @param bool false Whether to show just in time messages.
		 */
		if ( ! apply_filters( 'jetpack_just_in_time_msgs', false ) ) {
			return false;
		}
		add_action( 'current_screen', array( $this, 'prepare_jitms' ) );
		return true;
	}

	/**
	 * Prepare actions according to screen and post type.
	 *
	 * @since 3.8.2
	 *
	 * @uses Jetpack_Autoupdate::get_possible_failures()
	 *
	 * @param \WP_Screen $screen WP Core's screen object.
	 */
	public function prepare_jitms( $screen ) {
		if ( ! in_array(
			$screen->id,
			array(
				'jetpack_page_stats',
				'jetpack_page_akismet-key-config',
				'admin_page_jetpack_modules',
			),
			true
		) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
			add_action( 'admin_notices', array( $this, 'ajax_message' ) );
			add_action( 'edit_form_top', array( $this, 'ajax_message' ) );

			// Not really a JITM. Don't know where else to put this :) .
			add_action( 'admin_notices', array( $this, 'delete_user_update_connection_owner_notice' ) );
		}
	}

	/**
	 * A special filter for WooCommerce, to set a message based on local state.
	 *
	 * @param string $content The current message.
	 *
	 * @return array The new message.
	 */
	public static function jitm_woocommerce_services_msg( $content ) {
		if ( ! function_exists( 'wc_get_base_location' ) ) {
			return $content;
		}

		$base_location = wc_get_base_location();

		switch ( $base_location['country'] ) {
			case 'US':
				$content->message = esc_html__( 'New free service: Show USPS shipping rates on your store! Added bonus: print shipping labels without leaving WooCommerce.', 'jetpack' );
				break;
			case 'CA':
				$content->message = esc_html__( 'New free service: Show Canada Post shipping rates on your store!', 'jetpack' );
				break;
			default:
				$content->message = '';
		}

		return $content;
	}

	/**
	 * A special filter for WooCommerce Call To Action button
	 *
	 * @return string The new CTA
	 */
	public static function jitm_jetpack_woo_services_install() {
		return wp_nonce_url(
			add_query_arg(
				array(
					'wc-services-action' => 'install',
				),
				admin_url( 'admin.php?page=wc-settings' )
			),
			'wc-services-install'
		);
	}

	/**
	 * A special filter for WooCommerce Call To Action button.
	 *
	 * @return string The new CTA
	 */
	public static function jitm_jetpack_woo_services_activate() {
		return wp_nonce_url(
			add_query_arg(
				array(
					'wc-services-action' => 'activate',
				),
				admin_url( 'admin.php?page=wc-settings' )
			),
			'wc-services-install'
		);
	}

	/**
	 * This is an entire admin notice dedicated to messaging and handling of the case where a user is trying to delete
	 * the connection owner.
	 */
	public function delete_user_update_connection_owner_notice() {
		global $current_screen;

		/*
		 * phpcs:disable WordPress.Security.NonceVerification.Recommended
		 *
		 * This function is firing within wp-admin and checks (below) if it is in the midst of a deletion on the users
		 * page. Nonce will be already checked by WordPress, so we do not need to check ourselves.
		 */

		if ( ! isset( $current_screen->base ) || 'users' !== $current_screen->base ) {
			return;
		}

		if ( ! isset( $_REQUEST['action'] ) || 'delete' !== $_REQUEST['action'] ) {
			return;
		}

		// Get connection owner or bail.
		$connection_manager  = new Manager();
		$connection_owner_id = $connection_manager->get_connection_owner_id();
		if ( ! $connection_owner_id ) {
			return;
		}
		$connection_owner_userdata = get_userdata( $connection_owner_id );

		// Bail if we're not trying to delete connection owner.
		$user_ids_to_delete = array();
		if ( isset( $_REQUEST['users'] ) ) {
			$user_ids_to_delete = array_map( 'sanitize_text_field', wp_unslash( $_REQUEST['users'] ) );
		} elseif ( isset( $_REQUEST['user'] ) ) {
			$user_ids_to_delete[] = sanitize_text_field( wp_unslash( $_REQUEST['user'] ) );
		}

		// phpcs:enable
		$user_ids_to_delete        = array_map( 'absint', $user_ids_to_delete );
		$deleting_connection_owner = in_array( $connection_owner_id, (array) $user_ids_to_delete, true );
		if ( ! $deleting_connection_owner ) {
			return;
		}

		// Bail if they're trying to delete themselves to avoid confusion.
		if ( get_current_user_id() === $connection_owner_id ) {
			return;
		}

		// Track it!
		if ( method_exists( $this->tracking, 'record_user_event' ) ) {
			$this->tracking->record_user_event( 'delete_connection_owner_notice_view' );
		}

		$connection_manager = new Manager();
		$connected_admins   = $connection_manager->get_connected_users( 'jetpack_disconnect' );
		$user               = is_a( $connection_owner_userdata, 'WP_User' ) ? esc_html( $connection_owner_userdata->data->user_login ) : '';

		echo "<div class='notice notice-warning' id='jetpack-notice-switch-connection-owner'>";
		echo '<h2>' . esc_html__( 'Important notice about your Jetpack connection:', 'jetpack' ) . '</h2>';
		echo '<p>' . sprintf(
			/* translators: WordPress User, if available. */
			esc_html__( 'Warning! You are about to delete the Jetpack connection owner (%s) for this site, which may cause some of your Jetpack features to stop working.', 'jetpack' ),
			esc_html( $user )
		) . '</p>';

		if ( ! empty( $connected_admins ) && count( $connected_admins ) > 1 ) {
			echo '<form id="jp-switch-connection-owner" action="" method="post">';
			echo "<label for='owner'>" . esc_html__( 'You can choose to transfer connection ownership to one of these already-connected admins:', 'jetpack' ) . ' </label>';

			$connected_admin_ids = array_map(
				function( $connected_admin ) {
						return $connected_admin->ID;
				},
				$connected_admins
			);

			wp_dropdown_users(
				array(
					'name'    => 'owner',
					'include' => array_diff( $connected_admin_ids, array( $connection_owner_id ) ),
					'show'    => 'display_name_with_login',
				)
			);

			echo '<p>';
			submit_button( esc_html__( 'Set new connection owner', 'jetpack' ), 'primary', 'jp-switch-connection-owner-submit', false );
			echo '</p>';

			echo "<div id='jp-switch-user-results'></div>";
			echo '</form>';
			?>
			<script type="text/javascript">
				jQuery( document ).ready( function( $ ) {
					$( '#jp-switch-connection-owner' ).on( 'submit', function( e ) {
						var formData = $( this ).serialize();
						var submitBtn = document.getElementById( 'jp-switch-connection-owner-submit' );
						var results = document.getElementById( 'jp-switch-user-results' );

						submitBtn.disabled = true;

						$.ajax( {
							type        : "POST",
							url         : "<?php echo esc_url( get_rest_url() . 'jetpack/v4/connection/owner' ); ?>",
							data        : formData,
							headers     : {
								'X-WP-Nonce': "<?php echo esc_js( wp_create_nonce( 'wp_rest' ) ); ?>",
							},
							success: function() {
								results.innerHTML = "<?php esc_html_e( 'Success!', 'jetpack' ); ?>";
								setTimeout( function() {
									$( '#jetpack-notice-switch-connection-owner' ).hide( 'slow' );
								}, 1000 );
							}
						} ).done( function() {
							submitBtn.disabled = false;
						} );

						e.preventDefault();
						return false;
					} );
				} );
			</script>
			<?php
		} else {
			echo '<p>' . esc_html__( 'Every Jetpack site needs at least one connected admin for the features to work properly. Please connect to your WordPress.com account via the button below. Once you connect, you may refresh this page to see an option to change the connection owner.', 'jetpack' ) . '</p>';
			$connect_url = \Jetpack::init()->build_connect_url( false, false, 'delete_connection_owner_notice' );
			echo "<a href='" . esc_url( $connect_url ) . "' target='_blank' rel='noopener noreferrer' class='button-primary'>" . esc_html__( 'Connect to WordPress.com', 'jetpack' ) . '</a>';
		}

		echo '<p>';
		printf(
			wp_kses(
				/* translators: URL to Jetpack support doc regarding the primary user. */
				__( "<a href='%s' target='_blank' rel='noopener noreferrer'>Learn more</a> about the connection owner and what will break if you do not have one.", 'jetpack' ),
				array(
					'a' => array(
						'href'   => true,
						'target' => true,
						'rel'    => true,
					),
				)
			),
			'https://jetpack.com/support/primary-user/'
		);
		echo '</p>';
		echo '<p>';
		printf(
			wp_kses(
				/* translators: URL to contact Jetpack support. */
				__( 'As always, feel free to <a href="%s" target="_blank" rel="noopener noreferrer">contact our support team</a> if you have any questions.', 'jetpack' ),
				array(
					'a' => array(
						'href'   => true,
						'target' => true,
						'rel'    => true,
					),
				)
			),
			'https://jetpack.com/contact-support'
		);
		echo '</p>';
		echo '</div>';
	}

	/**
	 * Injects the dom to show a JITM inside of wp-admin.
	 */
	public function ajax_message() {
		if ( ! is_admin() ) {
			return;
		}

		// do not display on Gutenberg pages.
		if ( $this->is_gutenberg_page() ) {
			return;
		}

		$message_path   = $this->get_message_path();
		$query_string   = _http_build_query( $_GET, '', ',' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$current_screen = wp_unslash( $_SERVER['REQUEST_URI'] );
		?>
		<div class="jetpack-jitm-message"
			data-nonce="<?php echo esc_attr( wp_create_nonce( 'wp_rest' ) ); ?>"
			data-ajax-nonce="<?php echo esc_attr( wp_create_nonce( 'wp_ajax_action' ) ); ?>"
			data-message-path="<?php echo esc_attr( $message_path ); ?>"
			data-query="<?php echo urlencode_deep( $query_string ); ?>"
			data-redirect="<?php echo urlencode_deep( $current_screen ); ?>"
		></div>
		<?php
	}

	/**
	 * Get's the current message path for display of a JITM
	 *
	 * @return string The message path
	 */
	public function get_message_path() {
		$screen = get_current_screen();

		return 'wp:' . $screen->id . ':' . current_filter();
	}

	/**
	 * Function to enqueue jitm css and js
	 */
	public function jitm_enqueue_files() {
		if ( $this->is_gutenberg_page() ) {
			return;
		}
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
		wp_register_style(
			'jetpack-jitm-css',
			plugins_url( "assets/jetpack-admin-jitm{$min}.css", __DIR__ ),
			false,
			self::PACKAGE_VERSION .
			'-201243242'
		);
		wp_style_add_data( 'jetpack-jitm-css', 'rtl', 'replace' );
		wp_style_add_data( 'jetpack-jitm-css', 'suffix', $min );
		wp_enqueue_style( 'jetpack-jitm-css' );

		wp_enqueue_script(
			'jetpack-jitm-new',
			Assets::get_file_url_for_environment( '_inc/build/jetpack-jitm.min.js', '_inc/jetpack-jitm.js' ),
			array( 'jquery' ),
			self::PACKAGE_VERSION,
			true
		);
		wp_localize_script(
			'jetpack-jitm-new',
			'jitm_config',
			array(
				'api_root'               => esc_url_raw( rest_url() ),
				'activate_module_text'   => esc_html__( 'Activate', 'jetpack' ),
				'activated_module_text'  => esc_html__( 'Activated', 'jetpack' ),
				'activating_module_text' => esc_html__( 'Activating', 'jetpack' ),
			)
		);
	}

	/**
	 * Dismisses a JITM feature class so that it will no longer be shown.
	 *
	 * @param string $id The id of the JITM that was dismissed.
	 * @param string $feature_class The feature class of the JITM that was dismissed.
	 *
	 * @return bool Always true.
	 */
	public function dismiss( $id, $feature_class ) {
		$this->tracking->record_user_event(
			'jitm_dismiss_client',
			array(
				'jitm_id'       => $id,
				'feature_class' => $feature_class,
			)
		);

		$hide_jitm = \Jetpack_Options::get_option( 'hide_jitm' );
		if ( ! is_array( $hide_jitm ) ) {
			$hide_jitm = array();
		}

		if ( isset( $hide_jitm[ $feature_class ] ) ) {
			if ( ! is_array( $hide_jitm[ $feature_class ] ) ) {
				$hide_jitm[ $feature_class ] = array(
					'last_dismissal' => 0,
					'number'         => 0,
				);
			}
		} else {
			$hide_jitm[ $feature_class ] = array(
				'last_dismissal' => 0,
				'number'         => 0,
			);
		}

		$number = $hide_jitm[ $feature_class ]['number'];

		$hide_jitm[ $feature_class ] = array(
			'last_dismissal' => time(),
			'number'         => $number + 1,
		);

		\Jetpack_Options::update_option( 'hide_jitm', $hide_jitm );

		return true;
	}

	/**
	 * Asks the wpcom API for the current message to display keyed on query string and message path
	 *
	 * @param string $message_path The message path to ask for.
	 * @param string $query The query string originally from the front end.
	 *
	 * @return array The JITM's to show, or an empty array if there is nothing to show
	 */
	public function get_messages( $message_path, $query ) {
		// Custom filters go here.
		add_filter( 'jitm_woocommerce_services_msg', array( $this, 'jitm_woocommerce_services_msg' ) );
		add_filter( 'jitm_jetpack_woo_services_install', array( $this, 'jitm_jetpack_woo_services_install' ) );
		add_filter( 'jitm_jetpack_woo_services_activate', array( $this, 'jitm_jetpack_woo_services_activate' ) );

		$user = wp_get_current_user();

		// Unauthenticated or invalid requests just bail.
		if ( ! $user ) {
			return array();
		}

		$user_roles = implode( ',', $user->roles );
		$site_id    = \Jetpack_Options::get_option( 'id' );

		// Build our jitm request.
		$path = add_query_arg(
			array(
				'external_user_id' => urlencode_deep( $user->ID ),
				'user_roles'       => urlencode_deep( $user_roles ),
				'query_string'     => urlencode_deep( $query ),
				'mobile_browser'   => jetpack_is_mobile( 'smart' ) ? 1 : 0,
				'_locale'          => get_user_locale(),
			),
			sprintf( '/sites/%d/jitm/%s', $site_id, $message_path )
		);

		// Attempt to get from cache.
		$envelopes = get_transient( 'jetpack_jitm_' . substr( md5( $path ), 0, 31 ) );

		// If something is in the cache and it was put in the cache after the last sync we care about, use it.
		$use_cache = false;

		/** This filter is documented in class.jetpack.php */
		if ( apply_filters( 'jetpack_just_in_time_msg_cache', false ) ) {
			$use_cache = true;
		}

		if ( $use_cache ) {
			$last_sync  = (int) get_transient( 'jetpack_last_plugin_sync' );
			$from_cache = $envelopes && $last_sync > 0 && $last_sync < $envelopes['last_response_time'];
		} else {
			$from_cache = false;
		}

		// Otherwise, ask again.
		if ( ! $from_cache ) {
			$wpcom_response = Client::wpcom_json_api_request_as_blog(
				$path,
				'2',
				array(
					'user_id'    => $user->ID,
					'user_roles' => implode( ',', $user->roles ),
				),
				null,
				'wpcom'
			);

			// silently fail...might be helpful to track it?
			if ( is_wp_error( $wpcom_response ) ) {
				return array();
			}

			$envelopes = json_decode( $wpcom_response['body'] );

			if ( ! is_array( $envelopes ) ) {
				return array();
			}

			$expiration = isset( $envelopes[0] ) ? $envelopes[0]->ttl : 300;

			// Do not cache if expiration is 0 or we're not using the cache.
			if ( 0 !== $expiration && $use_cache ) {
				$envelopes['last_response_time'] = time();

				set_transient( 'jetpack_jitm_' . substr( md5( $path ), 0, 31 ), $envelopes, $expiration );
			}
		}

		$hidden_jitms = \Jetpack_Options::get_option( 'hide_jitm' );
		unset( $envelopes['last_response_time'] );

		/**
		 * Allow adding your own custom JITMs after a set of JITMs has been received.
		 *
		 * @since 6.9.0
		 * @since 8.3.0 - Added Message path.
		 *
		 * @param array  $envelopes    array of existing JITMs.
		 * @param string $message_path The message path to ask for.
		 */
		$envelopes = apply_filters( 'jetpack_jitm_received_envelopes', $envelopes, $message_path );

		foreach ( $envelopes as $idx => &$envelope ) {

			$dismissed_feature = isset( $hidden_jitms[ $envelope->feature_class ] ) && is_array( $hidden_jitms[ $envelope->feature_class ] ) ? $hidden_jitms[ $envelope->feature_class ] : null;

			// If the this feature class has been dismissed and the request has not passed the ttl, skip it as it's been dismissed.
			if ( is_array( $dismissed_feature ) && ( time() - $dismissed_feature['last_dismissal'] < $envelope->expires || $dismissed_feature['number'] >= $envelope->max_dismissal ) ) {
				unset( $envelopes[ $idx ] );
				continue;
			}

			$this->tracking->record_user_event(
				'jitm_view_client',
				array(
					'jitm_id' => $envelope->id,
				)
			);

			$normalized_site_url = \Jetpack::build_raw_urls( get_home_url() );

			$url_params = array(
				'source' => "jitm-$envelope->id",
				'site'   => $normalized_site_url,
				'u'      => $user->ID,
			);

			// Get affiliate code and add it to the array of URL parameters.
			$aff = Partner::init()->get_partner_code( Partner::AFFILIATE_CODE );
			if ( '' !== $aff ) {
				$url_params['aff'] = $aff;
			}

			$envelope->url = add_query_arg( $url_params, 'https://jetpack.com/redirect/' );

			$envelope->jitm_stats_url = \Jetpack::build_stats_url( array( 'x_jetpack-jitm' => $envelope->id ) );

			// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			// $CTA is not valid per PHPCS, but it is part of the return from WordPress.com, so allowing.
			if ( $envelope->CTA->hook ) {
				$envelope->url = apply_filters( 'jitm_' . $envelope->CTA->hook, $envelope->url );
				unset( $envelope->CTA->hook );
			}
			// phpcs:enable

			if ( isset( $envelope->content->hook ) ) {
				$envelope->content = apply_filters( 'jitm_' . $envelope->content->hook, $envelope->content );
				unset( $envelope->content->hook );
			}

			// No point in showing an empty message.
			if ( empty( $envelope->content->message ) ) {
				unset( $envelopes[ $idx ] );
				continue;
			}

			switch ( $envelope->content->icon ) {
				case 'jetpack':
					$jetpack_logo            = new Jetpack_Logo();
					$envelope->content->icon = '<div class="jp-emblem">' . $jetpack_logo->get_jp_emblem() . '</div>';
					break;
				case 'woocommerce':
					$envelope->content->icon = '<div class="jp-emblem"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 168 100" xml:space="preserve" enable-background="new 0 0 168 100" width="50" height="30"><style type="text/css">
					.st0{clip-path:url(#SVGID_2_);enable-background:new    ;}
					.st1{clip-path:url(#SVGID_4_);}
					.st2{clip-path:url(#SVGID_6_);}
					.st3{clip-path:url(#SVGID_8_);fill:#8F567F;}
					.st4{clip-path:url(#SVGID_10_);fill:#FFFFFE;}
					.st5{clip-path:url(#SVGID_12_);fill:#FFFFFE;}
					.st6{clip-path:url(#SVGID_14_);fill:#FFFFFE;}
				</style><g><defs><polygon id="SVGID_1_" points="83.8 100 0 100 0 0.3 83.8 0.3 167.6 0.3 167.6 100 "/></defs><clipPath id="SVGID_2_"><use xlink:href="#SVGID_1_" overflow="visible"/></clipPath><g class="st0"><g><defs><rect id="SVGID_3_" width="168" height="100"/></defs><clipPath id="SVGID_4_"><use xlink:href="#SVGID_3_" overflow="visible"/></clipPath><g class="st1"><defs><path id="SVGID_5_" d="M15.6 0.3H152c8.6 0 15.6 7 15.6 15.6v52c0 8.6-7 15.6-15.6 15.6h-48.9l6.7 16.4L80.2 83.6H15.6C7 83.6 0 76.6 0 67.9v-52C0 7.3 7 0.3 15.6 0.3"/></defs><clipPath id="SVGID_6_"><use xlink:href="#SVGID_5_" overflow="visible"/></clipPath><g class="st2"><defs><rect id="SVGID_7_" width="168" height="100"/></defs><clipPath id="SVGID_8_"><use xlink:href="#SVGID_7_" overflow="visible"/></clipPath><rect x="-10" y="-9.7" class="st3" width="187.6" height="119.7"/></g></g></g></g></g><g><defs><path id="SVGID_9_" d="M8.4 14.5c1-1.3 2.4-2 4.3-2.1 3.5-0.2 5.5 1.4 6 4.9 2.1 14.3 4.4 26.4 6.9 36.4l15-28.6c1.4-2.6 3.1-3.9 5.2-4.1 3-0.2 4.9 1.7 5.6 5.7 1.7 9.1 3.9 16.9 6.5 23.4 1.8-17.4 4.8-30 9-37.7 1-1.9 2.5-2.9 4.5-3 1.6-0.1 3 0.3 4.3 1.4 1.3 1 2 2.3 2.1 3.9 0.1 1.2-0.1 2.3-0.7 3.3 -2.7 5-4.9 13.2-6.6 24.7 -1.7 11.1-2.3 19.8-1.9 26.1 0.1 1.7-0.1 3.2-0.8 4.5 -0.8 1.5-2 2.4-3.7 2.5 -1.8 0.1-3.6-0.7-5.4-2.5C52.4 66.7 47.4 57 43.7 44.1c-4.4 8.8-7.7 15.3-9.9 19.7 -4 7.7-7.5 11.7-10.3 11.9 -1.9 0.1-3.5-1.4-4.8-4.7 -3.5-9-7.3-26.3-11.3-52C7.1 17.3 7.5 15.8 8.4 14.5"/></defs><clipPath id="SVGID_10_"><use xlink:href="#SVGID_9_" overflow="visible"/></clipPath><rect x="-2.7" y="-0.6" class="st4" width="90.6" height="86.4"/></g><g><defs><path id="SVGID_11_" d="M155.6 25.2c-2.5-4.3-6.1-6.9-11-7.9 -1.3-0.3-2.5-0.4-3.7-0.4 -6.6 0-11.9 3.4-16.1 10.2 -3.6 5.8-5.3 12.3-5.3 19.3 0 5.3 1.1 9.8 3.3 13.6 2.5 4.3 6.1 6.9 11 7.9 1.3 0.3 2.5 0.4 3.7 0.4 6.6 0 12-3.4 16.1-10.2 3.6-5.9 5.3-12.4 5.3-19.4C159 33.4 157.9 28.9 155.6 25.2zM147 44.2c-0.9 4.5-2.7 7.9-5.2 10.1 -2 1.8-3.9 2.5-5.5 2.2 -1.7-0.3-3-1.8-4-4.4 -0.8-2.1-1.2-4.2-1.2-6.2 0-1.7 0.2-3.4 0.5-5 0.6-2.8 1.8-5.5 3.6-8.1 2.3-3.3 4.7-4.8 7.1-4.2 1.7 0.3 3 1.8 4 4.4 0.8 2.1 1.2 4.2 1.2 6.2C147.5 40.9 147.3 42.6 147 44.2z"/></defs><clipPath id="SVGID_12_"><use xlink:href="#SVGID_11_" overflow="visible"/></clipPath><rect x="109.6" y="6.9" class="st5" width="59.4" height="71.4"/></g><g><defs><path id="SVGID_13_" d="M112.7 25.2c-2.5-4.3-6.1-6.9-11-7.9 -1.3-0.3-2.5-0.4-3.7-0.4 -6.6 0-11.9 3.4-16.1 10.2 -3.5 5.8-5.3 12.3-5.3 19.3 0 5.3 1.1 9.8 3.3 13.6 2.5 4.3 6.1 6.9 11 7.9 1.3 0.3 2.5 0.4 3.7 0.4 6.6 0 12-3.4 16.1-10.2 3.5-5.9 5.3-12.4 5.3-19.4C116 33.4 114.9 28.9 112.7 25.2zM104.1 44.2c-0.9 4.5-2.7 7.9-5.2 10.1 -2 1.8-3.9 2.5-5.5 2.2 -1.7-0.3-3-1.8-4-4.4 -0.8-2.1-1.2-4.2-1.2-6.2 0-1.7 0.2-3.4 0.5-5 0.6-2.8 1.8-5.5 3.6-8.1 2.3-3.3 4.7-4.8 7.1-4.2 1.7 0.3 3 1.8 4 4.4 0.8 2.1 1.2 4.2 1.2 6.2C104.6 40.9 104.4 42.6 104.1 44.2z"/></defs><clipPath id="SVGID_14_"><use xlink:href="#SVGID_13_" overflow="visible"/></clipPath><rect x="66.7" y="6.9" class="st6" width="59.4" height="71.4"/></g></svg></div>';
					break;
				default:
					$envelope->content->icon = '';
					break;
			}

			$jetpack = \Jetpack::init();
			$jetpack->stat( 'jitm', $envelope->id . '-viewed-' . JETPACK__VERSION );
			$jetpack->do_stats( 'server_side' );
		}

		return $envelopes;
	}

	/**
	 * Is the current page a block editor page?
	 *
	 * @since 8.0.0
	 */
	private function is_gutenberg_page() {
		$current_screen = get_current_screen();
		return ( method_exists( $current_screen, 'is_block_editor' ) && $current_screen->is_block_editor() );
	}
}
