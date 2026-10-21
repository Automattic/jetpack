<?php
/**
 * The comment form settings card for Jetpack's Discussion settings.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Assets;

/**
 * Loads the card's bundle, which the dashboard renders from `window.jetpackCommentsSettings`.
 */
class Settings {

	/**
	 * Enqueue the card, with the data its preview needs. Call it before `admin_head`.
	 *
	 * @return void
	 */
	public static function enqueue() {
		Assets::register_script(
			'jetpack-comments-settings',
			'../build/settings.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-comments',
				'enqueue'    => true,
			)
		);

		$is_enabled = Comments::is_enabled();
		$data       = array(
			'preview'        => $is_enabled ? Form_Preview::get_data() : null,
			'hasBlockEditor' => $is_enabled && Block_Editor::is_enabled(),
		);

		wp_add_inline_script( 'jetpack-comments-settings', 'var jetpackCommentsSettings = ' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';', 'before' );

		if ( $is_enabled ) {
			add_action( 'admin_head', array( Form_Preview::class, 'print_theme_assets' ) );
		}
	}
}
