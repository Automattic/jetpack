<?php
/**
 * Does setup for Publicize in Gutenberg
 *
 * Enqueues UI resources and completes REST setup for enabling
 * Publicize in Gutenberg.
 *
 * @package Jetpack
 * @subpackage Publicize
 * @since 5.9.1
 */

/**
 * Class to set up Gutenberg editor support.
 *
 * @since 5.9.1
 */
class Jetpack_Publicize_Gutenberg {

	/**
	 * Instance of Publicize used to access data gathering utility methods.
	 *
	 * @since 5.9.1
	 * @var Publicize $publicize Instance of Jetpack Publicize class.
	 */
	private $publicize;

	/**
	 * Constructor for Jetpack_Publicize_Gutenberg
	 *
	 * Set up hooks to extend legacy Publicize behavior.
	 *
	 * @since 5.9.1
	 */
	public function __construct( $publicize ) {
		// Do edit page specific setup.
		add_action( 'admin_enqueue_scripts', array( $this, 'post_page_enqueue' ) );

		add_action( 'rest_api_init', array( $this, 'add_publicize_rest_fields' ) );

		// Set up publicize flags right before post is actually published.
		add_filter( 'rest_pre_insert_post', array( $this, 'process_publicize_from_rest' ), 10, 2 );

		$this->publicize = $publicize;
	}

	/**
	 * Retrieve current list of connected social accounts.
	 *
	 * Gets current list of connected accounts and send them as
	 * JSON encoded data.
	 *
	 * @see Publicize::get_filtered_connection_data()
	 *
	 * @since 5.9.1
	 *
	 * @param WP_REST_Request $request Request instance from REST call.
	 *
	 * @return string JSON encoded connection list data.
	 */
	public function rest_get_publicize_connections( $request ) {
		$post_id = $request['post_id'];
		return wp_json_encode( $this->publicize->get_filtered_connection_data( $post_id ) );
	}

	/**
	 * Add rest field to 'post' for Publicize support
	 *
	 * Sets up 'publicize' schema to submit publicize sharing title
	 * and individual connection sharing enables/disables. This schema
	 * is registered with the 'post' endpoint REST endpoint so publicize
	 * options can be saved when a post is published.
	 *
	 * @since 5.9.1
	 */
	public function add_publicize_rest_fields() {
		// Schema for wpas.submit[] field.
		$publicize_submit_schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => esc_html__( 'Publicize data for publishing post', 'jetpack' ),
			'type'       => 'object',
			'properties' => array(
				'connections' => array(
					'description' => esc_html__( 'List of connections to be shared to (or not).', 'jetpack' ),
					'type'        => 'array',
					'items'       => array(
						'type'       => 'object',
						'properties' => array(
							'unique_id'    => array(
								'description' => esc_html__( 'Unique identifier string for a connection', 'jetpack' ),
								'type'        => 'string',
							),
							'should_share' => array(
								'description' => esc_html__( 'Whether or not connection should be shared to.', 'jetpack' ),
								'type'        => 'boolean',
							),

						),
					),
				),
				'title'       => array(
					'description' => esc_html__( 'Optional title to share post with.', 'jetpack' ),
					'type'        => 'string',
				),
			),
		);

		// Registering the publicize field with post endpoint.
		register_rest_field(
			'post',
			'publicize',
			array(
				'get_callback'    => null,
				'update_callback' => null, // Data read/processed before publishing post by 'rest_pre_insert_post' filter.
				'schema'          => $publicize_submit_schema,
			)
		);

		/**
		 * REST endpoint to get connection list data for current user and post id.
		 *
		 * @see Publicize::get_filtered_connection_data()
		 *
		 * @since 5.9.1
		 */
		register_rest_route( 'publicize/', '/posts/(?P<post_id>\d+)/connections', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'rest_get_publicize_connections' ),
			'post_id'             => array(
				'validate_post_id' => array( $this, 'rest_connections_validate_post_id' ),
			),
			'permission_callback' => array( $this, 'rest_connections_permission_callback' ),
		) );
	}

	/**
	 * Check user capability for getting Publicize connection list from endpoint.
	 *
	 * @since 5.9.1
	 *
	 * @return boolean True if current user has 'publish_post' capability.
	 */
	public function rest_connections_permission_callback() {
		return current_user_can( 'publish_posts' );
	}

	/**
	 * Check post id validity for Publicize connection list REST endpoint.
	 *
	 * @since 5.9.1
	 *
	 * @param mixed $param post_id parameter from REST call.
	 *
	 * @return boolean True if post_id is valid integer
	 */
	public function rest_connections_validate_post_id( $param ) {
		return is_int( $param );
	}

	/**
	 * Set up Publicize meta fields for publishing post.
	 *
	 * Process 'publicize' REST field to setup Publicize for publishing
	 * post. Sets post meta keys to enable/disable each connection for
	 * the post and sets publicize title meta key if a title message
	 * is provided.
	 *
	 * @since 5.9.1
	 *
	 * @param stdClass        $new_post_obj Updated post object about to be inserted view REST endpoint.
	 * @param WP_REST_Request $request      Request object, possibly containing 'publicize' field {@see add_publicize_rest_fields()}.
	 *
	 * @return WP_Post Returns the original $new_post value unchanged.
	 */
	public function process_publicize_from_rest( $new_post_obj, $request ) {
		global $publicize;
		if ( property_exists( $new_post_obj, 'ID' ) ) {
			$post = get_post( $new_post_obj->ID );
		} else {
			return $new_post_obj;
		}

		// If 'publicize' field has been set from editor and post is about to be published.
		if ( isset( $request['publicize'] )
				&& ( property_exists( $new_post_obj, 'post_status' ) && ( 'publish' === $new_post_obj->post_status ) )
				&& ( 'publish' !== $post->post_status ) ) {

			$publicize_field = $request['publicize'];

			if ( empty( $publicize_field['title'] ) ) {
				delete_post_meta( $post->ID, $publicize->POST_MESS );
			} else {
				update_post_meta( $post->ID, $publicize->POST_MESS, trim( stripslashes( $publicize_field['title'] ) ) );
			}
			if ( isset( $publicize_field['connections'] ) ) {
				foreach ( (array) $publicize->get_services( 'connected' ) as $service_name => $connections ) {
					foreach ( $connections as $connection ) {
						if ( ! empty( $connection->unique_id ) ) {
							$unique_id = $connection->unique_id;
						} elseif ( ! empty( $connection['connection_data']['token_id'] ) ) {
							$unique_id = $connection['connection_data']['token_id'];
						}

						if ( $this->connection_should_share( $publicize_field['connections'], $unique_id ) ) {
							// Delete skip flag meta key.
							delete_post_meta( $post->ID, $publicize->POST_SKIP . $unique_id );
						} else {
							// Flag connection to be skipped for this post.
							update_post_meta( $post->ID, $publicize->POST_SKIP . $unique_id, 1 );
						}
					}
				}
			}
		}
		// Just pass post object through.
		return $new_post_obj;
	}

	/**
	 * Checks if a connection should be shared to.
	 *
	 * Checks $connection_id against $connections_array to see if the connection associated
	 * with $connection_id should be shared to. Will return true if $connection_id is in the
	 * array and 'should_share' property is set to true, and will default to false otherwise.
	 *
	 * @since 5.9.1
	 *
	 * @param array  $connections_array 'connections' from 'publicize' REST field {@see add_publicize_rest_fields()}.
	 * @param string $connection_id     Connection identifier string that is unique for each connection.
	 * @return boolean True if connection should be shared to, false otherwise.
	 */
	private function connection_should_share( $connections_array, $connection_id ) {
		foreach ( $connections_array as $connection ) {
			if ( isset( $connection['unique_id'] )
				&& ( $connection['unique_id'] === $connection_id )
				&& $connection['should_share'] ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Enqueue scripts when they are needed for the edit page
	 *
	 * Enqueues necessary scripts for edit page for Gutenberg
	 * editor only.
	 *
	 * @since 5.9.1
	 *
	 * @param string $hook Current page url.
	 */
	public function post_page_enqueue( $hook ) {
		if ( ( 'post-new.php' === $hook || 'post.php' === $hook ) && ! isset( $_GET['classic-editor'] ) ) { // Input var okay.
			wp_enqueue_style( 'social-logos', null, array( 'genericons' ) );

			if ( is_rtl() ) {
				wp_enqueue_style(
					'publicize',
					plugins_url( 'assets/rtl/publicize-rtl.css', __FILE__ ),
					array( 'dashicons' ),
					'20120925'
				);
			} else {
				wp_enqueue_style(
					'publicize',
					plugins_url( 'assets/publicize.css', __FILE__ ),
					array( 'dashicons' ),
					'20120925'
				);
			}

			wp_enqueue_script(
				'modules-publicize-gutenberg_js',
				plugins_url( 'assets/block.js', __FILE__ ),
				array(
					'jquery',
					'wp-edit-post',
					'wp-data',
					'wp-components',
				),
				false,
				true
			);

			wp_localize_script( 'modules-publicize-gutenberg_js', 'gutenberg_publicize_setup',
				array(
					'staticConnectionList' => wp_json_encode( $this->publicize->get_filtered_connection_data() ),
					'allServices'          => wp_json_encode( $this->publicize->get_available_service_data() ),
					'api_nonce'            => wp_create_nonce( 'wp_rest' ),
				)
			);

		}
	}
}
