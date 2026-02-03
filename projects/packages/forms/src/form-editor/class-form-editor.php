<?php
/**
 * Jetpack forms editor.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Editor;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form;

/**
 * Class Form_Editor
 *
 * Handles the form editor functionality for jetpack-form post type.
 */
class Form_Editor {

	/**
	 * Script handle for the form editor.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jetpack-form-editor';

	/**
	 * Initialize the form editor.
	 */
	public static function init() {
		add_filter( 'allowed_block_types_all', array( __CLASS__, 'allowed_blocks_for_jetpack_form' ), 10, 2 );
		add_filter( 'block_editor_settings_all', array( __CLASS__, 'block_editor_settings_all' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_scripts' ) );
		add_action( 'current_screen', array( __CLASS__, 'disable_block_directory' ) );
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
		if ( ! isset( $editor_context->post ) || Contact_Form::POST_TYPE !== $editor_context->post->post_type ) {
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
			'jetpack/field-hidden',
			'jetpack/field-file',
			'jetpack/field-time',
			'jetpack/field-slider',
			'jetpack/field-image-select',

			// Supporting blocks.
			'jetpack/button',
			'jetpack/label',
			'jetpack/input',
			'jetpack/options',
			'jetpack/option',
			'jetpack/phone-input',
			'jetpack/dropzone',
			'jetpack/input-range',
			'jetpack/input-rating',
			'jetpack/fieldset-image-options',
			'jetpack/input-image-option',

			// Multistep blocks.
			'jetpack/form-step',
			'jetpack/form-step-container',
			'jetpack/form-step-divider',
			'jetpack/form-step-navigation',
			'jetpack/form-progress-indicator',

			// Core blocks for rich content.
			'core/audio',
			'core/button',
			'core/code',
			'core/columns',
			'core/column',
			'core/group',
			'core/heading',
			'core/html',
			'core/image',
			'core/list',
			'core/list-item',
			'core/math',
			'core/paragraph',
			'core/row',
			'core/separator',
			'core/spacer',
			'core/stack',
			'core/subhead',
			'core/video',
		);
	}

	/**
	 * Modify block editor settings for jetpack-form posts.
	 *
	 * @param array  $settings       Block editor settings.
	 * @param object $editor_context The current editor context.
	 * @return array Modified block editor settings for jetpack-form posts.
	 */
	public static function block_editor_settings_all( $settings, $editor_context ) {
		// Only apply to jetpack-form post type.
		if ( ! isset( $editor_context->post ) || Contact_Form::POST_TYPE !== $editor_context->post->post_type ) {
			return $settings;
		}

		// Disable block locking capability.
		$settings['canLockBlocks'] = false;

		return $settings;
	}

	/**
	 * Disable the block directory in the form editor.
	 *
	 * Removes the block directory assets (install blocks from the inserter)
	 * since this feature is not needed in the form editor.
	 * Hooked to `current_screen` so it runs before scripts are enqueued.
	 *
	 * @param \WP_Screen $screen The current screen object.
	 */
	public static function disable_block_directory( $screen ) {
		if ( ! isset( $screen->post_type ) ) {
			return;
		}
		if ( Contact_Form::POST_TYPE === $screen->post_type ) {
			remove_action( 'enqueue_block_editor_assets', 'wp_enqueue_editor_block_directory_assets' );
		}
	}

	/**
	 * Enqueue admin scripts for block editor.
	 * Loads in all post block editor contexts (excluding the site editor) so that the
	 * rename command is available and can be used when a form block is selected.
	 */
	public static function enqueue_admin_scripts() {
		$screen = get_current_screen();

		// Only load in block editor contexts, not site editor
		if ( ! $screen || $screen->id === 'site-editor' || ! $screen->is_block_editor ) {
			return;
		}
		$asset_file = __DIR__ . '/../../dist/form-editor/jetpack-form-editor.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'Form Editor asset file not found: ' . $asset_file );
			return;
		}
		$asset = require $asset_file;
		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../../dist/form-editor/jetpack-form-editor.js',
			__FILE__,
			array(
				'in_footer'    => true,
				'textdomain'   => 'jetpack-forms',
				'enqueue'      => true,
				'dependencies' => $asset['dependencies'],
				'version'      => $asset['version'],
			)
		);
	}
}
