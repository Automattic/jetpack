<?php
/**
 * Publicize_Assets.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Assets;

/**
 * Publicize_Assets class.
 */
class Publicize_Assets {

	/**
	 * Initialize the class.
	 */
	public static function configure() {
		Publicize_Script_Data::configure();

		add_action( 'enqueue_block_assets', array( __CLASS__, 'enqueue_block_editor_scripts' ) );
	}

	/**
	 * Whether to enqueue the block editor scripts.
	 *
	 * @return boolean True if the criteria are met.
	 */
	public static function should_enqueue_block_editor_scripts() {

		$post_type = get_post_type();

		if ( empty( $post_type ) || ! post_type_supports( $post_type, 'publicize' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Enqueue block editor scripts and styles.
	 */
	public static function enqueue_block_editor_scripts() {
		if ( ! self::should_enqueue_block_editor_scripts() ) {
			return;
		}

		$script_to_load = class_exists( 'Jetpack' ) ? 'editor-jetpack-sidebar' : 'editor-social-sidebar';

		Assets::register_script(
			'jetpack-social-editor',
			sprintf( '../build/%s.js', $script_to_load ),
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-publicize-pkg',
				'enqueue'    => true,
			)
		);
	}
}
