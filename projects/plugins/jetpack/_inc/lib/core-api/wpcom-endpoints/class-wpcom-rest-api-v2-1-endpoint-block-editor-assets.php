<?php
/**
 * Retrieve resources (styles and scripts) loaded by the block editor.
 *
 * This v2.1 endpoint wraps Gutenberg's /wp-block-editor/v1/assets endpoint
 * while adding Jetpack-specific enhancements:
 * - Problematic plugin hook removal (e.g., wpforms-lite)
 * - Absolute URL conversion for all asset URLs
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Core class used to retrieve the block editor assets via the REST API v2.1.
 *
 * This endpoint wraps Gutenberg's experimental /wp-block-editor/v1/assets endpoint,
 * returning structured JSON with asset metadata while applying Jetpack-specific
 * preprocessing (problematic plugin handling) and postprocessing (absolute URLs).
 */
class WPCOM_REST_API_V2_1_Endpoint_Block_Editor_Assets extends WP_REST_Controller {

	/**
	 * Cache buster version for the endpoint.
	 *
	 * @var string
	 */
	const CACHE_BUSTER = '2025-12-10';

	/**
	 * List of problematic plugins that cause errors in REST contexts.
	 *
	 * These plugins hook into enqueue_block_editor_assets but call is_admin()-dependent
	 * code that was never loaded because is_admin() returns false in REST API contexts.
	 *
	 * @var array
	 */
	const PROBLEMATIC_PLUGINS = array(
		'wpforms-lite/wpforms.php',
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2.1';
		$this->rest_base = 'editor-assets';
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the controller routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Retrieves a collection of items.
	 *
	 * This method wraps Gutenberg's /wp-block-editor/v1/assets endpoint,
	 * applying Jetpack-specific preprocessing and postprocessing.
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		// 1. Check if Gutenberg endpoint is available
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			return new WP_Error(
				'gutenberg_endpoint_unavailable',
				__( 'The Gutenberg assets endpoint is not available. Please ensure the Gutenberg plugin is installed and activated.', 'jetpack' ),
				array( 'status' => 501 )
			);
		}

		// 2. Setup block editor screen context to prevent errors when
		// plugins/themes call get_current_screen() during asset enqueueing
		$this->setup_block_editor_screen();

		// 3. Remove problematic plugin hooks BEFORE Gutenberg triggers enqueue_block_editor_assets
		$this->remove_problematic_plugin_hooks();

		// 4. Create Gutenberg controller and get assets
		$gutenberg_controller = new WP_REST_Block_Editor_Settings_Controller();
		$gutenberg_response   = $gutenberg_controller->get_assets( $request );

		// 5. Handle Gutenberg errors
		if ( is_wp_error( $gutenberg_response ) ) {
			return $gutenberg_response;
		}

		$data = $gutenberg_response->get_data();

		// 6. Convert URLs to absolute
		$data = $this->convert_urls_to_absolute( $data );

		return rest_ensure_response( $data );
	}

	/**
	 * Sets up a mock block editor screen context for the REST API request.
	 *
	 * This ensures get_current_screen() is available and returns a proper
	 * block editor screen object, preventing fatal errors when plugins/themes
	 * call get_current_screen() during the enqueue_block_editor_assets action.
	 */
	private function setup_block_editor_screen() {
		// Ensure screen class and functions are available
		if ( ! class_exists( 'WP_Screen' ) ) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		}
		if ( ! function_exists( 'get_current_screen' ) ) {
			require_once ABSPATH . 'wp-admin/includes/screen.php';
		}

		// Determine the post type for the screen context
		$post_type = get_query_var( 'post_type', 'post' );
		if ( is_array( $post_type ) ) {
			$post_type = $post_type[0];
		}

		// Validate that the post type is registered
		if ( ! post_type_exists( $post_type ) ) {
			$post_type = 'post';
		}

		// Create a post editor screen context
		set_current_screen( 'post' );

		// Update the screen to indicate it's using the block editor
		$current_screen = get_current_screen();
		if ( $current_screen ) {
			$current_screen->is_block_editor( true );
			$current_screen->post_type = $post_type;
		}
	}

	/**
	 * Removes hooks from problematic plugins that cause errors in this endpoint.
	 *
	 * Some plugins conditionally load admin-only code based on is_admin(), which
	 * returns false in REST API contexts. When these plugins hook into
	 * enqueue_block_editor_assets without checking the context, they may call
	 * undefined functions that were never loaded, causing fatal errors.
	 *
	 * This method preemptively removes hooks from known problematic plugins before
	 * the enqueue_block_editor_assets action fires, preventing fatal errors.
	 */
	private function remove_problematic_plugin_hooks() {
		global $wp_filter;

		// Only target the enqueue_block_editor_assets hook
		if ( ! isset( $wp_filter['enqueue_block_editor_assets'] ) ) {
			return;
		}

		// Early return if no problematic plugins are active
		$has_active_problematic_plugin = false;
		foreach ( self::PROBLEMATIC_PLUGINS as $plugin_file ) {
			if ( is_plugin_active( $plugin_file ) ) {
				$has_active_problematic_plugin = true;
				break;
			}
		}

		if ( ! $has_active_problematic_plugin ) {
			return;
		}

		$plugin_slugs = array_map(
			function ( $plugin_file ) {
				return dirname( $plugin_file );
			},
			self::PROBLEMATIC_PLUGINS
		);

		// Collect callbacks to remove (improves performance by separating detection from removal)
		$callbacks_to_remove = array();

		foreach ( $wp_filter['enqueue_block_editor_assets']->callbacks as $priority => $callbacks ) {
			foreach ( $callbacks as $callback_data ) {
				$callback  = $callback_data['function'];
				$file_path = null;

				// Handle object method callbacks: [$object, 'method_name']
				if ( is_array( $callback ) && count( $callback ) === 2 && is_object( $callback[0] ) ) {
					try {
						$reflection = new ReflectionClass( $callback[0] );
						$file_path  = $reflection->getFileName();
					} catch ( ReflectionException $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
						// Skip if reflection fails
						continue;
					}
				}

				// Handle function name callbacks: 'function_name'
				if ( is_string( $callback ) && function_exists( $callback ) && ! str_contains( $callback, '::' ) ) {
					try {
						$reflection = new ReflectionFunction( $callback );
						$file_path  = $reflection->getFileName();
					} catch ( ReflectionException $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
						// Skip if reflection fails
						continue;
					}
				}

				// Check if file belongs to any problematic plugin
				if ( $file_path ) {
					$normalized_path = wp_normalize_path( $file_path );
					$plugin_dir      = wp_normalize_path( WP_PLUGIN_DIR );

					foreach ( $plugin_slugs as $plugin_slug ) {
						if ( str_contains( $normalized_path, $plugin_dir . '/' . $plugin_slug . '/' ) ) {
							$callbacks_to_remove[] = array(
								'callback' => $callback,
								'priority' => $priority,
							);
							break;
						}
					}
				}
			}
		}

		// Remove all identified callbacks
		foreach ( $callbacks_to_remove as $item ) {
			remove_action( 'enqueue_block_editor_assets', $item['callback'], $item['priority'] );
		}
	}

	/**
	 * Converts all URLs in the assets data to absolute URLs.
	 *
	 * @param array $data The assets data from Gutenberg's endpoint.
	 * @return array The assets data with absolute URLs.
	 */
	private function convert_urls_to_absolute( array $data ): array {
		// Convert script URLs
		if ( isset( $data['scripts'] ) && is_array( $data['scripts'] ) ) {
			foreach ( $data['scripts'] as $handle => $script ) {
				if ( isset( $script['src'] ) ) {
					$data['scripts'][ $handle ]['src'] = $this->make_url_absolute( $script['src'] );
				}
			}
		}

		// Convert style URLs
		if ( isset( $data['styles'] ) && is_array( $data['styles'] ) ) {
			foreach ( $data['styles'] as $handle => $style ) {
				if ( isset( $style['src'] ) ) {
					$data['styles'][ $handle ]['src'] = $this->make_url_absolute( $style['src'] );
				}
			}
		}

		// Convert script module URLs
		if ( isset( $data['script_modules'] ) && is_array( $data['script_modules'] ) ) {
			foreach ( $data['script_modules'] as $id => $src ) {
				$data['script_modules'][ $id ] = $this->make_url_absolute( $src );
			}
		}

		return $data;
	}

	/**
	 * Convert relative URLs to absolute URLs.
	 *
	 * @param string $src The source URL.
	 * @return string The absolute URL.
	 */
	private function make_url_absolute( $src ) {
		if ( ! empty( $src ) && is_string( $src ) && str_starts_with( $src, '/' ) && ! str_starts_with( $src, '//' ) ) {
			return site_url( $src );
		}
		return $src;
	}

	/**
	 * Checks the permissions for retrieving items.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 *
	 * @return bool|WP_Error True if the request has permission, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}

		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error(
			'rest_cannot_read_block_editor_assets',
			__( 'Sorry, you are not allowed to read the block editor assets.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Retrieves the block editor assets schema, conforming to JSON Schema.
	 *
	 * The response matches Gutenberg's /wp-block-editor/v1/assets format.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'block-editor-assets',
			'type'       => 'object',
			'properties' => array(
				'scripts'        => array(
					'description' => esc_html__( 'Editor scripts with metadata.', 'jetpack' ),
					'type'        => 'object',
					'readonly'    => true,
				),
				'styles'         => array(
					'description' => esc_html__( 'Editor styles with metadata.', 'jetpack' ),
					'type'        => 'object',
					'readonly'    => true,
				),
				'inline_scripts' => array(
					'description' => esc_html__( 'Inline scripts keyed by position (before/after).', 'jetpack' ),
					'type'        => 'object',
					'readonly'    => true,
				),
				'inline_styles'  => array(
					'description' => esc_html__( 'Inline styles keyed by position (before/after).', 'jetpack' ),
					'type'        => 'object',
					'readonly'    => true,
				),
				'html_templates' => array(
					'description' => esc_html__( 'HTML templates (script type="text/html").', 'jetpack' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
					'readonly'    => true,
				),
				'script_modules' => array(
					'description' => esc_html__( 'Script modules import map.', 'jetpack' ),
					'type'        => 'object',
					'readonly'    => true,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_1_Endpoint_Block_Editor_Assets' );
