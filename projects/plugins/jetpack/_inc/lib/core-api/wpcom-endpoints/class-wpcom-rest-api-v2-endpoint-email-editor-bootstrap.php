<?php
/**
 * Email editor bootstrap endpoint for the WordPress.com REST API.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Email_Editor_Bootstrap
 *
 * Serves the newsletter email design screen its data, and saves the design back.
 *
 * The screen ships in this plugin, but the design it edits lives on the WordPress.com shadow blog,
 * so the record is not in the site's own database on Atomic or self-hosted. Declaring the route here
 * means the browser calls one local `/wpcom/v2/` URL on all three platforms, and this class decides
 * whether that is answered in-process (Simple) or proxied (everywhere else).
 *
 * Nothing about the email engine lives in this plugin: both callbacks apply a filter and return what
 * comes back. WordPress.com implements those filters, exactly as it implements
 * `jetpack_generate_email_preview_html` for the email preview endpoint next door.
 */
class WPCOM_REST_API_V2_Endpoint_Email_Editor_Bootstrap extends WP_REST_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/email-editor-bootstrap';
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the routes for the email editor's data layer.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		// Off Simple the record lives on a database this site cannot reach, so every method proxies.
		// The trait forwards the request's own method, query args and body, so one callback serves
		// both the read and the write.
		$is_simple = ( new Host() )->is_wpcom_simple();

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'show_in_index'       => true,
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => $is_simple
						? array( $this, 'get_bootstrap_data' )
						: array( $this, 'proxy_request_to_wpcom_as_user' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'template_slug' => array(
							'description' => __( 'Slug of the email template to open in the editor.', 'jetpack' ),
							'type'        => 'string',
						),
					),
				),
				array(
					// The editor sends POST and the server has been observed receiving PUT, so this
					// takes the constant covering both rather than betting on either.
					'show_in_index'       => true,
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => $is_simple
						? array( $this, 'save_design' )
						: array( $this, 'proxy_request_to_wpcom_as_user' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'design' => array(
							'description' => __( 'The email design document to store.', 'jetpack' ),
							'type'        => 'object',
							'required'    => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Checks that the user may read and write the site's email design.
	 *
	 * `edit_theme_options` rather than `edit_posts`: this is the same shape of data core's
	 * `WP_REST_Global_Styles_Controller` guards with that capability, and it is what the design
	 * screen itself requires. It also matters more than a read-only route would — building the
	 * bundle creates a global styles scaffold row on WordPress.com the first time it is called for a
	 * blog, so a low bar here would let anyone make WordPress.com write rows on any blog they can name.
	 *
	 * @return true|WP_Error True if the request may proceed, WP_Error otherwise.
	 */
	public function permissions_check() {
		if ( ! ( new Host() )->is_wpcom_simple() && ! ( new Manager() )->is_user_connected() ) {
			// The proxy sends the request as the user with no blog-token fallback, so an unconnected
			// user cannot reach WordPress.com at all. Saying so here beats a round trip that cannot succeed.
			return new WP_Error(
				'rest_unauthorized',
				__( 'Please connect your user account to WordPress.com', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to edit this site&#8217;s email design.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Returns the data the email editor needs to start.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_bootstrap_data( $request ) {
		try {
			/**
			 * Filters the data the newsletter email editor needs to start.
			 *
			 * Returns the editor's settings, its theme, the resolved canvas template, the available
			 * personalization tags and the blog's saved design. Unfiltered on a site with nothing
			 * implementing it, which the endpoint reports as unavailable rather than as an empty design.
			 *
			 * @since $$next-version$$
			 *
			 * @param array|WP_Error|null $data    The editor's bootstrap data. Null until something provides one.
			 * @param WP_REST_Request     $request The REST request.
			 */
			$data = apply_filters( 'jetpack_email_editor_bootstrap', null, $request );
		} catch ( Throwable $e ) {
			return $this->unexpected_error( $e );
		}

		return $this->respond( $data );
	}

	/**
	 * Saves the site's email design.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function save_design( $request ) {
		try {
			/**
			 * Filters the result of saving the newsletter email design.
			 *
			 * The editor sends the whole styles document rather than a patch, so implementations
			 * replace rather than merge. Implementations should report on a read-back of the stored
			 * design rather than echoing the submitted one: sanitizing drops properties outside the
			 * theme.json schema, so a save can succeed into invisibility, and the screen has to be
			 * able to tell a person their edit did not survive.
			 *
			 * @since $$next-version$$
			 *
			 * @param array|WP_Error|null $result  The stored design. Null until something provides one.
			 * @param WP_REST_Request     $request The REST request.
			 */
			$result = apply_filters( 'jetpack_email_editor_save_design', null, $request );
		} catch ( Throwable $e ) {
			return $this->unexpected_error( $e );
		}

		return $this->respond( $result );
	}

	/**
	 * Turns a filtered value into a response.
	 *
	 * An unfiltered `null` means nothing implements the filter on this site — the plugin is running
	 * somewhere its WordPress.com half has not shipped. Reported as unavailable, because returning it
	 * bare would be indistinguishable from a site whose email design is genuinely empty, and this
	 * data layer exists to stop a design silently reading or saving as nothing.
	 *
	 * @param array|WP_Error|null $value The filtered value.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	private function respond( $value ) {
		if ( null === $value ) {
			return new WP_Error(
				'email_editor_unavailable',
				__( 'The email editor is not available on this site.', 'jetpack' ),
				array( 'status' => 501 )
			);
		}

		if ( is_wp_error( $value ) ) {
			return $value;
		}

		return rest_ensure_response( $value );
	}

	/**
	 * Turns a throwing filter into an error response.
	 *
	 * On Simple the filter runs in this process, so an implementation that raises would otherwise
	 * surface as a bare fatal with nothing for the screen to show. Off Simple the request is proxied
	 * and WordPress.com catches its own.
	 *
	 * @param Throwable $e The exception raised while filtering.
	 *
	 * @return WP_Error
	 */
	private function unexpected_error( $e ) {
		$data = array( 'status' => 500 );

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			// Without this the raise is invisible: the message is the only thing separating a bug in
			// the implementation from an outage. Debug builds only, since it can carry internals.
			$data['exception'] = $e->getMessage();
		}

		return new WP_Error(
			'email_editor_failed',
			__( 'The email editor could not be reached. Please try again.', 'jetpack' ),
			$data
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Email_Editor_Bootstrap' );
