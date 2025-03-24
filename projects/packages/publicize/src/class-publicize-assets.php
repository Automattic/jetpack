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

		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_block_editor_scripts' ), 15 );
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

		/** This filter is documented in projects/packages/publicize/src/class-publicize-base.php */
		$capability = apply_filters( 'jetpack_publicize_capability', 'publish_posts' );

		return current_user_can( $capability );
	}

	/**
	 * Enqueue block editor scripts and styles.
	 */
	public static function enqueue_block_editor_scripts() {
		if ( ! self::should_enqueue_block_editor_scripts() ) {
			return;
		}

		// We don't want to render the Social UI in Jetpack sidebar
		// if Jetpack is old, which has it bundled.
		if ( defined( 'JETPACK__VERSION' ) && ( version_compare( (string) JETPACK__VERSION, '14.5-a.1', '<' ) ) ) {
			return;
		}

		$script_to_load = class_exists( 'Jetpack' ) ? 'editor-jetpack-sidebar' : 'editor-social-sidebar';

		// Dequeue the old Social assets.
		wp_dequeue_script( 'jetpack-social-editor' );
		wp_dequeue_style( 'jetpack-social-editor' );

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
