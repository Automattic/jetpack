<?php
/**
 * Reusable Forms class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

/**
 * Handles Reusable Forms functionality.
 */
class Reusable_Forms {

	/**
	 * Initialize the Reusable Forms feature.
	 */
	public static function init() {
		self::register_post_type();
		add_filter( 'allowed_block_types_all', array( __CLASS__, 'allowed_blocks_for_jetpack_form' ), 10, 2 );
		add_filter( 'wp_insert_post_data', array( __CLASS__, 'unwrap_contact_form_blocks' ), 10, 2 );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_assets' ) );
	}

	/**
	 * Register the jetpack-form custom post type.
	 */
	private static function register_post_type() {
		register_post_type(
			'jetpack-form',
			array(
				'labels'                => array(
					'name'                     => __( 'Forms', 'jetpack-forms' ),
					'singular_name'            => __( 'Form', 'jetpack-forms' ),
					'add_new'                  => __( 'Add Form', 'jetpack-forms' ),
					'add_new_item'             => __( 'Add Form', 'jetpack-forms' ),
					'new_item'                 => __( 'New Form', 'jetpack-forms' ),
					'edit_item'                => __( 'Edit Block Form', 'jetpack-forms' ),
					'view_item'                => __( 'View Form', 'jetpack-forms' ),
					'view_items'               => __( 'View Forms', 'jetpack-forms' ),
					'all_items'                => __( 'All Forms', 'jetpack-forms' ),
					'search_items'             => __( 'Search Forms', 'jetpack-forms' ),
					'not_found'                => __( 'No forms found.', 'jetpack-forms' ),
					'not_found_in_trash'       => __( 'No forms found in Trash.', 'jetpack-forms' ),
					'filter_items_list'        => __( 'Filter forms list', 'jetpack-forms' ),
					'items_list_navigation'    => __( 'Forms list navigation', 'jetpack-forms' ),
					'items_list'               => __( 'Forms list', 'jetpack-forms' ),
					'item_published'           => __( 'Form published.', 'jetpack-forms' ),
					'item_published_privately' => __( 'Form published privately.', 'jetpack-forms' ),
					'item_reverted_to_draft'   => __( 'Form reverted to draft.', 'jetpack-forms' ),
					'item_scheduled'           => __( 'Form scheduled.', 'jetpack-forms' ),
					'item_updated'             => __( 'Form updated.', 'jetpack-forms' ),
				),
				'public'                => false,
				'show_ui'               => true, // not sure we need this.
				'show_in_menu'          => false,
				'rewrite'               => false,
				'query_var'             => false,
				'show_in_rest'          => true,
				'rest_base'             => 'jetpack-forms',
				'rest_controller_class' => 'Automattic\Jetpack\Forms\ContactForm\REST_Jetpack_Form_Controller',
				'capability_type'       => 'post',
				'capabilities'          => array(
					// You need to be able to edit posts, in order to read blocks in their raw form.
					'read'                   => 'edit_posts',
					// You need to be able to publish posts, in order to create blocks.
					'create_posts'           => 'publish_posts',
					'edit_posts'             => 'edit_posts',
					'edit_published_posts'   => 'edit_published_posts',
					'delete_published_posts' => 'delete_published_posts',
					// Enables trashing draft posts as well.
					'delete_posts'           => 'delete_posts',
					'edit_others_posts'      => 'edit_others_posts',
					'delete_others_posts'    => 'delete_others_posts',
				),
				'map_meta_cap'          => true,
				'supports'              => array(
					'title',
					'excerpt',
					'editor',
					'revisions',
					'custom-fields',
				),
			)
		);
	}

	/**
	 * Restrict allowed blocks when editing jetpack-form posts.
	 *
	 * Only allows field blocks and supporting blocks. The contact-form block is excluded
	 * because visual wrapping is handled via DOM manipulation in the editor script.
	 *
	 * @param bool|array $allowed_block_types Array of block type slugs, or boolean to enable/disable all.
	 * @param object     $editor_context       The current editor context.
	 * @return bool|array Array of allowed block types for jetpack-form posts.
	 */
	public static function allowed_blocks_for_jetpack_form( $allowed_block_types, $editor_context ) {
		// Only apply to jetpack-form post type.
		if ( ! isset( $editor_context->post ) || 'jetpack-form' !== $editor_context->post->post_type ) {
			return $allowed_block_types;
		}

		// Allow only field blocks, button, and core blocks.
		// Visual wrapping is handled by JavaScript DOM manipulation.
		return array(
			// Field blocks.
			'jetpack/field-name',
			'jetpack/field-email',
			'jetpack/field-url',
			'jetpack/field-telephone',
			'jetpack/field-textarea',
			'jetpack/field-checkbox',
			'jetpack/field-checkbox-multiple',
			'jetpack/field-radio',
			'jetpack/field-select',
			'jetpack/field-date',
			'jetpack/field-consent',
			'jetpack/field-rating',
			'jetpack/field-text',
			'jetpack/field-number',
			'jetpack/field-file-upload',

			// Supporting blocks.
			'jetpack/button',
			'jetpack/label',
			'jetpack/input',
			'jetpack/options',
			'jetpack/option',
			'jetpack/phone-input',

			// Multistep blocks.
			'jetpack/form-step',
			'jetpack/form-step-container',
			'jetpack/form-step-divider',
			'jetpack/form-step-navigation',
			'jetpack/form-progress-indicator',

			// Core blocks for rich content.
			'core/paragraph',
			'core/heading',
			'core/list',
			'core/list-item',
			'core/separator',
			'core/spacer',
			'core/columns',
			'core/column',
			'core/group',
			'core/image',
			'core/html',
		);
	}

	/**
	 * Unwrap contact-form blocks from jetpack-form post content.
	 *
	 * Run this on save to clean up any wrapped content. This ensures that jetpack-form
	 * posts always store raw field blocks without any contact-form wrapper.
	 *
	 * @param array $data    An array of slashed, sanitized, and processed post data.
	 * @param array $postarr An array of sanitized (and slashed) but otherwise unmodified post data.
	 * @return array Modified post data.
	 */
	public static function unwrap_contact_form_blocks( $data, $postarr ) {
		// Only process jetpack-form posts.
		if ( 'jetpack-form' !== $data['post_type'] ) {
			return $data;
		}

		// Skip autosaves and revisions to prevent infinite loop with editor wrapping.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return $data;
		}

		// Skip revisions (autosaves are stored as revisions).
		if ( ! empty( $postarr['ID'] ) && wp_is_post_revision( $postarr['ID'] ) ) {
			return $data;
		}

		// Skip if content is empty.
		if ( empty( $data['post_content'] ) ) {
			return $data;
		}

		// Parse blocks from content.
		$blocks = parse_blocks( $data['post_content'] );

		// Unwrap any contact-form blocks.
		$unwrapped_blocks = array();
		$has_changes      = false;

		foreach ( $blocks as $block ) {
			if ( 'jetpack/contact-form' === $block['blockName'] ) {
				// Extract inner blocks from contact-form wrapper.
				if ( ! empty( $block['innerBlocks'] ) ) {
					$unwrapped_blocks = array_merge( $unwrapped_blocks, $block['innerBlocks'] );
					$has_changes      = true;
				}
			} else {
				$unwrapped_blocks[] = $block;
			}
		}

		// Re-serialize if changes were made.
		if ( $has_changes ) {
			$data['post_content'] = serialize_blocks( $unwrapped_blocks );
		}

		return $data;
	}

	/**
	 * Enqueue editor assets for jetpack-form post type.
	 *
	 * Loads JavaScript that wraps field blocks in a contact-form block when editing
	 * jetpack-form posts directly (for proper styling and context).
	 */
	public static function enqueue_editor_assets() {
		$screen = get_current_screen();

		// Only enqueue for jetpack-form post type editor.
		if ( ! $screen || 'jetpack-form' !== $screen->post_type ) {
			return;
		}

		$script_path = plugin_dir_path( __FILE__ ) . '../dist/blocks/jetpack-form-editor.js';
		$script_url  = plugin_dir_url( __FILE__ ) . '../dist/blocks/jetpack-form-editor.js';
		$style_path  = plugin_dir_path( __FILE__ ) . '../dist/blocks/jetpack-form-editor.css';
		$style_url   = plugin_dir_url( __FILE__ ) . '../dist/blocks/jetpack-form-editor.css';

		// Only enqueue if the file exists.
		if ( ! file_exists( $script_path ) ) {
			return;
		}

		$asset_file = plugin_dir_path( __FILE__ ) . '../dist/blocks/jetpack-form-editor.asset.php';
		$asset_data = file_exists( $asset_file ) ? require $asset_file : array(
			'dependencies' => array(),
			'version'      => filemtime( $script_path ),
		);

		wp_enqueue_script(
			'jetpack-form-editor',
			$script_url,
			$asset_data['dependencies'],
			$asset_data['version'],
			true
		);

		// Enqueue the editor styles for proper layout.
		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				'jetpack-form-editor',
				$style_url,
				array(),
				$asset_data['version']
			);
		}
	}
}
