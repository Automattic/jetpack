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
	 * User meta key holding the writer's decision. The wpcom Reader endpoints
	 * add `followed_blog_ids` and move the status to `completed` under the
	 * same key, so writes here merge rather than replace.
	 */
	const USER_META_KEY = 'wpcom_four_for_four';

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
		$eligible = $this->is_site_eligible() && ! isset( $this->get_user_status_meta()['status'] );

		return rest_ensure_response( array( 'eligible' => $eligible ) );
	}

	/**
	 * Record the writer's decision from the editor prompt.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function set_four_for_four_status( $request ) {
		$status = $request->get_param( 'status' );
		$meta   = $this->get_user_status_meta();

		if ( isset( $meta['status'] ) && 'completed' === $meta['status'] ) {
			return new \WP_Error( 'already_completed', 'The program has already been completed.', array( 'status' => 409 ) );
		}

		update_user_meta(
			get_current_user_id(),
			self::USER_META_KEY,
			array_merge(
				$meta,
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
	private function get_user_status_meta() {
		$meta = get_user_meta( get_current_user_id(), self::USER_META_KEY, true );
		return is_array( $meta ) ? $meta : array();
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

		if ( 'launched' !== get_option( 'launch-status' ) ) {
			return false;
		}

		$status = new Status();
		if ( $status->is_coming_soon() || $status->is_private_site() ) {
			return false;
		}

		if ( ! str_starts_with( get_locale(), 'en' ) ) {
			return false;
		}

		if ( $host->is_p2_site() ) {
			return false;
		}

		/**
		 * Blog stickers that exclude a site from the 4 for 4 prompt.
		 *
		 * @param string[] $stickers Sticker names.
		 */
		$blocked_stickers = apply_filters(
			'wpcom_four_for_four_blocked_stickers',
			// These names still need verifying against wpcom's sticker registry.
			array( 'spam', 'suspended', 'hide', 'warning' )
		);
		$blog_id = get_current_blog_id();
		foreach ( $blocked_stickers as $sticker ) {
			if ( wpcom_has_blog_sticker( $sticker, $blog_id ) ) {
				return false;
			}
		}

		return true;
	}
}
