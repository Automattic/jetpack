<?php
/**
 * Singleton CPT + lifecycle for the classic-theme search template editor.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Lets admins customize the search results template on classic themes via
 * the standard block editor (post.php) — a theme-agnostic editing surface
 * for a route the Site Editor can't reach. Block themes keep using their
 * existing Site Editor entry point; this class is the equivalent
 * affordance for the classic-theme `template_include` render path.
 *
 * All lifecycle / registration / reset machinery lives on
 * {@see Singleton_Template_Cpt}; only the identifiers, copy, and seed
 * source differ from {@see Overlay_Template}. The seed is the same body
 * `Search_Blocks::get_classic_theme_search_body()` returns at render time
 * — placeholders substituted, template-part wrappers stripped — so what
 * the admin edits matches what the front end renders.
 */
class Search_Template extends Singleton_Template_Cpt {

	const POST_TYPE          = 'jp_search_template';
	const REST_BASE          = 'jetpack-search-template';
	const OPTION_POST_ID     = 'jetpack_search_template_post_id';
	const EDITOR_REQUEST_KEY = 'jetpack_search_open_template_editor';
	const EDITOR_NONCE       = 'jetpack_search_template_editor';
	const SEED_META_KEY      = '_jetpack_search_template_seeded_version';

	/**
	 * Subclass hook — labels for the hidden CPT.
	 *
	 * @return array{name:string,singular_name:string}
	 */
	protected static function labels(): array {
		return array(
			'name'          => __( 'Search template', 'jetpack-search-pkg' ),
			'singular_name' => __( 'Search template', 'jetpack-search-pkg' ),
		);
	}

	/**
	 * Subclass hook — default post title for the lazy-created singleton.
	 *
	 * @return string
	 */
	protected static function post_title(): string {
		return __( 'Jetpack Search template', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — seed `post_content` for the lazy-created singleton.
	 * Reuses `Search_Blocks::get_classic_theme_search_body()` so the seed
	 * always matches what the front-end classic-theme route renders.
	 *
	 * Note: the body source itself preferences a saved customization, but
	 * `ensure_post_exists()` only runs when one doesn't already exist —
	 * so this resolves to the bundled (template-part-stripped) markup.
	 *
	 * @return string
	 */
	protected static function read_seed_content(): string {
		return Search_Blocks::get_classic_theme_search_body();
	}

	/**
	 * Subclass hook — copy for the editor-URL forbidden response.
	 *
	 * @return string
	 */
	protected static function forbidden_message(): string {
		return __( 'You do not have permission to customize the Search template.', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — copy for the editor-URL create-failure response.
	 *
	 * @return string
	 */
	protected static function create_failure_message(): string {
		return __( 'Could not create the Search template.', 'jetpack-search-pkg' );
	}
}
