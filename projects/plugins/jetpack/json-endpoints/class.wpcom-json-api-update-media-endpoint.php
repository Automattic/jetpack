<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Update media item info endpoint.
 *
 * Endpoint: /sites/%s/media/%d
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

new WPCOM_JSON_API_Update_Media_Endpoint(
	array(
		'description'          => 'Edit basic information about a media item.',
		'group'                => 'media',
		'stat'                 => 'media:1:POST',
		'method'               => 'POST',
		'path'                 => '/sites/%s/media/%d',
		'deprecated'           => true,
		'max_version'          => '1',
		'new_version'          => '1.1',
		'path_labels'          => array(
			'$site'     => '(int|string) Site ID or domain',
			'$media_ID' => '(int) The ID of the media item',
		),

		'request_format'       => array(
			'title'       => '(string) The file name.',
			'caption'     => '(string) File caption.',
			'description' => '(HTML) Description of the file.',
		),

		'response_format'      => array(
			'id'          => '(int) The ID of the media item',
			'date'        => '(ISO 8601 datetime) The date the media was uploaded',
			'parent'      => '(int) ID of the post this media is attached to',
			'link'        => '(string) URL to the file',
			'title'       => '(string) File name',
			'caption'     => '(string) User provided caption of the file',
			'description' => '(string) Description of the file',
			'metadata'    => '(array) Array of metadata about the file, such as Exif data or sizes',
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/media/446',
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN',
			),
			'body'    => array(
				'title' => 'Updated Title',
			),
		),
	)
);

/**
 * Update media item info class.
 *
 * @phan-constructor-used-for-side-effects
 */
class WPCOM_JSON_API_Update_Media_Endpoint extends WPCOM_JSON_API_Endpoint {
	/**
	 * Whether the current user may edit the given media item.
	 *
	 * `upload_files` is a primitive capability and ignores any object passed to it,
	 * so it only tells us the caller may upload something, never that they may edit
	 * this particular item. A missing item is passed through so the caller receives
	 * the endpoint's own 404 rather than a 403. A userless request gets no exemption:
	 * `edit_post` fails closed for user 0 like any other caller.
	 *
	 * Do not move this into a trait: this file instantiates the endpoint above the
	 * class declaration, and `use Trait;` disables PHP early binding, which makes the
	 * file fatal with "Class not found".
	 *
	 * @param int $media_id Media post ID.
	 * @return bool
	 */
	protected function current_user_can_edit_media_item( $media_id ) {
		if ( ! current_user_can( 'upload_files' ) ) {
			return false;
		}

		if ( ! get_post( $media_id ) ) {
			return true;
		}

		return current_user_can( 'edit_post', $media_id );
	}

	/**
	 * Update media item info API callback.
	 *
	 * @param string $path API path.
	 * @param int    $blog_id Blog ID.
	 * @param int    $media_id Media ID.
	 *
	 * @return object|WP_Error
	 */
	public function callback( $path = '', $blog_id = 0, $media_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! $this->current_user_can_edit_media_item( $media_id ) ) {
			return new WP_Error( 'unauthorized', 'User cannot edit media', 403 );
		}

		$item = $this->get_media_item( $media_id );

		if ( is_wp_error( $item ) ) {
			return new WP_Error( 'unknown_media', 'Unknown Media', 404 );
		}

		$input  = $this->input( true );
		$insert = array();

		if ( ! empty( $input['title'] ) ) {
			$insert['post_title'] = $input['title'];
		}

		if ( ! empty( $input['caption'] ) ) {
			$insert['post_excerpt'] = $input['caption'];
		}

		if ( ! empty( $input['description'] ) ) {
			$insert['post_content'] = $input['description'];
		}

		$insert['ID'] = $media_id;
		wp_update_post( (object) $insert );

		$item = $this->get_media_item( $media_id );
		return $item;
	}
}
