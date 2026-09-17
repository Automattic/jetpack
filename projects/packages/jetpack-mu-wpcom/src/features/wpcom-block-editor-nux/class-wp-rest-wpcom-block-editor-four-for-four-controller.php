<?php
/**
 * WP_REST_WPCOM_Block_Editor_Four_For_Four_Controller file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\NUX;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Class WP_REST_WPCOM_Block_Editor_Four_For_Four_Controller.
 *
 * Eligibility and opt-in state for the "4 for 4" prompt shown after a site's
 * first post is published. The decision lives in user meta (global across a
 * Simple user's sites) so the same writer is asked once, on one site.
 */
class WP_REST_WPCOM_Block_Editor_Four_For_Four_Controller extends \WP_REST_Controller {
	/**
	 * User attribute holding the writer's decision. User attributes are the
	 * global per-user store on wpcom (user meta is per blog), and the wpcom
	 * Reader endpoints read this same attribute, adding `followed_blog_ids`
	 * and moving the status to `completed`, so writes here merge rather than
	 * replace.
	 */
	const USER_ATTRIBUTE = 'wpcom_four_for_four';

	/**
	 * Statuses the editor prompt may write.
	 *
	 * @var string[]
	 */
	const EDITOR_STATUSES = array( 'opted_in', 'opted_out' );

	/**
	 * WP_REST_WPCOM_Block_Editor_Four_For_Four_Controller constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'block-editor/four-for-four';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_four_for_four' ),
					'permission_callback' => array( $this, 'permission_callback' ),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'set_four_for_four_status' ),
					'permission_callback' => array( $this, 'permission_callback' ),
					'args'                => array(
						'status' => array(
							'required'          => true,
							'type'              => 'string',
							'enum'              => self::EDITOR_STATUSES,
							'validate_callback' => 'rest_validate_request_arg',
						),
					),
				),
			)
		);
	}

	/**
	 * Callback to determine whether the request can proceed.
	 *
	 * @return boolean
	 */
	public function permission_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Whether the current user should be offered the program on this site.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_four_for_four() {
		$eligible = $this->is_site_eligible() && ! isset( $this->get_user_status()['status'] );

		return rest_ensure_response( array( 'eligible' => $eligible ) );
	}

	/**
	 * Record the writer's decision from the editor prompt.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function set_four_for_four_status( $request ) {
		if ( ! function_exists( 'update_user_attribute' ) ) {
			return new \WP_Error( 'four_for_four_unavailable', 'The program is not available on this site.', array( 'status' => 501 ) );
		}

		$status  = $request->get_param( 'status' );
		$current = $this->get_user_status();

		if ( isset( $current['status'] ) && 'completed' === $current['status'] ) {
			return new \WP_Error( 'already_completed', 'The program has already been completed.', array( 'status' => 409 ) );
		}

		// The attribute helpers live in wpcom, outside this monorepo, so Phan can't see them.
		// @phan-suppress-next-line PhanUndeclaredFunction
		update_user_attribute(
			get_current_user_id(),
			self::USER_ATTRIBUTE,
			array_merge(
				$current,
				array(
					'status'  => $status,
					'blog_id' => (int) get_current_blog_id(),
					'updated' => time(),
				)
			)
		);

		return rest_ensure_response( array( 'status' => $status ) );
	}

	/**
	 * The stored decision for the current user, or an empty array.
	 *
	 * @return array
	 */
	private function get_user_status() {
		if ( ! function_exists( 'get_user_attribute' ) ) {
			return array();
		}
		// @phan-suppress-next-line PhanUndeclaredFunction
		$state = get_user_attribute( get_current_user_id(), self::USER_ATTRIBUTE );
		return is_array( $state ) ? $state : array();
	}

	/**
	 * Whether this site qualifies for the prompt. Like the sibling first-post
	 * controller, this is read when the editor loads, while
	 * `has_never_published_post` is still set for the post being written.
	 *
	 * @return boolean
	 */
	private function is_site_eligible() {
		/**
		 * Enables the 4 for 4 prompt. Off by default so this package can ship
		 * ahead of the wpcom endpoints the Reader page depends on; wpcom turns
		 * it on once those are live.
		 *
		 * @param bool $enabled Whether the prompt may be shown. Default false.
		 */
		if ( ! apply_filters( 'wpcom_four_for_four_enabled', false ) ) {
			return false;
		}

		$host = new Host();
		if ( ! $host->is_wpcom_simple() ) {
			return false;
		}

		if ( ! get_option( 'has_never_published_post', false ) ) {
			return false;
		}

		// Sites created before the launch flow have no launch status and count as launched.
		$launch_status = get_option( 'launch-status' );
		if ( $launch_status && 'launched' !== $launch_status ) {
			return false;
		}

		// Both Coming Soon generations: the v1 option paired with a private blog, and the public v2 flag.
		// These helpers live in wpcom, outside this monorepo, so Phan can't see them.
		// @phan-suppress-next-line PhanUndeclaredFunction
		if ( function_exists( 'wpcom_is_coming_soon' ) && wpcom_is_coming_soon() ) {
			return false;
		}
		// @phan-suppress-next-line PhanUndeclaredFunction
		if ( function_exists( 'is_wpcom_public_coming_soon_enabled' ) && is_wpcom_public_coming_soon_enabled() ) {
			return false;
		}

		if ( ( new Status() )->is_private_site() ) {
			return false;
		}

		if ( ! str_starts_with( get_locale(), 'en' ) ) {
			return false;
		}

		if ( $host->is_p2_site() ) {
			return false;
		}

		$blog_id = get_current_blog_id();

		// Spam, deleted, archived, mature, suspended and hidden sites are all excluded here.
		// @phan-suppress-next-line PhanUndeclaredFunction
		if ( function_exists( 'is_public_to_people' ) && ! is_public_to_people( $blog_id ) ) {
			return false;
		}

		/**
		 * Blog stickers that exclude a site from the 4 for 4 prompt.
		 *
		 * @param string[] $stickers Sticker names.
		 */
		$blocked_stickers = apply_filters(
			'wpcom_four_for_four_blocked_stickers',
			array( 'broken-in-reader', 'is_disconnected', 'dont-recommend', 'a8c-test-blog', 'a8c-e2e-test-blog' )
		);
		foreach ( $blocked_stickers as $sticker ) {
			if ( wpcom_has_blog_sticker( $sticker, $blog_id ) ) {
				return false;
			}
		}

		return true;
	}
}
