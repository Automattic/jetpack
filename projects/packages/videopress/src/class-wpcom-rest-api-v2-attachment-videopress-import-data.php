<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Extend the /wp/v2/media REST responses with Studio import draft data.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Post;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Add per-attachment Studio import data for draft placeholders.
 *
 * { # Attachment Object
 *   ...
 *   jetpack_videopress_import: (object) imported metadata + lifecycle status
 *   ...
 * }
 *
 * Follows the WPCOM_REST_API_V2_Attachment_VideoPress_Data pattern: the field
 * is registered on every attachment, then stripped from responses whose
 * attachment is not an import draft placeholder (post_mime_type
 * video/videopress-draft — see Import_Rest_Controller for how placeholders
 * are created and why that mime type). Registration is re-checked against the
 * Studio flag at REST time via should_register(): placeholders can only be
 * created behind that flag, so with it off the field would never carry data.
 *
 * The exposed shape is the `_videopress_import` meta blob with one
 * server-side resolution applied: `thumbnail_url` prefers the sideloaded
 * local copy (when the import managed to download one) over the remote
 * source URL stored in the blob, so clients get a single ready-to-render
 * URL. `thumbnail_attachment_id` is still included for the completion flow,
 * which applies the stored thumbnail as the real video's poster.
 *
 * @phan-constructor-used-for-side-effects
 */
class WPCOM_REST_API_V2_Attachment_VideoPress_Import_Data {
	/**
	 * The REST Object Type to which the jetpack_videopress_import field will be added.
	 *
	 * @var string
	 */
	protected $object_type = 'attachment';

	/**
	 * The name of the REST API field to add.
	 *
	 * @var string $field_name
	 */
	protected $field_name = 'jetpack_videopress_import';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_fields' ) );

		// do this again later to collect any CPTs that get registered later.
		add_action( 'restapi_theme_init', array( $this, 'register_fields' ), 20 );
	}

	/**
	 * Whether the field should register at all.
	 *
	 * Mirrors Import_Rest_Controller::should_register() — the field only
	 * describes placeholders that controller creates, behind the same flag.
	 *
	 * @return bool
	 */
	public static function should_register() {
		return Admin_UI::is_studio_enabled();
	}

	/**
	 * Registers the jetpack_videopress_import field and adds a filter to
	 * remove it for attachments that are not import draft placeholders.
	 */
	public function register_fields() {
		if ( ! self::should_register() ) {
			return;
		}

		global $wp_rest_additional_fields;

		if ( ! empty( $wp_rest_additional_fields[ $this->object_type ][ $this->field_name ] ) ) {
			return;
		}

		register_rest_field(
			$this->object_type,
			$this->field_name,
			array(
				'get_callback'    => array( $this, 'get' ),
				'update_callback' => null,
				'schema'          => $this->get_schema(),
			)
		);

		add_filter( 'rest_prepare_attachment', array( $this, 'remove_field_for_non_drafts' ), 10, 2 );
	}

	/**
	 * Defines data structure and what elements are visible in which contexts.
	 *
	 * @return array
	 */
	public function get_schema() {
		return array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => $this->field_name,
			'type'        => 'object',
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
			'description' => __( 'Metadata imported from an external video service, present on draft placeholders awaiting their media file', 'jetpack-videopress-pkg' ),
		);
	}

	/**
	 * Getter: Retrieve the import data for a given attachment.
	 *
	 * @param array           $attachment Response from the attachment endpoint.
	 * @param WP_REST_Request $request Request to the attachment endpoint.
	 *
	 * @return array
	 */
	public function get( $attachment, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! isset( $attachment['id'] ) ) {
			return array();
		}

		return $this->get_import_data( (int) $attachment['id'] );
	}

	/**
	 * Build the exposed import data for an attachment from its meta.
	 *
	 * This is pulled out into a separate method to support unit test mocking.
	 *
	 * @param int $attachment_id Attachment ID.
	 *
	 * @return array Empty when the attachment carries no import meta.
	 */
	public function get_import_data( $attachment_id ) {
		$import = get_post_meta( $attachment_id, Import_Rest_Controller::META_IMPORT, true );
		if ( ! is_array( $import ) || array() === $import ) {
			return array();
		}

		$thumbnail_attachment_id = isset( $import['thumbnail_attachment_id'] ) ? (int) $import['thumbnail_attachment_id'] : 0;

		/*
		 * Prefer the sideloaded local copy: the remote URL is a fallback the
		 * import kept when the download failed, and it may be blocked by the
		 * source's hotlinking rules. 'large' caps what the library grid loads;
		 * WordPress falls back to the full size when no resize exists.
		 */
		$thumbnail_url = '';
		if ( $thumbnail_attachment_id ) {
			$local_url = wp_get_attachment_image_url( $thumbnail_attachment_id, 'large' );
			if ( $local_url ) {
				$thumbnail_url = $local_url;
			}
		}
		if ( '' === $thumbnail_url && isset( $import['thumbnail_url'] ) ) {
			$thumbnail_url = (string) $import['thumbnail_url'];
		}

		return array(
			'source'                  => isset( $import['source'] ) ? (string) $import['source'] : '',
			'external_id'             => isset( $import['external_id'] ) ? (string) $import['external_id'] : '',
			'title'                   => isset( $import['title'] ) ? (string) $import['title'] : '',
			'description'             => isset( $import['description'] ) ? (string) $import['description'] : '',
			'tags'                    => isset( $import['tags'] ) ? array_map( 'strval', (array) $import['tags'] ) : array(),
			'duration_seconds'        => isset( $import['duration_seconds'] ) ? (int) $import['duration_seconds'] : 0,
			'privacy'                 => isset( $import['privacy'] ) ? (string) $import['privacy'] : '',
			'published_at'            => isset( $import['published_at'] ) ? (string) $import['published_at'] : '',
			'thumbnail_url'           => $thumbnail_url,
			'thumbnail_attachment_id' => $thumbnail_attachment_id,
			'status'                  => (string) get_post_meta( $attachment_id, Import_Rest_Controller::META_IMPORT_STATUS, true ),
		);
	}

	/**
	 * Checks if the given attachment is an import draft placeholder.
	 *
	 * @param object $attachment The attachment object.
	 *
	 * @return bool
	 */
	public function is_draft_placeholder( $attachment ) {
		return isset( $attachment->post_mime_type )
			&& Import_Rest_Controller::DRAFT_MIME_TYPE === $attachment->post_mime_type;
	}

	/**
	 * Removes the jetpack_videopress_import field from the response if the
	 * given attachment is not an import draft placeholder.
	 *
	 * @param WP_REST_Response $response Response from the attachment endpoint.
	 * @param WP_Post          $attachment The original attachment object.
	 *
	 * @return mixed
	 */
	public function remove_field_for_non_drafts( $response, $attachment ) {
		if ( ! $this->is_draft_placeholder( $attachment ) ) {
			unset( $response->data[ $this->field_name ] );
		}

		return $response;
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\VideoPress\WPCOM_REST_API_V2_Attachment_VideoPress_Import_Data' );
}
