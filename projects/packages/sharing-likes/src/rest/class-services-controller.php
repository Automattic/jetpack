<?php
/**
 * The sharing services routes behind Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use Automattic\Jetpack\Sharing_Likes\Settings\Section_State;
use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Options;
use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Which services show, in which order, and the site's custom services.
 *
 * Available only where the screen shows the services list, which is also where
 * sharedaddy is loaded to do the saving.
 */
final class Services_Controller extends Controller {

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		$base    = '/' . Endpoints::BASE . '/services';
		$details = array(
			'name' => array(
				'description' => __( 'Service name.', 'jetpack-sharing-likes' ),
				'type'        => 'string',
			),
			'url'  => array(
				'description' => __( 'Sharing URL, with placeholders for the post being shared.', 'jetpack-sharing-likes' ),
				'type'        => 'string',
			),
			'icon' => array(
				'description' => __( 'URL of a 16×16 icon.', 'jetpack-sharing-likes' ),
				'type'        => 'string',
			),
		);

		register_rest_route(
			$this->namespace,
			$base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_enabled' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'visible' => array(
							'description' => __( 'Services shown as buttons, in order.', 'jetpack-sharing-likes' ),
							'type'        => 'array',
							'items'       => array( 'type' => 'string' ),
							'required'    => true,
						),
						'hidden'  => array(
							'description' => __( 'Services behind the "More" button, in order.', 'jetpack-sharing-likes' ),
							'type'        => 'array',
							'items'       => array( 'type' => 'string' ),
							'required'    => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$base . '/custom',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_item' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array_map(
					function ( $arg ) {
						return $arg + array( 'required' => true );
					},
					$details
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$base . '/custom/(?P<id>custom-\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => $details,
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
			)
		);
	}

	/**
	 * The enabled services, and every service the site can enable.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		unset( $request );

		$unavailable = self::unavailable();
		if ( $unavailable ) {
			return $unavailable;
		}

		$sharer  = new \Sharing_Service();
		$enabled = $sharer->get_blog_services();

		return rest_ensure_response(
			array(
				'visible'  => array_keys( $enabled['visible'] ),
				'hidden'   => array_keys( $enabled['hidden'] ),
				'services' => array_values( array_map( array( __CLASS__, 'prepare_service' ), $sharer->get_all_services_blog() ) ),
			)
		);
	}

	/**
	 * Save which services show, and in which order.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_enabled( $request ) {
		$unavailable = self::unavailable();
		if ( $unavailable ) {
			return $unavailable;
		}

		( new \Sharing_Service() )->set_blog_services( $request->get_param( 'visible' ), $request->get_param( 'hidden' ) );

		return $this->get_items( $request );
	}

	/**
	 * Create a custom service. It is not enabled until the enabled services are saved with it.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		$unavailable = self::unavailable();
		if ( $unavailable ) {
			return $unavailable;
		}

		$service = ( new \Sharing_Service() )->new_service(
			$request->get_param( 'name' ),
			$request->get_param( 'url' ),
			$request->get_param( 'icon' )
		);

		if ( ! $service ) {
			return new WP_Error(
				'rest_sharing_likes_invalid_service',
				__( 'A custom service needs a name, a sharing URL and an icon URL.', 'jetpack-sharing-likes' ),
				array( 'status' => 400 )
			);
		}

		return new WP_REST_Response( self::prepare_service( $service ), 201 );
	}

	/**
	 * Change a custom service, keeping whatever the request leaves out.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$service = self::custom_service( $request->get_param( 'id' ) );
		if ( $service instanceof WP_Error ) {
			return $service;
		}

		$options = $service->get_options();

		foreach ( array( 'name', 'url', 'icon' ) as $key ) {
			if ( $request->has_param( $key ) ) {
				$options[ $key ] = $request->get_param( $key );
			}
		}

		// `update_options()` unslashes the name, as it was written for `$_POST`.
		$options['name'] = wp_slash( $options['name'] );

		$service->update_options( $options );
		( new \Sharing_Service() )->set_service( $service->get_id(), $service );

		return rest_ensure_response( self::prepare_service( $service ) );
	}

	/**
	 * Delete a custom service.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		$service = self::custom_service( $request->get_param( 'id' ) );
		if ( $service instanceof WP_Error ) {
			return $service;
		}

		( new \Sharing_Service() )->delete_service( $service->get_id() );

		return rest_ensure_response(
			array(
				'deleted' => true,
				'id'      => $service->get_id(),
			)
		);
	}

	/**
	 * An error unless the screen shows the services list.
	 */
	private static function unavailable(): ?WP_Error {
		if ( Sharing_Options::is_available() && Section_State::configures( Sharing_Section::state() ) ) {
			return null;
		}

		return new WP_Error(
			'rest_sharing_likes_services_unavailable',
			__( 'Sharing buttons are not available on this site right now.', 'jetpack-sharing-likes' ),
			array( 'status' => 409 )
		);
	}

	/**
	 * A custom service by ID, or the error to answer with.
	 *
	 * @param string $id Service ID.
	 * @return \Sharing_Advanced_Source|WP_Error
	 */
	private static function custom_service( string $id ) {
		$unavailable = self::unavailable();
		if ( $unavailable ) {
			return $unavailable;
		}

		$services = ( new \Sharing_Service() )->get_all_services_blog();

		if ( isset( $services[ $id ] ) && $services[ $id ] instanceof \Sharing_Advanced_Source ) {
			return $services[ $id ];
		}

		return new WP_Error(
			'rest_sharing_likes_service_not_found',
			__( 'No custom service with that ID.', 'jetpack-sharing-likes' ),
			array( 'status' => 404 )
		);
	}

	/**
	 * A service as the screen lists it.
	 *
	 * @param \Sharing_Source $service Service.
	 * @return array<string, mixed>
	 */
	private static function prepare_service( $service ): array {
		$item = array(
			'id'         => $service->get_id(),
			'name'       => $service->get_name(),
			'custom'     => $service instanceof \Sharing_Advanced_Source,
			'deprecated' => $service->is_deprecated(),
		);

		if ( $service instanceof \Sharing_Advanced_Source ) {
			$options      = $service->get_options();
			$item['url']  = (string) ( $options['url'] ?? '' );
			$item['icon'] = (string) ( $options['icon'] ?? '' );
		}

		return $item;
	}
}
