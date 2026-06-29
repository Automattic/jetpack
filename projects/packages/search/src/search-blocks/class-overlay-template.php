<?php
/**
 * Singleton CPT + lifecycle for the experimental block-template overlay.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Theme-agnostic customization surface for the Search overlay template via
 * post.php. Falls back to `templates/jetpack-search-overlay.html` when the
 * singleton doesn't exist. Lifecycle lives on {@see Singleton_Template_Cpt}.
 *
 * Gated behind both `jetpack_search_blocks_enabled` AND
 * `jetpack_search_overlay_block_template_enabled`.
 */
class Overlay_Template extends Singleton_Template_Cpt {

	const POST_TYPE          = 'jp_search_overlay';
	const REST_BASE          = 'jetpack-search-overlay';
	const OPTION_POST_ID     = 'jetpack_search_overlay_template_post_id';
	const EDITOR_REQUEST_KEY = 'jetpack_search_open_overlay_editor';
	const EDITOR_NONCE       = 'jetpack_search_overlay_editor';
	const SEED_META_KEY      = '_jetpack_search_overlay_seeded_version';

	/**
	 * Subclass hook — CPT labels.
	 *
	 * @return array{name:string,singular_name:string}
	 */
	protected static function labels(): array {
		return array(
			'name'          => __( 'Search overlay template', 'jetpack-search-pkg' ),
			'singular_name' => __( 'Search overlay template', 'jetpack-search-pkg' ),
		);
	}

	/**
	 * Subclass hook — default post title.
	 *
	 * @return string
	 */
	protected static function post_title(): string {
		return __( 'Jetpack Search overlay', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — seed `post_content`. Reads the bundled file directly,
	 * not via `Search_Blocks::get_overlay_template_content()` (that would
	 * loop back through this class's customization check).
	 *
	 * @return string
	 */
	protected static function read_seed_content(): string {
		$path = __DIR__ . '/templates/jetpack-search-overlay.html';
		if ( ! is_readable( $path ) ) {
			return '';
		}
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local, bundled template.
		return (string) file_get_contents( $path );
	}

	/**
	 * Subclass hook — forbidden-response copy.
	 *
	 * @return string
	 */
	protected static function forbidden_message(): string {
		return __( 'You do not have permission to customize the Search overlay.', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — create-failure copy.
	 *
	 * @return string
	 */
	protected static function create_failure_message(): string {
		return __( 'Could not create the Search overlay template.', 'jetpack-search-pkg' );
	}
}
