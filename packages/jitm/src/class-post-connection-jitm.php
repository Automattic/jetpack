<?php
/**
 * Jetpack's Post-Connection JITM class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Tracking;
use Automattic\Jetpack\JITMS\JITM;

/**
 * Jetpack just in time messaging through out the admin
 *
 * @since 5.6.0
 */
class Post_Connection_JITM extends JITM {

	/**
	 * Tracking object.
	 *
	 * @var Automattic\Jetpack\Tracking
	 *
	 * @access private
	 */
	public $tracking;

	/**
	 * JITM constructor.
	 */
	public function __construct() {
		$this->tracking = new Tracking();
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
		parent::prepare_jitms( $screen );
		if ( ! in_array(
			$screen->id,
			array(
				'jetpack_page_akismet-key-config',
				'admin_page_jetpack_modules',
			),
			true
		) ) {
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

		$connected_admins = $connection_manager->get_connected_users( 'jetpack_disconnect' );
		$user             = is_a( $connection_owner_userdata, 'WP_User' ) ? esc_html( $connection_owner_userdata->data->user_login ) : '';

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
			esc_url( Redirect::get_url( 'jetpack-support-primary-user' ) )
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
			esc_url( Redirect::get_url( 'jetpack-contact-support' ) )
		);
		echo '</p>';
		echo '</div>';
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
		$this->save_dismiss( $feature_class );
		return true;
	}

	/**
	 * Asks the wpcom API for the current message to display keyed on query string and message path
	 *
	 * @param string $message_path The message path to ask for.
	 * @param string $query The query string originally from the front end.
	 * @param bool   $full_jp_logo_exists If there is a full Jetpack logo already on the page.
	 *
	 * @return array The JITM's to show, or an empty array if there is nothing to show
	 */
	public function get_messages( $message_path, $query, $full_jp_logo_exists ) {
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

			$envelope->content->icon = $this->generate_icon( $envelope->content->icon, $full_jp_logo_exists );

			$jetpack = \Jetpack::init();
			$jetpack->stat( 'jitm', $envelope->id . '-viewed-' . JETPACK__VERSION );
			$jetpack->do_stats( 'server_side' );
		}

		return $envelopes;
	}

}
