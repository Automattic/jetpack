<?php
/**
 * VideoPress Extensions
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Host;

/**
 * VideoPress Extensions class.
 */
class Block_Editor_Extensions {

	/**
	 * The handle used to enqueue the script
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'videopress-extensions';

	/**
	 * Initializer
	 *
	 * This method should be called only once by the Initializer class. Do not call this method again.
	 */
	public static function init() {
		if ( ! Status::is_active() ) {
			return;
		}

		/**
		 * Alternative to `JETPACK_BETA_BLOCKS`, set to `true` to load Beta Blocks.
		 *
		 * @since 6.9.0
		 *
		 * @param boolean
		 */
		if ( apply_filters( 'jetpack_load_beta_blocks', false ) ) {
			Constants::set_constant( 'JETPACK_BETA_BLOCKS', true );
		}

		// Register the script.
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_extensions' ), 1 );
	}

	/**
	 * Return the extensions list
	 *
	 * @return array The extensions list.
	 */
	public static function get_list() {
		$videopress_extensions_file        = __DIR__ . '/../build/block-editor/extensions/index.json';
		$videopress_extensions_file_exists = file_exists( $videopress_extensions_file );
		if ( ! $videopress_extensions_file_exists ) {
			return;
		}

		$videopress_extensions_data = (array) json_decode(
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $videopress_extensions_file )
		);

		$extensions_list = array_map(
			function ( $extension ) {
				return (array) array(
					'name'      => $extension,
					'isBeta'    => true,
					'isEnabled' => Constants::is_true( 'JETPACK_BETA_BLOCKS' ),
				);
			},
			$videopress_extensions_data['beta']
		);

		return $extensions_list;
	}

	/**
	 * Check if the extension is available
	 *
	 * @param string $slug The extension slug.
	 * @return boolean True if the extension is available, false otherwise.
	 */
	public static function is_extension_available( $slug ) {
		$extensions_list = self::get_list();
		foreach ( $extensions_list as $extension ) {
			if ( $extension['name'] === $slug ) {
				return $extension['isEnabled'];
			}
		}

		return false;
	}

	/**
	 * Enqueues the extensions script.
	 */
	public static function enqueue_extensions() {
		self::enqueue_script();

		$extensions_list = self::get_list();

		$site_type = 'jetpack';
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$site_type = 'simple';
		} elseif ( ( new Host() )->is_woa_site() ) {
			$site_type = 'atomic';
		}

		wp_localize_script(
			self::SCRIPT_HANDLE,
			'videoPressEditorState',
			array(
				'extensions' => $extensions_list,
				'siteType'   => $site_type,
			)
		);
	}

	/**
	 * Enqueues only the JS script
	 *
	 * @param string $handle The script handle to identify the script.
	 */
	public static function enqueue_script( $handle = self::SCRIPT_HANDLE ) {
		Assets::register_script(
			$handle,
			'../build/block-editor/index.js',
			__FILE__,
			array(
				'in_footer'  => false,
				'textdomain' => 'jetpack-videopress-pkg',
			)
		);

		Assets::enqueue_script( $handle );
	}
}
