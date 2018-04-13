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
	 * Constructor for Jetpack_Publicize_Gutenberg
	 *
	 * Set up hooks to extend legacy Publicize behavior.
	 *
	 * @since 5.9.1
	 */
	public function __construct() {
		// Do edit page specific setup.
		add_action( 'admin_enqueue_scripts', array( $this, 'post_page_enqueue' ) );

		add_action( 'rest_api_init', array( $this, 'add_wpas_post_fields' ) );

	}

	/**
	 * Add rest fields to 'post' for Publicize support
	 *
	 * To port over from classic editor's Publicize form, this explicitly
	 * sets up 'wpas' and 'wpas_title' fields in `post` REST endpoint.
	 * This is not strictly necessary since these values are read directly
	 * from $_POST in {@see ./publicize.php}, but registering the fields here
	 * provides validation and explicitly documents the schema.
	 *
	 * @since 5.9.1
	 */
	public function add_wpas_post_fields() {
		// Schema for 'wpas_title' field.
		$wpas_title_schema = array(
			'description' => esc_html__( 'Title of post when shared', 'jetpack' ),
			'type'        => 'string',
			'context'     => array( 'edit' ),
		);

		// Schema for wpas.submit[] field.
		$wpas_submit_schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => esc_html__( 'Form data for list of connections that should be shared', 'jetpack' ),
			'type'       => 'object',
			'properties' => array(
				'connection' => array(
					'description' => esc_html__( 'Unique identifier string for a connection', 'jetpack' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
				),
			),
		);

		// Registering the title field.
		register_rest_field(
			'post',
			'wpas_title',
			array(
				'get_callback'    => null,
				'update_callback' => null, // No update callback. Value is read direct from $_POST in {@see ./publicize.php}.
				'schema'          => $wpas_title_schema,
			)
		);

		// Registering the wpas field that contains connections.
		register_rest_field(
			'post',
			'wpas',
			array(
				'get_callback'    => null,
				'update_callback' => null, // No update callback. Value is read direct from $_POST in {@see ./publicize.php}.
				'schema'          => $wpas_submit_schema,
			)
		);
	}



	/**
	 * Enqueue scripts when they are needed for the edit page
	 *
	 * Enqueues necessary scripts for edit page for Gutenberg
	 * editor only.
	 *
	 * @since 5.9.1
	 *
	 * @global Publicize_UI $publicize_ui UI handler for instance for Publicize.
	 *
	 * @param string $hook Current page url.
	 */
	public function post_page_enqueue( $hook ) {
		global $publicize_ui;

		if ( ( 'post-new.php' === $hook || 'post.php' === $hook ) && ! isset( $_GET['classic-editor'] ) ) { // Input var okay.
			if ( is_rtl() ) {
				wp_enqueue_style( 'publicize', plugins_url( 'assets/rtl/publicize-rtl.css', __FILE__ ), array(), '20120925' );
			} else {
				wp_enqueue_style( 'publicize', plugins_url( 'assets/publicize.css', __FILE__ ), array(), '20120925' );
			}

			wp_enqueue_script(
				'modules-publicize-gutenberg_js',
				plugins_url( '_inc/build/modules-publicize-gutenberg.js', JETPACK__PLUGIN_FILE ),
				array(
					'jquery',
					'wp-edit-post',
				),
				false,
				true
			);

			wp_localize_script( 'modules-publicize-gutenberg_js', 'gutenberg_publicize_setup',
				array(
					'connectionList' => wp_json_encode( $publicize_ui->get_filtered_connection_data() ),
					'allServices'    => wp_json_encode( $publicize_ui->get_available_service_data() ),
				)
			);

		}
	}
}
