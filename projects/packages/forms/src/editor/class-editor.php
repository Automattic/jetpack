<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Editor;

use Automattic\Jetpack\Assets;

/**
 * Understands the Jetpack Forms package.
 */
class Editor {

	const PACKAGE_VERSION = '0.1';

	const SCRIPT_HANDLE = 'jetpack-forms-editor';

	/**
	 * Load the contact form editor hooks.
	 */
	public function init() {
		add_action( 'admin_menu', [ $this, 'add_menu_page' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
	}

	/**
 	* Registers the new WP Admin Menu
	*
	* @return void
	*/
	public function add_menu_page() {
		global $submenu;

		add_menu_page(
			'New Form',
			'Form Editor',
			'edit_posts',
			'jetpack-form', // hook/slug of page
			[ $this, 'render_editor' ], // function to render page
			'dashicons-welcome-widgets-menus'
		);
	}

	/**
	 * Enqueue scripts and styles for the form editor.
	 *
	 * @return void
	 */
	public function enqueue_scripts( $hook ) {
		global $current_screen;

		if ( 'toplevel_page_jetpack-form' !== $hook ) {
			return;
		}

		$current_screen->is_block_editor( true );

		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../../dist/editor/jetpack-forms-editor.js',
			__FILE__,
			array(
				'in_footer'    => true,
				'textdomain'   => 'jetpack-forms',
				'enqueue'      => true,
				'dependencies' => array( 'wp-api-fetch' ),
			)
		);

		// Inline the Editor Settings.
		$settings = $this->get_editor_settings();
		wp_add_inline_script( self::SCRIPT_HANDLE, 'window.getJetpackFormsSettings = ' . wp_json_encode( $settings ) . ';' );

		// Preload server-registered block schemas.
		wp_add_inline_script(
			'wp-blocks',
			'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( get_block_editor_server_block_settings() ) . ');'
		);

		// Editor default styles.

		wp_enqueue_script( 'wp-format-library' );
		wp_enqueue_style( 'wp-format-library' );

		// load editor assets
		\do_action( 'enqueue_block_assets' );

		// Styles.
	}

	/**
	 *
	 * @return void
	 */
	public function render_editor() {
		?>
		<div id="jetpack-form-editor" class="jetpack-form-editor block-editor"></div>
		<?php
	}

	public function get_editor_settings() {

		$settings = array(
			'disableCustomColors'    => get_theme_support( 'disable-custom-colors' ),
			'disableCustomFontSizes' => get_theme_support( 'disable-custom-font-sizes' ),
			// 'imageSizes'             => $available_image_sizes,
			'isRTL'                  => is_rtl(),
			// 'maxUploadFileSize'      => $max_upload_size,
			'__experimentalBlockPatterns' => [],
			'__experimentalFeatures' => [
				'blocks' => [
					'core/button' => [
						'border' => [
							'customRadius' => true
						]
					]
				]
			]
		);
		list( $color_palette, ) = (array) get_theme_support( 'editor-color-palette' );
		list( $font_sizes, )    = (array) get_theme_support( 'editor-font-sizes' );
		if ( false !== $color_palette ) {
			$settings['colors'] = $color_palette;
		}
		if ( false !== $font_sizes ) {
			$settings['fontSizes'] = $font_sizes;
		}

		return $settings;
	}

}
