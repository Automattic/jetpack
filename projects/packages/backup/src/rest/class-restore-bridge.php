<?php
/**
 * Restore REST bridge — proxies /activity-log/{site}/rewind/to and /rewind/{id}/restore-status.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Connection\Client;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Restore endpoints powering the Restore screen:
 *   - POST /jetpack/v4/rewind/to/{rewindId}                     → initiate restore
 *   - GET  /jetpack/v4/rewind/restore/{restoreId}/status        → poll status
 */
class Restore_Bridge {

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/rewind/to/(?P<rewind_id>[A-Za-z0-9.\-]+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'initiate_restore' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'rewind_id' => array(
						'type'     => 'string',
						'required' => true,
					),
					'types'     => array(
						'type'                 => 'object',
						// See the download bridge: `object` alone accepts a
						// JSON list, because WordPress validates it with
						// `is_array()`.
						'additionalProperties' => array( 'type' => 'boolean' ),
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/rewind/restore/(?P<restore_id>\d+)/status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_restore_status' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'restore_id' => array(
						'type'     => 'integer',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Initiate a restore.
	 *
	 * Proxies POST rest/v1 /activity-log/{site}/rewind/to/{rewindId}.
	 *
	 * Sign as the user: rewind is a destructive admin action and
	 * WPCOM's audit log identifies the actor by their wpcom user.
	 * (We tried as_blog v1.1 to side-step user-permission
	 * requirements; WPCOM rejects it with `That API call is not
	 * allowed for this account.` — the rewind endpoint refuses
	 * blog-token auth entirely.)
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function initiate_restore( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}
		$rewind_id = (string) $request->get_param( 'rewind_id' );
		$types     = $request->get_param( 'types' );

		// A supplied `types` that names nothing is refused rather than
		// dropped, and this is the screen where that matters most: an
		// absent `types` means every category upstream, so forwarding an
		// empty selection as an omission would overwrite the live site
		// with exactly the parts the caller excluded.
		//
		// This bridge is currently the only guard on that: the call below
		// still targets the v1 activity-log route, which has no such
		// check. The v2 restore route does reject it, so once B1 repoints
		// this there will be a second line of defence — but it will always
		// be the slower one, since it only fires after the request leaves.
		if ( Rest_Controller::types_name_nothing( $types ) ) {
			return new WP_Error(
				'no_types_selected',
				__( 'Select at least one item to restore.', 'jetpack-backup-pkg' ),
				array( 'status' => 400 )
			);
		}

		$body = array( 'force_rewind' => true );
		// Absent when the caller named no categories at all, which is how
		// a whole-site restore is spelled upstream. Rebuilt as a named map
		// otherwise — the same contract the download bridge follows.
		$named_types = Rest_Controller::named_types( $types );
		if ( ! empty( $named_types ) ) {
			$body['types'] = $named_types;
		}

		// `base_api_path` defaults to 'wpcom' on `as_user`, but the
		// activity-log endpoints live under `rest/v1/...`
		// (https://public-api.wordpress.com/rest/v1/activity-log/...).
		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/activity-log/%d/rewind/to/%s', $blog_id, rawurlencode( $rewind_id ) ),
			'1',
			array( 'method' => 'POST' ),
			$body,
			'rest'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'restore_initiate_failed' );
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'restore_initiate_failed',
				__( 'Could not start the backup restore.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		$body          = json_decode( wp_remote_retrieve_body( $response ), true );
		$restore_id_in = is_array( $body ) && isset( $body['restore_id'] ) ? (int) $body['restore_id'] : 0;
		if ( ! $restore_id_in ) {
			return new WP_Error(
				'restore_initiate_failed',
				__( 'Could not start the backup restore.', 'jetpack-backup-pkg' ),
				array( 'status' => 500 )
			);
		}
		return rest_ensure_response( array( 'id' => $restore_id_in ) );
	}

	/**
	 * Poll restore status.
	 *
	 * Proxies GET rest/v1 /activity-log/{site}/rewind/{restore_id}/restore-status.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_restore_status( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}
		$restore_id = (int) $request->get_param( 'restore_id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/activity-log/%d/rewind/%d/restore-status', $blog_id, $restore_id ),
			'1',
			array(),
			null,
			'rest'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'restore_status_fetch_failed' );
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'restore_status_fetch_failed',
				__( 'Could not fetch restore progress.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		$body   = json_decode( wp_remote_retrieve_body( $response ), true );
		$status = is_array( $body ) && isset( $body['restore_status'] ) && is_array( $body['restore_status'] )
			? $body['restore_status']
			: ( is_array( $body ) ? $body : array() );

		return rest_ensure_response(
			array(
				'id'         => isset( $status['restore_id'] ) ? (int) $status['restore_id'] : $restore_id,
				'status'     => isset( $status['status'] ) ? (string) $status['status'] : 'queued',
				'progress'   => isset( $status['percent'] ) ? (float) $status['percent'] : 0,
				'rewind_id'  => isset( $status['rewind_id'] ) ? (string) $status['rewind_id'] : '',
				'error_code' => isset( $status['error_code'] ) ? (string) $status['error_code'] : '',
				'message'    => isset( $status['message'] ) ? (string) $status['message'] : '',
			)
		);
	}
}
