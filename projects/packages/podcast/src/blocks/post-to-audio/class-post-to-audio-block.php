<?php
/**
 * Post to Audio block.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;

/**
 * Registers the editor-only Post to Audio block.
 *
 * This block has no front-end render: on a successful generation it replaces
 * itself with a `core/audio` block, so the only asset that ships is the editor
 * bundle. The caller (Podcast::init()) owns the host + feature gate.
 */
class Post_To_Audio_Block {

	/**
	 * Editor script handle.
	 */
	const EDITOR_HANDLE = 'jetpack-post-to-audio-editor';

	/**
	 * Whether `register_hooks()` has run.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire the block's actions. Idempotent.
	 */
	public static function register_hooks() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'init', array( __CLASS__, 'register_block' ), 9 );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'load_editor_scripts' ), 9 );
	}

	/**
	 * Register the block from its block.json metadata.
	 */
	public static function register_block() {
		Blocks::jetpack_register_block( __DIR__ );
	}

	/**
	 * Enqueue the bundled editor script and localize the runtime config.
	 *
	 * Presets and quota are NOT localized here — the block fetches them live
	 * from the GET feature-info endpoint so the wpcom side stays the single
	 * source of truth. Only the REST paths, defaults, and poll cadence ride
	 * along inline.
	 */
	public static function load_editor_scripts() {
		Assets::register_script(
			self::EDITOR_HANDLE,
			'../../../dist/blocks/post-to-audio/editor.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'enqueue'    => true,
				'textdomain' => 'jetpack-podcast',
			)
		);

		$base = '/' . Post_To_Audio_Endpoint::REST_NAMESPACE . '/' . Post_To_Audio_Endpoint::REST_BASE;

		wp_add_inline_script(
			self::EDITOR_HANDLE,
			'window.jetpackPostToAudioBlock = ' . wp_json_encode(
				array(
					'endpoints' => array(
						'featureInfo' => $base,
						'enqueue'     => $base,
						'jobStatus'   => $base . '/jobs/',
						'previewText' => $base . '/preview-text',
					),
					'defaults'  => array(
						'voice'        => 'Charon',
						'musicGain'    => 0.10,
						'musicGainMin' => 0.0,
						'musicGainMax' => 0.30,
					),
					'poll'      => array(
						'intervalMs' => 3000,
						'timeoutMs'  => 5 * 60 * 1000,
					),
				),
				JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
			) . ';',
			'before'
		);

		// Keep the editor script URL on the admin scheme so a mapped-domain
		// site without SSL doesn't trip the browser's mixed-content block.
		add_filter( 'script_loader_src', array( __CLASS__, 'filter_editor_script_src' ), 10, 2 );
	}

	/**
	 * Rewrite the editor script src to match the admin scheme.
	 *
	 * @param string $src    Script source URL.
	 * @param string $handle Script handle.
	 * @return string
	 */
	public static function filter_editor_script_src( $src, $handle ) {
		if ( self::EDITOR_HANDLE !== $handle ) {
			return $src;
		}

		$admin_scheme = wp_parse_url( admin_url(), PHP_URL_SCHEME );
		if ( ! $admin_scheme ) {
			return $src;
		}

		return set_url_scheme( $src, $admin_scheme );
	}
}
