<?php
/**
 * Retrieve resources (styles and scripts) loaded by the block editor.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Core class used to retrieve the block editor assets via the REST API.
 */
class WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets extends WP_REST_Controller {
	const CACHE_BUSTER = '2025-02-28';

	/**
	 * List of allowed plugin handle prefixes whose assets should be preserved.
	 * Each entry should be a handle prefix that identifies assets from allowed plugins.
	 *
	 * @var array
	 */
	const ALLOWED_PLUGIN_HANDLE_PREFIXES = array(
		'jetpack-', // E.g., jetpack-blocks-editor, jetpack-connection
		'jp-', // E.g., jp-forms-blocks
		'videopress-', // E.g., videopress-add-resumable-upload-support
		'wp-', // E.g., wp-block-styles, wp-jp-i18n-loader
	);

	/**
	 * List of core-provided handles that should never be unregistered.
	 *
	 * @var array
	 */
	const PROTECTED_HANDLES = array(
		'jquery',
		'mediaelement',
	);

	/**
	 * List of allowed plugin-provided, non-core block types.
	 *
	 * @var array
	 */
	const ALLOWED_PLUGIN_BLOCKS = array(
		'a8c/blog-posts',
		'a8c/posts-carousel',
		'jetpack/address',
		'jetpack/ai-assistant',
		'jetpack/blog-stats',
		'jetpack/blogging-prompt',
		'jetpack/blogroll',
		'jetpack/blogroll-item',
		'jetpack/business-hours',
		'jetpack/button',
		'jetpack/calendly',
		'jetpack/contact-info',
		'jetpack/email',
		'jetpack/event-countdown',
		'jetpack/eventbrite',
		'jetpack/gif',
		'jetpack/goodreads',
		'jetpack/google-calendar',
		'jetpack/image-compare',
		'jetpack/instagram-gallery',
		'jetpack/like',
		'jetpack/mailchimp',
		'jetpack/map',
		'jetpack/markdown',
		'jetpack/nextdoor',
		'jetpack/opentable',
		'jetpack/payment-buttons',
		'jetpack/payments-intro',
		'jetpack/paypal-payment-buttons',
		'jetpack/phone',
		'jetpack/pinterest',
		'jetpack/podcast-player',
		'jetpack/rating-star',
		'jetpack/recurring-payments',
		'jetpack/related-posts',
		'jetpack/repeat-visitor',
		'jetpack/send-a-message',
		'jetpack/sharing-button',
		'jetpack/sharing-buttons',
		'jetpack/simple-payments',
		'jetpack/subscriber-login',
		'jetpack/subscriptions',
		'jetpack/tiled-gallery',
		'jetpack/timeline',
		'jetpack/timeline-item',
		'jetpack/top-posts',
		'jetpack/whatsapp-button',
		'premium-content/buttons',
		'premium-content/container',
		'premium-content/logged-out-view',
		'premium-content/login-button',
		'premium-content/subscriber-view',
	);

	/**
	 * List of disallowed core block types.
	 *
	 * @var array
	 */
	const DISALLOWED_CORE_BLOCKS = array(
		'core/freeform', // Classic editor - TinyMCE is unavailable in the mobile editor
	);

	/**
	 * Get the list of allowed core block types.
	 *
	 * @return array List of core block types.
	 */
	private function get_core_block_types() {
		$core_blocks = array_filter(
			array_keys( WP_Block_Type_Registry::get_instance()->get_all_registered() ),
			function ( $block_name ) {
				return str_starts_with( $block_name, 'core/' );
			}
		);

		// Remove disallowed core blocks
		return array_diff( $core_blocks, self::DISALLOWED_CORE_BLOCKS );
	}

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
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
					// Disabled to allow return structure to match existing endpoints
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey
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
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited
		global $wp_styles, $wp_scripts;

		// Save current asset state
		$current_wp_styles  = $wp_styles;
		$current_wp_scripts = $wp_scripts;

		try {
			// Preserve allowed plugin assets before reinitializing
			$preserved = $this->preserve_allowed_plugin_assets();

			// Initialize fresh asset registries to control what gets loaded
			$wp_styles  = new WP_Styles();
			$wp_scripts = new WP_Scripts();

			// Restore preserved plugin assets
			$this->restore_preserved_assets( $preserved );

			// Set up a block editor screen context to prevent errors when
			// plugins/themes call get_current_screen() during asset enqueueing
			$this->setup_block_editor_screen();

			// Trigger wp_loaded action that plugins frequently use to enqueue assets.
			// This must happen after screen setup and before we collect enqueued assets.
			do_action( 'wp_loaded' );

			// Enqueue all core WordPress editor assets
			$this->enqueue_core_editor_assets();

			// Trigger block editor asset actions with forced script/style loading
			add_filter( 'should_load_block_editor_scripts_and_styles', '__return_true' );
			do_action( 'enqueue_block_assets' );
			do_action( 'enqueue_block_editor_assets' );
			remove_filter( 'should_load_block_editor_scripts_and_styles', '__return_true' );

			// Enqueue editor-specific assets for all registered block types
			$this->enqueue_block_type_editor_assets();

			// Remove disallowed plugin assets before generating output
			$this->unregister_disallowed_plugin_assets();

			// Capture HTML output with absolute URLs
			$html = $this->with_absolute_urls(
				function () {
					return array(
						'styles'  => $this->capture_styles_output(),
						'scripts' => $this->capture_scripts_output(),
					);
				}
			);

			return rest_ensure_response(
				array(
					'allowed_block_types' => array_merge(
						$this->get_core_block_types(),
						self::ALLOWED_PLUGIN_BLOCKS
					),
					'scripts'             => $html['scripts'],
					'styles'              => $html['styles'],
				)
			);

		} finally {
			// Always restore original asset state, even if an exception occurred
			$wp_styles  = $current_wp_styles;
			$wp_scripts = $current_wp_scripts;
		}
	}

	/**
	 * Enqueues core WordPress editor assets.
	 *
	 * This includes polyfills, block styles, theme styles, and foundational
	 * post editor scripts and styles.
	 */
	private function enqueue_core_editor_assets() {
		global $wp_styles;

		// We generally do not need reset styles for the block editor. However, if
		// it's a classic theme, margins will be added to every block, which is
		// reset specifically for list items, so classic themes rely on these
		// reset styles.
		$wp_styles->done =
			wp_theme_has_theme_json() ? array( 'wp-reset-editor-styles' ) : array();

		wp_enqueue_script( 'wp-polyfill' );
		// Enqueue the `editorStyle` handles for all core block, and dependencies.
		wp_enqueue_style( 'wp-edit-blocks' );

		if ( current_theme_supports( 'wp-block-styles' ) ) {
			wp_enqueue_style( 'wp-block-library-theme' );
		}

		// Enqueue frequent dependent, admin-only `dashicon` asset.
		wp_enqueue_style( 'dashicons' );

		// Enqueue the admin-only `postbox` asset required for the block editor.
		$suffix = wp_scripts_get_suffix();
		wp_enqueue_script( 'postbox', "/wp-admin/js/postbox$suffix.js", array( 'jquery-ui-sortable', 'wp-a11y' ), self::CACHE_BUSTER, true );

		// Enqueue foundational post editor assets.
		wp_enqueue_script( 'wp-edit-post' );
		wp_enqueue_style( 'wp-edit-post' );
	}

	/**
	 * Enqueues editor-specific assets for all registered block types.
	 *
	 * This includes editor_style_handles and editor_script_handles for each
	 * block, which contains editor-only styling and scripts.
	 */
	private function enqueue_block_type_editor_assets() {
		$block_registry = WP_Block_Type_Registry::get_instance();
		foreach ( $block_registry->get_all_registered() as $block_type ) {
			if ( isset( $block_type->editor_style_handles ) && is_array( $block_type->editor_style_handles ) ) {
				foreach ( $block_type->editor_style_handles as $style_handle ) {
					wp_enqueue_style( $style_handle );
				}
			}
			if ( isset( $block_type->editor_script_handles ) && is_array( $block_type->editor_script_handles ) ) {
				foreach ( $block_type->editor_script_handles as $script_handle ) {
					wp_enqueue_script( $script_handle );
				}
			}
		}
	}

	/**
	 * Captures the HTML output of enqueued scripts.
	 *
	 * @return string The HTML output of all enqueued scripts.
	 */
	private function capture_scripts_output() {
		ob_start();
		wp_print_head_scripts();
		wp_print_footer_scripts();
		return ob_get_clean();
	}

	/**
	 * Preserves allowed plugin assets from the current asset registries.
	 *
	 * This method clones assets from allowed plugins that aren't core/Gutenberg
	 * assets, so they can be restored after reinitializing the asset registries.
	 *
	 * @return array Array with 'scripts' and 'styles' keys containing cloned assets.
	 */
	private function preserve_allowed_plugin_assets() {
		global $wp_scripts, $wp_styles;

		$preserved = array(
			'scripts' => array(),
			'styles'  => array(),
		);

		foreach ( $wp_scripts->registered as $handle => $script ) {
			if ( $this->is_allowed_plugin_handle( $handle ) && ! $this->is_core_or_gutenberg_asset( $script->src ) ) {
				$preserved['scripts'][ $handle ] = clone $script;
			}
		}

		foreach ( $wp_styles->registered as $handle => $style ) {
			if ( $this->is_allowed_plugin_handle( $handle ) && ! $this->is_core_or_gutenberg_asset( $style->src ) ) {
				$preserved['styles'][ $handle ] = clone $style;
			}
		}

		return $preserved;
	}

	/**
	 * Restores previously preserved plugin assets to the asset registries.
	 *
	 * @param array $preserved Array with 'scripts' and 'styles' keys containing preserved assets.
	 */
	private function restore_preserved_assets( $preserved ) {
		global $wp_scripts, $wp_styles;

		foreach ( $preserved['scripts'] as $handle => $script ) {
			$wp_scripts->registered[ $handle ] = $script;
		}

		foreach ( $preserved['styles'] as $handle => $style ) {
			$wp_styles->registered[ $handle ] = $style;
		}
	}

	/**
	 * Executes a callback with absolute URL filters temporarily enabled.
	 *
	 * This ensures that all asset URLs are converted to absolute URLs during
	 * the callback execution, then removes the filters afterward.
	 *
	 * @param callable $callback The function to execute with absolute URL filters.
	 * @return mixed The return value of the callback.
	 */
	private function with_absolute_urls( $callback ) {
		add_filter( 'script_loader_src', array( $this, 'make_url_absolute' ), 10, 2 );
		add_filter( 'style_loader_src', array( $this, 'make_url_absolute' ), 10, 2 );

		$result = $callback();

		remove_filter( 'script_loader_src', array( $this, 'make_url_absolute' ), 10 );
		remove_filter( 'style_loader_src', array( $this, 'make_url_absolute' ), 10 );

		return $result;
	}

	/**
	 * Captures the HTML output of enqueued styles with emoji handling.
	 *
	 * This temporarily removes the emoji styles action to prevent deprecation
	 * warnings, then restores it after capturing the output.
	 *
	 * @return string The HTML output of all enqueued styles.
	 */
	private function capture_styles_output() {
		// Remove the deprecated `print_emoji_styles` handler. It avoids breaking
		// style generation with a deprecation message.
		$has_emoji_styles = has_action( 'wp_print_styles', 'print_emoji_styles' );
		if ( $has_emoji_styles ) {
			remove_action( 'wp_print_styles', 'print_emoji_styles' );
		}

		ob_start();
		wp_print_styles();
		$styles = ob_get_clean();

		if ( $has_emoji_styles ) {
			add_action( 'wp_print_styles', 'print_emoji_styles' );
		}

		return $styles;
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
	 * Unregisters all assets except those from core or allowed plugins.
	 */
	private function unregister_disallowed_plugin_assets() {
		global $wp_scripts, $wp_styles;

		// Unregister disallowed plugin scripts
		foreach ( $wp_scripts->registered as $handle => $script ) {
			// Skip core scripts and protected handles
			if ( $this->is_core_or_gutenberg_asset( $script->src ) || $this->is_protected_handle( $handle ) ) {
				continue;
			}

			if ( ! $this->is_allowed_plugin_handle( $handle ) ) {
				unset( $wp_scripts->registered[ $handle ] );
			}
		}

		// Unregister disallowed plugin styles
		foreach ( $wp_styles->registered as $handle => $style ) {
			// Skip core styles and protected handles
			if ( $this->is_core_or_gutenberg_asset( $style->src ) || $this->is_protected_handle( $handle ) ) {
				continue;
			}

			if ( ! $this->is_allowed_plugin_handle( $handle ) ) {
				unset( $wp_styles->registered[ $handle ] );
			}
		}
	}

	/**
	 * Check if an asset is a core or Gutenberg asset.
	 *
	 * @param string $src The asset source URL.
	 * @return bool True if the asset is a core or Gutenberg asset, false otherwise.
	 */
	private function is_core_or_gutenberg_asset( $src ) {
		if ( ! is_string( $src ) ) {
			return false;
		}

		return empty( $src ) ||
			$src[0] === '/' ||
			str_contains( $src, 'wp-includes/' ) ||
			str_contains( $src, 'wp-admin/' ) ||
			str_contains( $src, 'plugins/gutenberg/' ) ||
			str_contains( $src, 'plugins/gutenberg-core/' ); // WPCOM-specific path
	}

	/**
	 * Check if a handle should be protected.
	 *
	 * @param string $handle The asset handle.
	 * @return bool True if the handle should be protected, false otherwise.
	 */
	private function is_protected_handle( $handle ) {
		return in_array( $handle, self::PROTECTED_HANDLES, true );
	}

	/**
	 * Check if a handle is from an allowed plugin.
	 *
	 * @param string $handle The asset handle.
	 * @return bool True if the handle is from an allowed plugin, false otherwise.
	 */
	private function is_allowed_plugin_handle( $handle ) {
		if ( ! is_string( $handle ) || empty( $handle ) ) {
			return false;
		}

		foreach ( self::ALLOWED_PLUGIN_HANDLE_PREFIXES as $allowed_prefix ) {
			if ( str_starts_with( $handle, $allowed_prefix ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Convert relative URLs to absolute URLs.
	 *
	 * @param string $src The source URL.
	 * @return string The absolute URL.
	 */
	public function make_url_absolute( $src ) {
		if ( ! empty( $src ) && str_starts_with( $src, '/' ) && ! str_starts_with( $src, '//' ) ) {
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
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'type'       => 'object',
			'properties' => array(
				'allowed_block_types' => array(
					'description' => esc_html__( 'List of allowed block types for the editor.', 'jetpack' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
				),
				'scripts'             => array(
					'description' => esc_html__( 'Script tags for the block editor.', 'jetpack' ),
					'type'        => 'string',
				),
				'styles'              => array(
					'description' => esc_html__( 'Style link tags for the block editor.', 'jetpack' ),
					'type'        => 'string',
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets' );
