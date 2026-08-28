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
	 * Script handle for the welcome guide.
	 *
	 * @var string
	 */
	const WELCOME_GUIDE_SCRIPT_HANDLE = 'jetpack-form-welcome-guide';

	/**
	 * Preference scope owned by Jetpack Forms. Mirrors PREFERENCE_SCOPE in welcome-guide/index.tsx.
	 *
	 * @var string
	 */
	const PREFERENCE_SCOPE = 'jetpack/forms';

	/**
	 * Preference name holding whether the guide is still pending. Mirrors PREFERENCE_NAME in welcome-guide/index.tsx.
	 *
	 * @var string
	 */
	const PREFERENCE_NAME = 'welcomeGuide';

	/**
	 * Core's own welcome modal scope, which its Options menu item toggles. Owned by @wordpress/edit-post; mirrored in welcome-guide/index.tsx too.
	 *
	 * @var string
	 */
	const CORE_PREFERENCE_SCOPE = 'core/edit-post';

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
			'jetpack/button', // Used for the submit button previously.
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
			'core/accordion',
			'core/audio',
			'core/button', // Used for the submit button.
			'core/code',
			'core/column',
			'core/columns',
			'core/details',
			'core/group',
			'core/heading',
			'core/html',
			'core/icon',
			'core/image',
			'core/list-item',
			'core/list',
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
	 *
	 * Loads in all post block editor contexts (excluding the site editor). This
	 * cannot be narrowed to the form post type: `navigateToForm()` switches to a
	 * form through Gutenberg's in-editor entity navigation, which never reloads
	 * the page, so `admin_enqueue_scripts` does not run again. A page editor that
	 * did not load this bundle up front would jump into a form with none of the
	 * form editor behavior available.
	 */
	public static function enqueue_admin_scripts() {
		$screen = get_current_screen();

		// Only load in block editor contexts, not site editor
		if ( ! $screen || $screen->id === 'site-editor' || ! $screen->is_block_editor ) {
			return;
		}
		// Separate calls, so a missing editor asset does not take the guide down
		// with it — the two ship as their own entries.
		self::enqueue_editor_bundle();
		self::enqueue_welcome_guide();
	}

	/**
	 * Enqueue the form editor bundle.
	 */
	private static function enqueue_editor_bundle() {
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

	/**
	 * Enqueue the welcome guide.
	 *
	 * Unlike the editor bundle, this is scoped to the form post type. The guide
	 * is for people meeting the block editor for the first time, so someone who
	 * reaches a form through in-editor navigation from a post or page has
	 * already demonstrated they do not need it — and that path never re-runs
	 * this hook, so not loading here is what skips the guide for them.
	 *
	 * Loaded on every form editor page load, including once the guide has been
	 * dismissed. The guide does not add an Options menu item of its own; it
	 * takes over core's "Welcome Guide" item, which is present whether or not
	 * this bundle is. Skipping the bundle for dismissed users would leave that
	 * item unclaimed, and because it is a toggle rather than a button, choosing
	 * it would persist `welcomeGuide: true` — outliving the page load, beating
	 * the runtime default this package sets, and reopening core's generic modal
	 * in the form editor on each load until the user finished it there.
	 *
	 * The bundle carries the slide copy and styles as well as the shim that
	 * claims the menu item, so a dismissed user does pay for those — a few KB
	 * gzipped. Only the artwork is deferred, fetched when the guide opens.
	 */
	private static function enqueue_welcome_guide() {
		$screen = get_current_screen();
		if ( ! $screen || ! isset( $screen->post_type ) || Contact_Form::POST_TYPE !== $screen->post_type ) {
			return;
		}

		$preferences = self::get_persisted_preferences();

		/*
		 * Eligibility decides whether the guide opens on its own, which it
		 * never does once dismissed — reopening from the Options menu and the
		 * query argument both bypass it. The lookup costs a query, so skip it
		 * when the answer cannot change anything.
		 */
		$is_eligible = ! self::is_welcome_guide_dismissed( $preferences )
			&& self::is_welcome_guide_eligible( $preferences );

		$asset_file = __DIR__ . '/../../dist/form-editor/jetpack-form-welcome-guide.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'Welcome guide asset file not found: ' . $asset_file );
			return;
		}

		$asset = require $asset_file;
		Assets::register_script(
			self::WELCOME_GUIDE_SCRIPT_HANDLE,
			'../../dist/form-editor/jetpack-form-welcome-guide.js',
			__FILE__,
			array(
				'in_footer'    => true,
				'textdomain'   => 'jetpack-forms',
				'enqueue'      => true,
				'dependencies' => $asset['dependencies'],
				'version'      => $asset['version'],
			)
		);

		// Written as JSON rather than through wp_localize_script(), which casts
		// booleans to '1' and ''.
		wp_add_inline_script(
			self::WELCOME_GUIDE_SCRIPT_HANDLE,
			'window.jetpackFormsWelcomeGuide = ' . wp_json_encode(
				array(
					'isEligible'         => $is_eligible,
					'isCoreGuidePending' => self::is_core_welcome_guide_pending( $preferences ),
				),
				JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
			) . ';',
			'before'
		);
	}

	/**
	 * Reads the current user's persisted editor preferences.
	 *
	 * The same blob backs both the core welcome modal's state and this guide's
	 * dismissal, so it is read once and passed around.
	 *
	 * Core keeps these per site, under a blog-prefixed meta key built by
	 * wp_register_persisted_preferences_meta(), so the key has to come from
	 * get_blog_prefix() rather than a literal `wp_`. On a multisite subsite or
	 * an install with a custom table prefix a hardcoded key reads nothing,
	 * which looks exactly like "never dismissed, and eligible" for everyone.
	 *
	 * @return array The stored preferences, or an empty array.
	 */
	private static function get_persisted_preferences() {
		global $wpdb;

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return array();
		}

		$preferences = get_user_meta( $user_id, $wpdb->get_blog_prefix() . 'persisted_preferences', true );

		return is_array( $preferences ) ? $preferences : array();
	}

	/**
	 * Whether a welcome guide preference is stored with the given value.
	 *
	 * Both scopes keep the flag under the same name, and every rule here turns
	 * on a stored value rather than an absent one, so the three predicates below
	 * differ only in which scope and which value they ask about.
	 *
	 * @param array  $preferences The user's persisted editor preferences.
	 * @param string $scope       Preference scope to look in.
	 * @param bool   $value       Value to compare against.
	 * @return bool Whether the preference is stored with that value.
	 */
	private static function preference_is( array $preferences, $scope, $value ) {
		return isset( $preferences[ $scope ][ self::PREFERENCE_NAME ] )
			&& $value === $preferences[ $scope ][ self::PREFERENCE_NAME ];
	}

	/**
	 * Whether the user has asked for core's welcome modal and not yet seen it.
	 *
	 * Only a *stored* true counts. Core's own default is also true, but it is
	 * never written to the blob, so the two are indistinguishable in the
	 * browser — which is why this is decided here. The guide treats a stored
	 * true as a request for itself, since core's Options menu item is a toggle:
	 * choosing it on a screen where this bundle was absent (arriving at a form
	 * through in-editor navigation) persists true, and nothing would otherwise
	 * clear it. Left alone it beats the runtime default the editor bundle sets
	 * and reopens core's generic modal on every later form editor load.
	 *
	 * @param array $preferences The user's persisted editor preferences.
	 * @return bool Whether core's welcome modal is pending by the user's own choice.
	 */
	private static function is_core_welcome_guide_pending( array $preferences ) {
		return self::preference_is( $preferences, self::CORE_PREFERENCE_SCOPE, true );
	}

	/**
	 * Whether the user has already dismissed the welcome guide.
	 *
	 * @param array $preferences The user's persisted editor preferences.
	 * @return bool Whether the guide has been dismissed.
	 */
	private static function is_welcome_guide_dismissed( array $preferences ) {
		return self::preference_is( $preferences, self::PREFERENCE_SCOPE, false );
	}

	/**
	 * Whether the welcome guide should open on its own for the current user.
	 *
	 * Two audiences get it. Someone who has never dismissed the core welcome
	 * modal is new to the block editor, and the form guide stands in for the
	 * core one here. Everyone else gets it only until they have a form of their
	 * own, as first-run onboarding — regardless of how many posts or pages they
	 * have written.
	 *
	 * This only decides whether the guide opens by itself. The query argument
	 * overrides it.
	 *
	 * @param array $preferences The user's persisted editor preferences.
	 * @return bool Whether the guide should open on its own.
	 */
	private static function is_welcome_guide_eligible( array $preferences ) {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		// Core only stores false once the modal has been dismissed, so anything
		// else — including no stored value at all — means it is still pending.
		if ( ! self::preference_is( $preferences, self::CORE_PREFERENCE_SCOPE, false ) ) {
			return true;
		}

		// Every status except auto-draft: opening this screen creates one before
		// the enqueue runs, so counting it would hide the guide from the very
		// first-time author it is meant for.
		$statuses = array_values( array_diff( array_keys( get_post_stati() ), array( 'auto-draft' ) ) );

		$existing_forms = get_posts(
			array(
				'post_type'     => Contact_Form::POST_TYPE,
				'post_status'   => $statuses,
				'author'        => $user_id,
				'numberposts'   => 1,
				'fields'        => 'ids',
				'no_found_rows' => true,
				'cache_results' => false,
				'orderby'       => 'none',
			)
		);

		return empty( $existing_forms );
	}
}
