<?php
/**
 * Jetpack's Post-Connection JITM class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\Tracking;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\JITMS\JITM;

/**
 * Jetpack just in time messaging through out the admin
 *
 * @since 5.6.0
 */
class Post_Connection_JITM extends JITM {

	const PACKAGE_VERSION = '1.0'; // TODO: Keep in sync with version specified in composer.json.

	/**
	 * Tracking object.
	 *
	 * @var Automattic\Jetpack\Tracking
	 *
	 * @access private
	 */
	public $tracking;

	/**
	 * Determines if JITMs are enabled.
	 *
	 * @return bool Enable JITMs.
	 */
	public function register() {
		add_action( 'current_screen', array( $this, 'prepare_jitms' ) );
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

			if ( $envelope->cta->hook ) {
				$envelope->url = apply_filters( 'jitm_' . $envelope->cta->hook, $envelope->url );
				unset( $envelope->cta->hook );
			}

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
