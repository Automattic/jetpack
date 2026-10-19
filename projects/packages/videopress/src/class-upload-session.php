<?php
/**
 * Site-owned attachments for resumable uploads.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use WP_Error;

/**
 * Keeps upload identity stable while tokens and completion responses are retried.
 *
 * @since $$next-version$$
 */
class Upload_Session {
	const META_KEY        = '_videopress_upload_session';
	const SOURCE_META_KEY = '_videopress_upload_attachment';

	/**
	 * Allocate an attachment before requesting its upload token.
	 *
	 * @param string $title Attachment title.
	 * @param int    $source_id Optional source attachment, which is never replaced.
	 * @return array|WP_Error
	 */
	public static function start( $title, $source_id = 0 ) {
		$post_id = $source_id ? (int) get_post_meta( $source_id, self::SOURCE_META_KEY, true ) : 0;
		if ( $post_id && ! get_post( $post_id ) ) {
			delete_post_meta( $source_id, self::SOURCE_META_KEY, $post_id );
			$post_id = (int) get_post_meta( $source_id, self::SOURCE_META_KEY, true );
		}
		if ( ! $post_id ) {
			$post_id = self::allocate( $title, 0, $source_id );
			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}
		}
		return self::token( $post_id );
	}

	/**
	 * Allocate only our own empty placeholder; WordPress decides its actual ID.
	 *
	 * @param string $title Title.
	 * @param int    $minimum Minimum accepted ID.
	 * @param int    $source_id Source attachment, or zero.
	 * @param int    $previous_id Previous placeholder when recovering a collision.
	 * @return int|WP_Error
	 */
	private static function allocate( $title, $minimum, $source_id, $previous_id = 0 ) {
		$post_id = videopress_create_new_media_item( $title, null, $minimum );
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}
		$session = array(
			'blog_id'   => (int) VideoPressToken::blog_id(),
			'source_id' => $source_id,
			'guid'      => '',
		);
		if ( ! add_post_meta( $post_id, self::META_KEY, $session, true ) ) {
			wp_delete_attachment( $post_id, true );
			return self::error();
		}
		if ( $source_id ) {
			if ( $previous_id ) {
				update_post_meta( $source_id, self::SOURCE_META_KEY, $post_id, $previous_id );
			} else {
				add_post_meta( $source_id, self::SOURCE_META_KEY, $post_id, true );
			}
			if ( (int) get_post_meta( $source_id, self::SOURCE_META_KEY, true ) !== $post_id ) {
				wp_delete_attachment( $post_id, true );
				return self::error();
			}
			$source = get_post( $source_id );
			wp_update_post(
				array(
					'ID'           => $post_id,
					'post_content' => $source->post_content,
					'post_excerpt' => $source->post_excerpt,
				)
			);
		}
		return $post_id;
	}

	/**
	 * Read an attachment we allocated for this connected site.
	 *
	 * @param int $post_id Attachment ID.
	 * @return array|null
	 */
	public static function get( $post_id ) {
		$session = get_post_meta( $post_id, self::META_KEY, true );
		return is_array( $session ) && (int) ( $session['blog_id'] ?? 0 ) === (int) VideoPressToken::blog_id()
		&& 'attachment' === get_post_type( $post_id ) && 'video/videopress' === get_post_mime_type( $post_id ) ? $session : null;
	}

	/**
	 * Retry only a confirmed ID collision. Transport failures preserve the attachment.
	 *
	 * @param int $post_id Attachment ID.
	 * @return array|WP_Error
	 */
	public static function token( $post_id ) {
		$result = self::request_token( $post_id );
		if ( is_wp_error( $result ) ) {
			$data = $result->get_error_data();
			$result->add_data( array_merge( is_array( $data ) ? $data : array(), array( 'attachment_id' => $post_id ) ) );
		}
		return $result;
	}

	/**
	 * Request a token, carrying replacement IDs back to the caller on failure.
	 *
	 * @param int $post_id Attachment ID, updated after collision recovery.
	 * @return array|WP_Error
	 */
	private static function request_token( &$post_id ) {
		for ( $attempt = 0; $attempt < 3; ++$attempt ) {
			$session = self::get( $post_id );
			if ( ! $session || 'replacing' === $session['guid'] || 'legacy' === $session['guid'] ) {
				return self::error();
			}
			$body = array( 'post_id' => $post_id );
			if ( $session['guid'] ) {
				$body['guid'] = $session['guid'];
			}
			$response = self::request( '', 'POST', $body );
			if ( is_wp_error( $response ) ) {
				$data    = $response->get_error_data();
				$data    = is_array( $data ) ? $data : array();
				$minimum = filter_var(
					$data['minimum_attachment_id'] ?? null,
					FILTER_VALIDATE_INT,
					array(
						'options' => array(
							'min_range' => $post_id + 1,
							'max_range' => PHP_INT_MAX - 1,
						),
					)
				);
				if ( 410 === (int) ( $data['status'] ?? 0 ) && $session['guid'] && true === self::complete( $post_id ) ) {
					return array(
						'complete' => true,
						'post_id'  => $post_id,
						'guid'     => $session['guid'],
					);
				}
				if ( 'videopress_attachment_id_collision' !== $response->get_error_code() || 409 !== (int) ( $data['status'] ?? 0 ) || ! $minimum || $session['guid'] || get_post_meta( $post_id, 'videopress_guid', true ) || 2 === $attempt ) {
					$response->add_data( array_merge( is_array( $data ) ? $data : array(), array( 'attachment_id' => $post_id ) ) );
					return $response;
				}
				$claimed         = $session;
				$claimed['guid'] = 'replacing';
				// Claim before changing the source pointer; another response may already have bound this ID.
				if ( ! update_post_meta( $post_id, self::META_KEY, $claimed, $session ) ) {
					return self::error();
				}
				$replacement = self::allocate( get_post( $post_id )->post_title, $minimum, $session['source_id'], $post_id );
				if ( is_wp_error( $replacement ) ) {
					update_post_meta( $post_id, self::META_KEY, $session, $claimed );
					return $replacement;
				}
				wp_delete_attachment( $post_id, true );
				$post_id = $replacement;
				continue;
			}
			if ( empty( $response['upload_token'] ) ) {
				return self::error();
			}
			if ( (int) ( $response['post_id'] ?? 0 ) !== $post_id || ! preg_match( '/^[a-zA-Z0-9]{8}$/D', $response['guid'] ?? '' ) ) {
				// An older server explicitly returned an unbound token. Keep the legacy callback path.
				if ( empty( $response['post_id'] ) && empty( $response['guid'] ) && ! $session['guid'] && self::get( $post_id ) === $session && ! get_post_meta( $post_id, 'videopress_guid', true ) ) {
					$legacy         = $session;
					$legacy['guid'] = 'legacy';
					if ( ! update_post_meta( $post_id, self::META_KEY, $legacy, $session ) ) {
						return self::error();
					}
					wp_delete_attachment( $post_id, true );
					if ( $session['source_id'] ) {
						delete_post_meta( $session['source_id'], self::SOURCE_META_KEY, $post_id );
					}
					return $response;
				}
				return self::error();
			}
			if ( $session['guid'] && $session['guid'] !== $response['guid'] ) {
				return self::error();
			}
			$previous        = $session;
			$session['guid'] = $response['guid'];
			update_post_meta( $post_id, self::META_KEY, $session, $previous );
			if ( self::get( $post_id ) !== $session ) {
				return self::error();
			}
			return $response;
		}
		return self::error();
	}

	/**
	 * Confirm completion using the stored reservation, never a browser-supplied GUID.
	 *
	 * @param int $post_id Attachment ID.
	 * @return bool|WP_Error
	 */
	public static function complete( $post_id ) {
		$session = self::get( $post_id );
		if ( ! $session || ! $session['guid'] ) {
			return self::error();
		}
		$status = self::request( '/' . $session['guid'] . '?post_id=' . $post_id, 'GET' );
		if ( is_wp_error( $status ) ) {
			return $status;
		}
		if ( 'done' !== ( $status['state'] ?? '' ) || $session['guid'] !== ( $status['guid'] ?? '' ) || $post_id !== (int) ( $status['post_id'] ?? 0 ) ) {
			return new WP_Error( 'videopress_upload_not_complete', __( 'This upload has not finished yet. Please try again.', 'jetpack-videopress-pkg' ), array( 'status' => 409 ) );
		}
		update_post_meta( $post_id, 'videopress_guid', $session['guid'] );
		$meta                       = wp_get_attachment_metadata( $post_id );
		$meta                       = is_array( $meta ) ? $meta : array();
		$meta['videopress']['guid'] = $session['guid'];
		wp_update_attachment_metadata( $post_id, $meta );
		if ( ! videopress_update_meta_data( $post_id ) ) {
			return self::error();
		}
		return true;
	}

	/**
	 * Refresh processing attachments during authenticated media polling when callbacks are unavailable.
	 *
	 * @param mixed            $response REST response.
	 * @param \WP_REST_Server  $server Server.
	 * @param \WP_REST_Request $request Request.
	 * @return mixed
	 */
	public static function refresh_media_response( $response, $server, $request ) {
		if ( 'GET' !== $request->get_method() || ! preg_match( '#^/wp/v2/media(?:/[0-9]+)?$#D', $request->get_route() ) || ! current_user_can( 'upload_files' ) || is_wp_error( $response ) || $response->get_status() !== 200 ) {
			return $response;
		}
		$data = $response->get_data();
		if ( ! is_array( $data ) ) {
			return $response;
		}
		$single = isset( $data['id'] );
		$items  = $single ? array( $data ) : $data;
		foreach ( $items as &$item ) {
			$post_id = (int) ( $item['id'] ?? 0 );
			if ( self::refresh_attachment( $post_id ) ) {
				$controller = new \WP_REST_Attachments_Controller( 'attachment' );
				$item       = $controller->prepare_response_for_collection( $controller->prepare_item_for_response( get_post( $post_id ), $request ) );
			}
		}
		unset( $item );
		$response->set_data( $single ? $items[0] : $items );
		return $response;
	}

	/**
	 * Poll an owned attachment at most once per ten seconds in authenticated media views.
	 *
	 * @param int $post_id Attachment ID.
	 * @return bool Whether metadata was refreshed.
	 */
	public static function refresh_attachment( $post_id ) {
		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) || ! self::get( $post_id ) || ! in_array( get_post_meta( $post_id, 'videopress_status', true ), array( 'initiated', 'processing' ), true ) || get_transient( 'videopress_upload_poll_' . $post_id ) ) {
			return false;
		}
		set_transient( 'videopress_upload_poll_' . $post_id, 1, 10 );
		if ( 'initiated' === get_post_meta( $post_id, 'videopress_status', true ) ) {
			return true === self::complete( $post_id );
		}
		return videopress_update_meta_data( $post_id );
	}

	/**
	 * Make the existing signed token/status request, preserving structured collision errors.
	 *
	 * @param string $suffix Resource suffix.
	 * @param string $method HTTP method.
	 * @param array  $body Request data.
	 * @return array|WP_Error
	 */
	private static function request( $suffix, $method, $body = array() ) {
		$blog_id = VideoPressToken::blog_id();
		$result  = Client::wpcom_json_api_request_as_blog(
			"sites/{$blog_id}/media/videopress-upload-jwt{$suffix}",
			'v2',
			array(
				'method'  => $method,
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			$body ? wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) : null,
			'wpcom'
		);
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$response = json_decode( wp_remote_retrieve_body( $result ), true );
		$response = is_array( $response ) ? $response : array();
		$status   = wp_remote_retrieve_response_code( $result );
		if ( $status < 200 || $status >= 300 ) {
			return new WP_Error( $response['code'] ?? 'videopress_upload_request_failed', $response['message'] ?? __( 'The upload request failed. Please try again.', 'jetpack-videopress-pkg' ), array_merge( is_array( $response['data'] ?? null ) ? $response['data'] : array(), array( 'status' => $status ) ) );
		}
		return $response;
	}

	/**
	 * Keep uncertain sessions intact for a later retry.
	 *
	 * @return WP_Error
	 */
	private static function error() {
		return new WP_Error( 'videopress_upload_session_error', __( 'Unable to confirm this upload. Please try again.', 'jetpack-videopress-pkg' ), array( 'status' => 503 ) );
	}
}
