<?php
/**
 * VideoPress Playlists REST terms controller.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_REST_Terms_Controller;

/**
 * REST terms controller for the playlists taxonomy.
 *
 * Core's WP_REST_Terms_Controller allows anonymous view-context reads of any
 * `show_in_rest` taxonomy, which would let logged-out visitors list every
 * playlist's name, description, count, and term meta (type, artwork ID, the
 * ordered attachment IDs) despite the taxonomy being registered `public =>
 * false`. Playlists are internal dashboard data, so reads are gated on the
 * same `upload_files` capability the taxonomy's write capabilities map to;
 * writes are already covered by those caps and the term meta auth callback.
 */
class Playlists_Rest_Controller extends WP_REST_Terms_Controller {

	/**
	 * Checks if a request has access to read playlists.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$allowed = $this->check_playlists_read_permission();
		if ( true !== $allowed ) {
			return $allowed;
		}

		return parent::get_items_permissions_check( $request );
	}

	/**
	 * Checks if a request has access to read a single playlist.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$allowed = $this->check_playlists_read_permission();
		if ( true !== $allowed ) {
			return $allowed;
		}

		return parent::get_item_permissions_check( $request );
	}

	/**
	 * Requires the `upload_files` capability, mirroring the taxonomy's write caps.
	 *
	 * @return true|WP_Error True when the current user can read playlists, WP_Error otherwise.
	 */
	private function check_playlists_read_permission() {
		if ( current_user_can( 'upload_files' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to view playlists.', 'jetpack-videopress-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
