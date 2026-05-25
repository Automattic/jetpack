<?php
/**
 * Singleton CPT + lifecycle for the experimental block-template overlay.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Lets admins customize the experimental Search blocks overlay template via
 * the standard block editor (post.php), which is theme-agnostic — works on
 * both block themes and classic themes, no Site Editor dependency.
 *
 * The customized markup lives in a single hidden CPT post; if the post
 * doesn't exist (admin hasn't customized), the overlay falls back to the
 * bundled `templates/jetpack-search-overlay.html` file. Deleting the
 * singleton restores the default.
 *
 * Lifecycle, register-post-type behavior, capability lockdown, and reset
 * semantics all live on {@see Singleton_Template_Cpt}; this subclass only
 * declares the identifiers, copy, and seed source that vary per template.
 *
 * Gated behind both `jetpack_search_blocks_enabled` AND
 * `jetpack_search_overlay_block_template_enabled` — only initialized from
 * `Search_Blocks::init()` when the overlay path is wired up.
 */
class Overlay_Template extends Singleton_Template_Cpt {

	const POST_TYPE          = 'jp_search_overlay';
	const REST_BASE          = 'jetpack-search-overlay';
	const OPTION_POST_ID     = 'jetpack_search_overlay_template_post_id';
	const EDITOR_REQUEST_KEY = 'jetpack_search_open_overlay_editor';
	const EDITOR_NONCE       = 'jetpack_search_overlay_editor';
	const SEED_META_KEY      = '_jetpack_search_overlay_seeded_version';

	/**
	 * Subclass hook — labels for the hidden CPT.
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
	 * Subclass hook — default post title for the lazy-created singleton.
	 *
	 * @return string
	 */
	protected static function post_title(): string {
		return __( 'Jetpack Search overlay', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — seed `post_content` for the lazy-created singleton.
	 * Reads the bundled overlay template file directly to avoid pulling
	 * in `Search_Blocks::get_overlay_template_content()`, which would
	 * loop back through this class's customization check.
	 *
	 * @return string
	 */
	protected static function read_seed_content(): string {
		$path = __DIR__ . '/templates/jetpack-search-overlay.html';
		if ( ! is_readable( $path ) ) {
			return '';
		}
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local, bundled template file.
		return (string) file_get_contents( $path );
	}

	/**
	 * Subclass hook — copy for the editor-URL forbidden response.
	 *
	 * @return string
	 */
	protected static function forbidden_message(): string {
		return __( 'You do not have permission to customize the Search overlay.', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — copy for the editor-URL create-failure response.
	 *
	 * @return string
	 */
	protected static function create_failure_message(): string {
		return __( 'Could not create the Search overlay template.', 'jetpack-search-pkg' );
	}
}
