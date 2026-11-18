<?php
/**
 * REST routes of the announcements.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Serves the announcements the current user may see.
 *
 * The routes give a core-data entity what it needs: a collection of records that carry
 * their key, and an item route.
 */
class REST_Controller extends WP_REST_Controller {

	/**
	 * Sets the route names. `wpcom/v2` reaches connected sites and WordPress.com Simple.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'jetpack-announcements';
	}

	/**
	 * Registers the routes. Hooked on `rest_api_init`.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		( new self() )->register_routes();
	}

	/**
	 * Registers the collection route and the item route.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- register_rest_route() mixes the endpoint list with a route-level `schema` key.
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>' . Announcement_Registry::ID_PATTERN . ')',
			array(
				array(
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- register_rest_route() mixes the endpoint list with a route-level `schema` key.
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Requires a logged-in user. What each user may see is decided per announcement.
	 *
	 * @return true|WP_Error
	 */
	public function permissions_check() {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_not_logged_in',
				__( 'You are not currently logged in.', 'jetpack-announcements' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}

	/**
	 * Retrieves the announcements the current user may see, of every channel.
	 *
	 * @param WP_REST_Request $request Unused.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		unset( $request );

		$records = array();

		foreach ( Announcement_Registry::get_instance()->get_all_registered() as $announcement ) {
			if ( self::is_visible( $announcement ) ) {
				$records[] = self::to_record( $announcement );
			}
		}

		return rest_ensure_response( $records );
	}

	/**
	 * Retrieves one announcement.
	 *
	 * @param WP_REST_Request $request Request carrying the id.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		$announcement = self::get_visible_announcement( $request );
		if ( is_wp_error( $announcement ) ) {
			return $announcement;
		}

		return rest_ensure_response( self::to_record( $announcement ) );
	}

	/**
	 * Retrieves the schema of an announcement record.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-announcement',
			'type'       => 'object',
			'properties' => array(
				'id'       => array(
					'description' => __( 'Namespaced identifier of the announcement.', 'jetpack-announcements' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'date'     => array(
					'description' => __( 'The date the announcement was published, as GMT.', 'jetpack-announcements' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'readonly'    => true,
				),
				'title'    => array(
					'description' => __( 'The title of the announcement, as plain text.', 'jetpack-announcements' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'excerpt'  => array(
					'description' => __( 'A summary of the announcement, as plain text.', 'jetpack-announcements' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'content'  => array(
					'description' => __( 'The body of the announcement, as HTML.', 'jetpack-announcements' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'media'    => array(
					'description' => __( 'An image or a video shown with the announcement.', 'jetpack-announcements' ),
					'type'        => array( 'object', 'null' ),
					'readonly'    => true,
					'properties'  => array(
						'type' => array(
							'type' => 'string',
							'enum' => Announcement_Registry::MEDIA_TYPES,
						),
						'url'  => array(
							'type'   => 'string',
							'format' => 'uri',
						),
						'alt'  => array(
							'type' => 'string',
						),
					),
				),
				'link'     => array(
					'description' => __( 'URL of the full article, or an empty string.', 'jetpack-announcements' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'channels' => array(
					'description' => __( 'The channels the announcement is published to.', 'jetpack-announcements' ),
					'type'        => 'array',
					'items'       => array( 'type' => 'string' ),
					'readonly'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the announcement a request names, if the current user may see it.
	 *
	 * @param WP_REST_Request $request Request carrying the id.
	 * @return array|WP_Error The announcement, or a 404 error.
	 */
	private static function get_visible_announcement( $request ) {
		// Read from the URL alone: a query parameter of the same name would win.
		$id           = $request->get_url_params()['id'] ?? '';
		$announcement = Announcement_Registry::get_instance()->get_registered( $id );

		if ( null === $announcement || ! self::is_visible( $announcement ) ) {
			return new WP_Error(
				'rest_announcement_not_found',
				__( 'Announcement not found.', 'jetpack-announcements' ),
				array( 'status' => 404 )
			);
		}

		return $announcement;
	}

	/**
	 * Whether the current user may see an announcement.
	 *
	 * @param array $announcement A registered announcement.
	 * @return bool
	 */
	private static function is_visible( array $announcement ) {
		return '' === $announcement['capability'] || current_user_can( $announcement['capability'] );
	}

	/**
	 * Builds the record a client receives: the announcement minus its capability.
	 *
	 * @param array $announcement A registered announcement.
	 * @return array
	 */
	private static function to_record( array $announcement ) {
		unset( $announcement['capability'] );

		return $announcement;
	}
}
