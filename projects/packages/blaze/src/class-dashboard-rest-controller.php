<?php
/**
 * The Blaze Rest Controller class.
 * Registers the REST routes for Blaze Dashboard.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;
use WC_Product;
use WP_Error;
use WP_REST_Server;

/**
 * Registers the REST routes for Blaze Dashboard.
 * It bascially forwards the requests to the WordPress.com REST API.
 */
class Dashboard_REST_Controller {
	/**
	 * Namespace for the REST API.
	 *
	 * @var string
	 */
	public static $namespace = 'jetpack/v4/blaze-app';

	/**
	 * Registers the REST routes for Blaze Dashboard.
	 *
	 * Blaze Dashboard is built from `wp-calypso`, which leverages the `public-api.wordpress.com` API.
	 * The current Site ID is added as part of the route, so that the front end doesn't have to handle the differences.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return;
		}

		// WPCOM API routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/blaze/posts(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_blaze_posts' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Posts routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/sites/%1$d/blaze/posts(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_blaze_posts' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Checkout route
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/checkout', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_wpcom_checkout' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Credits routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/credits(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_credits' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API media query routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/sites/%1$d/media(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_media' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API upload to WP Media Library routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/sites/%1$d/media', $site_id ),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'upload_image_to_current_website' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API media openverse query routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/wpcom/media(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_openverse' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Experiment route
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/experiments(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_experiments' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Campaigns routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/campaigns(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_campaigns' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/campaigns(?P<sub_path>[a-zA-Z0-9-_\/]*)', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_campaigns' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Site Campaigns routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%1$d/wordads/dsp/api/v1/sites/%1$d/campaigns(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_site_campaigns' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Search routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/search(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_search' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Users routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/user(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_user' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Templates routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/templates(?P<sub_path>[a-zA-Z0-9-_\/:]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_templates' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Subscriptions routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/subscriptions(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_subscriptions' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/subscriptions(?P<sub_path>[a-zA-Z0-9-_\/]*)', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_subscriptions' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Payments routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/payments(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_payments' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/payments(?P<sub_path>[a-zA-Z0-9-_\/]*)', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_payments' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Smart routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/smart(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_smart' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/smart(?P<sub_path>[a-zA-Z0-9-_\/]*)', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_smart' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Locations routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/locations(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_locations' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Woo routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/woo(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_woo' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Image routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/image(?P<sub_path>[a-zA-Z0-9-_\/]*)(\?.*)?', $site_id ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_dsp_image' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);

		// WordAds DSP API Logs routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/v1/logs', $site_id ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_dsp_logs' ),
				'permission_callback' => array( $this, 'can_user_view_dsp_callback' ),
			)
		);
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function can_user_view_dsp_callback() {
		if (
			$this->is_user_connected()
			&& current_user_can( 'manage_options' )
		) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Redirect GET requests to WordAds DSP for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_blaze_posts( $req ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		// We don't use sub_path in the blaze posts, only query strings
		if ( isset( $req['sub_path'] ) ) {
			unset( $req['sub_path'] );
		}

		$response = $this->request_as_user(
			sprintf( '/sites/%d/blaze/posts%s', $site_id, $this->build_subpath_with_query_strings( $req->get_params() ) ),
			'v2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( isset( $response['posts'] ) && count( $response['posts'] ) > 0 ) {
			$response['posts'] = $this->add_prices_in_posts( $response['posts'] );
		}

		return $response;
	}

	/**
	 * Builds the subpath including the query string to be used in the DSP call
	 *
	 * @param array $params The request object parameters.
	 * @return string
	 */
	private function build_subpath_with_query_strings( $params ) {
		$sub_path = '';
		if ( isset( $params['sub_path'] ) ) {
			$sub_path = $params['sub_path'];
			unset( $params['sub_path'] );
		}

		if ( isset( $params['rest_route'] ) ) {
			unset( $params['rest_route'] );
		}

		if ( ! empty( $params ) ) {
			$sub_path = $sub_path . '?' . http_build_query( stripslashes_deep( $params ) );
		}

		return $sub_path;
	}

	/**
	 * Redirect GET requests to WordAds DSP Blaze Posts endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_blaze_posts( $req ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		// We don't use sub_path in the blaze posts, only query strings
		if ( isset( $req['sub_path'] ) ) {
			unset( $req['sub_path'] );
		}

		$response = $this->get_dsp_generic( sprintf( 'v1/wpcom/sites/%d/blaze/posts', $site_id ), $req );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( isset( $response['results'] ) && count( $response['results'] ) > 0 ) {
			$response['results'] = $this->add_prices_in_posts( $response['results'] );
		}

		return $response;
	}

	/**
	 * Redirect GET requests to WordAds DSP Blaze media endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_media( $req ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}
		return $this->get_dsp_generic( sprintf( 'v1/wpcom/sites/%d/media', $site_id ), $req );
	}

	/**
	 * Redirect POST requests to WordAds DSP Blaze media endpoint for the site.
	 *
	 * @return array|WP_Error
	 */
	public function upload_image_to_current_website() {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array( 'error' => $site_id->get_error_message() );
		}

		if ( empty( $_FILES['image'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return array( 'error' => 'File is missed' );
		}
		$file      = $_FILES['image']; // phpcs:ignore WordPress.Security.NonceVerification.Missing,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$temp_name = $file['tmp_name'] ?? ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( ! $temp_name || ! is_uploaded_file( $temp_name ) ) {
			return array( 'error' => 'Specified file was not uploaded' );
		}

		// Getting the original file name.
		$filename = sanitize_file_name( basename( $file['name'] ) );
		// Upload contents to the Upload folder locally.
		$upload = wp_upload_bits(
			$filename,
			null,
			file_get_contents( $temp_name ) // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		);

		if ( ! empty( $upload['error'] ) ) {
			return array( 'error' => $upload['error'] );
		}

		// Check the type of file. We'll use this as the 'post_mime_type'.
		$filetype = wp_check_filetype( $filename, null );

		// Prepare an array of post data for the attachment.
		$attachment = array(
			'guid'           => wp_upload_dir()['url'] . '/' . $filename,
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', $filename ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $upload['file'] );

		// Make sure wp_generate_attachment_metadata() has all requirement dependencies.
		require_once ABSPATH . 'wp-admin/includes/image.php';

		// Generate the metadata for the attachment, and update the database record.
		$attach_data = wp_generate_attachment_metadata( $attach_id, $upload['file'] );
		// Store metadata in the local DB.
		wp_update_attachment_metadata( $attach_id, $attach_data );

		return array( 'url' => $upload['url'] );
	}

	/**
	 * Redirect GET requests to WordAds DSP Blaze openverse endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_openverse( $req ) {
		return $this->get_dsp_generic( 'v1/wpcom/media', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Credits endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_credits( $req ) {
		return $this->get_dsp_generic( 'v1/credits', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Experiments endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_experiments( $req ) {
		return $this->get_dsp_generic( 'v1/experiments', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Campaigns endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_campaigns( $req ) {
		return $this->get_dsp_generic( 'v1/campaigns', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Site Campaigns endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_site_campaigns( $req ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		return $this->get_dsp_generic( sprintf( 'v1/sites/%d/campaigns', $site_id ), $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Search endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_search( $req ) {
		return $this->get_dsp_generic( 'v1/search', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP User endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_user( $req ) {
		return $this->get_dsp_generic( 'v1/user', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Search endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_templates( $req ) {
		return $this->get_dsp_generic( 'v1/templates', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Subscriptions endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_subscriptions( $req ) {
		return $this->get_dsp_generic( 'v1/subscriptions', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Payments endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_payments( $req ) {
		return $this->get_dsp_generic( 'v1/payments', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Subscriptions endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_smart( $req ) {
		return $this->get_dsp_generic( 'v1/smart', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Locations endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_locations( $req ) {
		return $this->get_dsp_generic( 'v1/locations', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Woo endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_woo( $req ) {
		return $this->get_dsp_generic( 'v1/woo', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP Countries endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function get_dsp_image( $req ) {
		return $this->get_dsp_generic( 'v1/image', $req );
	}

	/**
	 * Redirect GET requests to WordAds DSP for the site.
	 *
	 * @param String          $path The Root API endpoint.
	 * @param WP_REST_Request $req The request object.
	 * @param array           $args Request arguments.
	 * @return array|WP_Error
	 */
	public function get_dsp_generic( $path, $req, $args = array() ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		return $this->request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/%s%s', $site_id, $path, $this->build_subpath_with_query_strings( $req->get_params() ) ),
			'v2',
			array_merge(
				$args,
				array( 'method' => 'GET' )
			)
		);
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP WPCOM Checkout endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_wpcom_checkout( $req ) {
		return $this->edit_dsp_generic( 'v1/wpcom/checkout', $req, array( 'timeout' => 20 ) );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Campaigns endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_campaigns( $req ) {
		return $this->edit_dsp_generic( 'v1/campaigns', $req, array( 'timeout' => 20 ) );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Subscriptions endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_subscriptions( $req ) {
		return $this->edit_dsp_generic( 'v1/subscriptions', $req, array( 'timeout' => 20 ) );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Payments endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_payments( $req ) {
		return $this->edit_dsp_generic( 'v1/payments', $req, array( 'timeout' => 20 ) );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Logs endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_logs( $req ) {
		return $this->edit_dsp_generic( 'v1/logs', $req );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP Smart endpoint for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function edit_dsp_smart( $req ) {
		return $this->edit_dsp_generic( 'v1/smart', $req );
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP for the site.
	 *
	 * @param String          $path The Root API endpoint.
	 * @param WP_REST_Request $req The request object.
	 * @param array           $args Request arguments.
	 * @return array|WP_Error
	 */
	public function edit_dsp_generic( $path, $req, $args = array() ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}

		return $this->request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/%s%s', $site_id, $path, $req->get_param( 'sub_path' ) ),
			'v2',
			array_merge(
				$args,
				array( 'method' => $req->get_method() )
			),
			$req->get_body()
		);
	}

	/**
	 * Will check the posts for prices and add them to the posts array
	 *
	 * @param WP_REST_Request $posts The posts object.
	 * @return array|WP_Error
	 */
	protected function add_prices_in_posts( $posts ) {

		if ( ! function_exists( 'wc_get_product' ) ||
			! function_exists( 'wc_get_price_decimal_separator' ) ||
			! function_exists( 'wc_get_price_thousand_separator' ) ||
			! function_exists( 'wc_get_price_decimals' ) ||
			! function_exists( 'get_woocommerce_price_format' ) ||
			! function_exists( 'get_woocommerce_currency_symbol' )
		) {
			return $posts;
		}

		foreach ( $posts as $key => $item ) {
			if ( ! isset( $item['ID'] ) ) {
				$posts[ $key ]['price'] = '';
				continue;
			}
			$product = wc_get_product( $item['ID'] );
			if ( ! $product || ! $product instanceof WC_Product ) {
				$posts[ $key ]['price'] = '';
			} else {
				$price              = $product->get_price();
				$decimal_separator  = wc_get_price_decimal_separator();
				$thousand_separator = wc_get_price_thousand_separator();
				$decimals           = wc_get_price_decimals();
				$price_format       = get_woocommerce_price_format();
				$currency_symbol    = get_woocommerce_currency_symbol();

				// Convert to float to avoid issues on PHP 8.
				$price           = (float) $price;
				$negative        = $price < 0;
				$price           = $negative ? $price * -1 : $price;
				$price           = number_format( $price, $decimals, $decimal_separator, $thousand_separator );
				$formatted_price = sprintf( $price_format, $currency_symbol, $price );

				$posts[ $key ]['price'] = html_entity_decode( $formatted_price, ENT_COMPAT );
			}
		}
		return $posts;
	}

	/**
	 * Queries the WordPress.com REST API with a user token.
	 *
	 * @param String $path The API endpoint relative path.
	 * @param String $version The API version.
	 * @param array  $args Request arguments.
	 * @param String $body Request body.
	 * @param String $base_api_path (optional) the API base path override, defaults to 'rest'.
	 * @param bool   $use_cache (optional) default to true.
	 * @return array|WP_Error $response Data.
	 */
	protected function request_as_user( $path, $version = '2', $args = array(), $body = null, $base_api_path = 'wpcom', $use_cache = false ) {
		// Arrays are serialized without considering the order of objects, but it's okay atm.
		$cache_key = 'BLAZE_REST_RESP_' . md5( implode( '|', array( $path, $version, wp_json_encode( $args ), wp_json_encode( $body ), $base_api_path ) ) );

		if ( $use_cache ) {
			$response_body_content = get_transient( $cache_key );
			if ( false !== $response_body_content ) {
				return json_decode( $response_body_content, true );
			}
		}

		$response = Client::wpcom_json_api_request_as_user(
			$path,
			$version,
			$args,
			$body,
			$base_api_path
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code         = wp_remote_retrieve_response_code( $response );
		$response_body_content = wp_remote_retrieve_body( $response );
		$response_body         = json_decode( $response_body_content, true );

		if ( 200 !== $response_code ) {
			return $this->get_wp_error( $response_body, $response_code );
		}

		// Cache the successful JSON response for 5 minutes.
		set_transient( $cache_key, $response_body_content, 5 * MINUTE_IN_SECONDS );
		return $response_body;
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-blaze'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Build error object from remote response body and status code.
	 *
	 * @param array $response_body Remote response body.
	 * @param int   $response_code Http response code.
	 * @return WP_Error
	 */
	protected function get_wp_error( $response_body, $response_code = 500 ) {
		$error_code = 'remote-error';
		foreach ( array( 'code', 'error' ) as $error_code_key ) {
			if ( isset( $response_body[ $error_code_key ] ) ) {
				$error_code = $response_body[ $error_code_key ];
				break;
			}
		}

		$error_message = isset( $response_body['message'] ) ? $response_body['message'] : 'unknown remote error';

		return new WP_Error(
			$error_code,
			$error_message,
			array( 'status' => $response_code )
		);
	}

	/**
	 * Check if the current user is connected.
	 * On WordPress.com Simple, it is always connected.
	 *
	 * @return true
	 */
	private function is_user_connected() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return true;
		}

		$connection = new Connection_Manager();
		return $connection->is_connected() && $connection->is_user_connected();
	}

	/**
	 * Get the site ID.
	 *
	 * @return int|WP_Error
	 */
	private function get_site_id() {
		return Connection_Manager::get_site_id();
	}
}
