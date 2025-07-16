<?php
/**
 * Retrieve resources (styles and scripts) loaded by the block editor.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

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
		'jetpack/ai-chat',
		'jetpack/blogging-prompt',
		'jetpack/blogroll',
		'jetpack/blogroll-item',
		'jetpack/business-hours',
		'jetpack/button',
		'jetpack/calendly',
		'jetpack/contact-form',
		'jetpack/contact-info',
		'jetpack/cookie-consent',
		'jetpack/donations',
		'jetpack/email',
		'jetpack/event-countdown',
		'jetpack/eventbrite',
		'jetpack/field-checkbox',
		'jetpack/field-checkbox-multiple',
		'jetpack/field-consent',
		'jetpack/field-date',
		'jetpack/field-email',
		'jetpack/field-name',
		'jetpack/field-number',
		'jetpack/field-option-checkbox',
		'jetpack/field-option-radio',
		'jetpack/field-radio',
		'jetpack/field-select',
		'jetpack/field-telephone',
		'jetpack/field-text',
		'jetpack/field-textarea',
		'jetpack/field-url',
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
		'jetpack/paywall',
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
		'jetpack/slideshow',
		'jetpack/story',
		'jetpack/subscriber-login',
		'jetpack/subscriptions',
		'jetpack/tiled-gallery',
		'jetpack/timeline',
		'jetpack/timeline-item',
		'jetpack/tock',
		'jetpack/whatsapp-button',
		'premium-content/buttons',
		'premium-content/container',
		'premium-content/logged-out-view',
		'premium-content/login-button',
		'premium-content/subscriber-view',
		'syntaxhighlighter/code',
	);

	/**
	 * Get the list of allowed core block types.
	 *
	 * @return array List of core block types.
	 */
	private function get_core_block_types() {
		return array_filter(
			array_keys( WP_Block_Type_Registry::get_instance()->get_all_registered() ),
			function ( $block_name ) {
				return strpos( $block_name, 'core/' ) === 0;
			}
		);
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

		$current_wp_styles  = $wp_styles;
		$current_wp_scripts = $wp_scripts;

		$wp_styles  = new WP_Styles();
		$wp_scripts = new WP_Scripts();

		// Trigger an action frequently used by plugins to enqueue assets.
		do_action( 'wp_loaded' );

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

		// Ensure the block editor scripts and styles are enqueued.
		add_filter( 'should_load_block_editor_scripts_and_styles', '__return_true' );
		do_action( 'enqueue_block_assets' );
		do_action( 'enqueue_block_editor_assets' );
		remove_filter( 'should_load_block_editor_scripts_and_styles', '__return_true' );

		// Additionally, enqueue `editorStyle` and `editorScript` assets for all
		// blocks, which contains editor-only styling for blocks (editor content).
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

		// Remove the deprecated `print_emoji_styles` handler. It avoids breaking
		// style generation with a deprecation message.
		$has_emoji_styles = has_action( 'wp_print_styles', 'print_emoji_styles' );
		if ( $has_emoji_styles ) {
			remove_action( 'wp_print_styles', 'print_emoji_styles' );
		}

		// Unregister disallowed plugin assets before proceeding with asset collection
		$this->unregister_disallowed_plugin_assets();

		ob_start();
		wp_print_styles();
		$styles = ob_get_clean();

		if ( $has_emoji_styles ) {
			add_action( 'wp_print_styles', 'print_emoji_styles' );
		}

		ob_start();
		wp_print_head_scripts();
		wp_print_footer_scripts();
		$scripts = ob_get_clean();

		$wp_styles  = $current_wp_styles;
		$wp_scripts = $current_wp_scripts;

		return rest_ensure_response(
			array(
				'allowed_block_types' => array_merge(
					$this->get_core_block_types(),
					self::ALLOWED_PLUGIN_BLOCKS
				),
				'scripts'             => $scripts,
				'styles'              => $styles,
			)
		);
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
			strpos( $src, 'wp-includes/' ) !== false ||
			strpos( $src, 'wp-admin/' ) !== false ||
			strpos( $src, 'plugins/gutenberg/' ) !== false ||
			strpos( $src, 'plugins/gutenberg-core/' ) !== false; // WPCOM-specific path
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
			if ( strpos( $handle, $allowed_prefix ) === 0 ) {
				return true;
			}
		}

		return false;
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
