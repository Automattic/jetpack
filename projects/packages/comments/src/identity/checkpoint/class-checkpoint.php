<?php
/**
 * The comment identity checkpoint.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * The site's checkpoint for identities carried between sites through WordPress.com.
 *
 * A site cannot read another site's cookie, so WordPress.com vouches for the
 * commenter: a popup opens WordPress.com's connect endpoint, which hands back a
 * short-lived one-time code, and the site's own server trades that code for the
 * identity over the exchange endpoint, signed with its Jetpack blog token. No
 * identity crosses page JavaScript, and no access token ever reaches it.
 *
 * This class holds the pieces every other part of the checkpoint shares: the
 * provider list, the meta keys, the broadcast channel name, and the URLs the
 * front end needs.
 */
class Checkpoint {

	/**
	 * Providers a commenter can identify with, in the order they are shown.
	 */
	const PROVIDERS = array( 'google', 'facebook', 'wordpress' );

	/**
	 * The first-party cookie holding the redeemed identity.
	 */
	const COOKIE_NAME = 'jetpack_comment_passport';

	/**
	 * The BroadcastChannel the popup and the opener talk over. Shared with the
	 * front end through the settings blob, so both ends stay in step.
	 */
	const CHANNEL = 'jetpack-comment-identity';

	/**
	 * Comment meta holding the pairwise identifier for the commenter.
	 */
	const META_SUB = 'jp_ci_sub';

	/**
	 * Comment meta holding the provider the commenter identified with. The
	 * Highlander key `hc_post_as` is the backwards-compatible equivalent.
	 */
	const META_PROVIDER = 'jp_ci_provider';

	/**
	 * Comment meta holding the commenter's avatar URL. The Highlander key
	 * `hc_avatar` is the backwards-compatible equivalent.
	 */
	const META_AVATAR = 'jp_ci_avatar';

	/**
	 * Highlander provider key, read as a fallback where the new key is absent.
	 */
	const OLD_META_PROVIDER = 'hc_post_as';

	/**
	 * Highlander avatar key, read as a fallback where the new key is absent.
	 */
	const OLD_META_AVATAR = 'hc_avatar';

	/**
	 * Register the checkpoint's hooks. Safe to call more than once.
	 *
	 * @return void
	 */
	public static function init() {
		Comment_Hooks::init();
		Landing::init();
		REST_Controller::init();
		Privacy::init();
	}

	/**
	 * Whether the checkpoint can run: the site is connected, so it holds the blog
	 * token the exchange call is signed with.
	 *
	 * @return bool
	 */
	public static function is_available() {
		if ( ! class_exists( '\Automattic\Jetpack\Connection\Manager' ) || ! class_exists( '\Jetpack_Options' ) ) {
			return false;
		}

		return ( new \Automattic\Jetpack\Connection\Manager( 'jetpack-comments' ) )->is_connected()
			&& (int) \Jetpack_Options::get_option( 'id' ) > 0
			&& count( self::providers() ) > 0;
	}

	/**
	 * The blog WordPress.com mints codes for and the exchange authenticates as.
	 *
	 * @return int
	 */
	public static function blog_id() {
		return class_exists( '\Jetpack_Options' ) ? (int) \Jetpack_Options::get_option( 'id' ) : 0;
	}

	/**
	 * The providers offered on this site.
	 *
	 * @return string[]
	 */
	public static function providers() {
		/**
		 * Filter the identity providers the comment form offers.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $providers Provider slugs, a subset of the PROVIDERS list.
		 */
		$providers = (array) apply_filters( 'jetpack_comment_identity_providers', self::PROVIDERS );

		return array_values( array_intersect( self::PROVIDERS, $providers ) );
	}

	/**
	 * WordPress.com's connect endpoint. Filterable so a sandbox can point it
	 * elsewhere; production is public-api.wordpress.com.
	 *
	 * @return string
	 */
	public static function connect_url() {
		/**
		 * Filter the base URL of the WordPress.com connect endpoint.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $url WordPress.com's connect endpoint.
		 */
		return (string) apply_filters(
			'jetpack_comment_identity_connect_url',
			'https://public-api.wordpress.com/comments/identity/connect'
		);
	}

	/**
	 * The site-origin URL WordPress.com sends the popup back to.
	 *
	 * @param string $mode Either 'popup' or 'redirect'.
	 * @return string
	 */
	public static function landing_url( $mode = 'popup' ) {
		return add_query_arg(
			array(
				'jetpack-comment-identity' => 'landing',
				'mode'                     => $mode,
			),
			home_url( '/' )
		);
	}

	/**
	 * Everything the front end needs to run the checkpoint.
	 *
	 * @return array
	 */
	public static function settings() {
		if ( ! self::is_available() ) {
			return array( 'enabled' => false );
		}

		$labels = array(
			'google'    => __( 'Continue with Google', 'jetpack-comments' ),
			'facebook'  => __( 'Continue with Facebook', 'jetpack-comments' ),
			'wordpress' => __( 'Continue with WordPress.com', 'jetpack-comments' ),
		);

		$providers = array();
		foreach ( self::providers() as $provider ) {
			$providers[] = array(
				'id'    => $provider,
				'label' => $labels[ $provider ],
			);
		}

		return array(
			'enabled'    => true,
			'blogId'     => self::blog_id(),
			'connectUrl' => self::connect_url(),
			'landingUrl' => self::landing_url(),
			'providers'  => $providers,
			'redeemUrl'  => rest_url( REST_Controller::NAMESPACE . '/identity/redeem' ),
			'logoutUrl'  => rest_url( REST_Controller::NAMESPACE . '/identity' ),
			'nonce'      => wp_create_nonce( 'wp_rest' ),
			'channel'    => self::CHANNEL,
			'disclosure' => __( 'Your name, email address and avatar from the provider you choose are shared with this site and shown with your comment.', 'jetpack-comments' ),
		);
	}
}
