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
	const SCRIPT_HANDLE = 'jetpack-forms-editor';

	/**
	 * Initialize the form editor.
	 */
	public static function init() {
		add_filter( 'allowed_block_types_all', array( __CLASS__, 'allowed_blocks_for_jetpack_form' ), 10, 2 );
		add_filter( 'block_editor_settings_all', array( __CLASS__, 'block_editor_settings_all' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_scripts' ) );
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
			// 'jetpack/contact-form',
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
	 * Modify block editor settings for jetpack-form posts.
	 *
	 * Disables the inserter in the top toolbar and hides the title field.
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

		// Enable block locking capability (was previously disabled)
		$settings['canLockBlocks'] = false;

		// Hide the title field in the editor
		$settings['__experimentalDisablePostTitle'] = true;

		return $settings;
	}

	/**
	 * Enqueue admin scripts for jetpack-form post type.
	 */
	public static function enqueue_admin_scripts() {
		$screen = get_current_screen();
		if ( ! $screen || $screen->id === 'site-editor' ) {
			return;
		}
		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../../dist/form-editor/jetpack-forms-editor.js',
			__FILE__,
			array(
				'in_footer'    => true,
				'textdomain'   => 'jetpack-forms',
				'enqueue'      => true,
				'dependencies' => array( 'wp-data', 'wp-hooks', 'wp-polyfill', 'wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n' ),
			)
		);
	}
}
