<?php
/**
 * Jetpack's Pre-Connection JITM class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\JITMS\JITM;
use Automattic\Jetpack\JITMS\Engine;

/**
 * Jetpack just in time messaging through out the admin
 *
 * @since 5.6.0
 */
class Pre_Connection_JITM extends JITM {

	const PACKAGE_VERSION = '1.0'; // TODO: Keep in sync with version specified in composer.json.

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
	 * Retrieve the current message to display keyed on query string and message path
	 *
	 * @param string $message_path The message path to ask for.
	 * @param string $query The query string originally from the front end.
	 * @param bool   $full_jp_logo_exists If there is a full Jetpack logo already on the page.
	 *
	 * @return array The JITM's to show, or an empty array if there is nothing to show
	 */
	public function get_messages( $message_path, $query, $full_jp_logo_exists ) {
		$jitm_engine = new Engine();

		$query_string = array();
		if ( isset( $query ) ) {
			foreach ( explode( ',', $query ) as $query_item ) {
				$query_item                     = explode( '=', $query_item );
				$query_string[ $query_item[0] ] = isset( $query_item[1] ) ? $query_item[1] : null;
			}
			unset( $query_item );
		}

		$mobile_browser = jetpack_is_mobile( 'smart' );
		$user           = wp_get_current_user();

		// Unauthenticated or invalid requests just bail.
		if ( ! $user ) {
			return array();
		}

		$user_roles = implode( ',', $user->roles );

		$envelopes = $jitm_engine->get_top_messages( $message_path, $user->ID, $user_roles, $query_string, $mobile_browser );

		if ( ! is_array( $envelopes ) ) {
			return array();
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

			if ( $envelope->cta['hook'] ) {
				$envelope->url = apply_filters( 'jitm_' . $envelope->cta['hook'], $envelope->url );
				unset( $envelope->cta['hook'] );
			}

			if ( isset( $envelope->content['hook'] ) ) {
				$envelope->content = apply_filters( 'jitm_' . $envelope->content['hook'], $envelope->content );
				unset( $envelope->content['hook'] );
			}

			// No point in showing an empty message.
			if ( empty( $envelope->content['message'] ) ) {
				unset( $envelopes[ $idx ] );
				continue;
			}

			$envelope->content['icon'] = $this->generate_icon( $envelope->content['icon'], $full_jp_logo_exists );
		}

		return $envelopes;
	}

}
