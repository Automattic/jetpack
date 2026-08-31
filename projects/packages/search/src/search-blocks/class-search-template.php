<?php
/**
 * Singleton CPT + lifecycle for the classic-theme search template editor.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Theme-agnostic customization surface for the classic-theme search template
 * via post.php — the equivalent of the Site Editor entry block themes get.
 * Lifecycle lives on {@see Singleton_Template_Cpt}. Seed mirrors what
 * `Search_Blocks::get_classic_theme_search_body()` renders so the editor and
 * the front end stay in lockstep.
 */
class Search_Template extends Singleton_Template_Cpt {

	const POST_TYPE          = 'jp_search_template';
	const REST_BASE          = 'jetpack-search-template';
	const OPTION_POST_ID     = 'jetpack_search_template_post_id';
	const EDITOR_REQUEST_KEY = 'jetpack_search_open_template_editor';
	const EDITOR_NONCE       = 'jetpack_search_template_editor';
	const SEED_META_KEY      = '_jetpack_search_template_seeded_version';

	/**
	 * Subclass hook — CPT labels.
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
	 * Subclass hook — default post title.
	 *
	 * @return string
	 */
	protected static function post_title(): string {
		return __( 'Jetpack Search template', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — seed `post_content`. `ensure_post_exists()` only runs
	 * when no customization exists, so the body source resolves to the
	 * bundled (template-part-stripped) markup.
	 *
	 * @return string
	 */
	protected static function read_seed_content(): string {
		return Search_Blocks::get_classic_theme_search_body();
	}

	/**
	 * Subclass hook — forbidden-response copy.
	 *
	 * @return string
	 */
	protected static function forbidden_message(): string {
		return __( 'You do not have permission to customize the Search template.', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — create-failure copy.
	 *
	 * @return string
	 */
	protected static function create_failure_message(): string {
		return __( 'Could not create the Search template.', 'jetpack-search-pkg' );
	}
}
