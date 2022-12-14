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
	 * Gets the bridge script URL depending on the environment we are in
	 *
	 * @return string
	 */
	public static function get_block_editor_extensions_url() {
		return Assets::get_file_url_for_environment(
			'../build/block-editor/extensions/index.js', // <- production
			'client/block-editor/extensions/index.js', // <- development
			__FILE__
		);
	}

	/**
	 * Enqueues the jwt bridge script.
	 */
	public static function enqueue_extensions() {
		self::enqueue_script();

		$videopress_extensions_file        = __DIR__ . '/client/block-editor/extensions/index.json';
		$videopress_extensions_file_exists = file_exists( $videopress_extensions_file );
		if ( ! $videopress_extensions_file_exists ) {
			return;
		}

		$videopress_extensions_data = (array) json_decode(
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $videopress_extensions_file )
		);

		$beta_extensions = array_map(
			function ( $extension ) {
				return (array) array(
					'name'      => $extension,
					'isBeta'    => true,
					'isEnabled' => Constants::is_true( 'JETPACK_BETA_BLOCKS' ),
				);
			},
			$videopress_extensions_data['beta']
		);

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
				'extensions' => $beta_extensions,
				'siteType'   => $site_type,
			)
		);
	}

	/**
	 * Enqueues only the JS script
	 *
	 * @param string $handle The script handle to identify the script.
	 * @return bool True if the script was successfully localized, false otherwise.
	 */
	public static function enqueue_script( $handle = self::SCRIPT_HANDLE ) {
		$enqueued = wp_enqueue_script(
			$handle,
			self::get_block_editor_extensions_url(),
			array(),
			Package_Version::PACKAGE_VERSION,
			false
		);

		return $enqueued;
	}
}
