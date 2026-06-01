<?php
/**
 * Singleton CPT + lifecycle for the classic-theme product-search template editor.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Theme-agnostic customization surface for the classic-theme product-search
 * template via post.php — the WooCommerce-product counterpart of
 * {@see Search_Template}. Lifecycle lives on {@see Singleton_Template_Cpt}.
 * Seed mirrors what `Search_Blocks::get_classic_theme_product_search_body()`
 * renders so the editor and the front end stay in lockstep.
 */
class Product_Search_Template extends Singleton_Template_Cpt {

	const POST_TYPE          = 'jp_product_search';
	const REST_BASE          = 'jetpack-product-search-template';
	const OPTION_POST_ID     = 'jetpack_product_search_template_post_id';
	const EDITOR_REQUEST_KEY = 'jetpack_search_open_product_template_editor';
	const EDITOR_NONCE       = 'jetpack_search_product_template_editor';
	const SEED_META_KEY      = '_jetpack_product_search_template_seeded_version';

	/**
	 * Subclass hook — CPT labels.
	 *
	 * @return array{name:string,singular_name:string}
	 */
	protected static function labels(): array {
		return array(
			'name'          => __( 'Product search template', 'jetpack-search-pkg' ),
			'singular_name' => __( 'Product search template', 'jetpack-search-pkg' ),
		);
	}

	/**
	 * Subclass hook — default post title.
	 *
	 * @return string
	 */
	protected static function post_title(): string {
		return __( 'Jetpack Search product template', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — seed `post_content`. `ensure_post_exists()` only runs
	 * when no customization exists, so the body source resolves to the
	 * bundled (template-part-stripped) markup.
	 *
	 * @return string
	 */
	protected static function read_seed_content(): string {
		return Search_Blocks::get_classic_theme_product_search_body();
	}

	/**
	 * Subclass hook — forbidden-response copy.
	 *
	 * @return string
	 */
	protected static function forbidden_message(): string {
		return __( 'You do not have permission to customize the product search template.', 'jetpack-search-pkg' );
	}

	/**
	 * Subclass hook — create-failure copy.
	 *
	 * @return string
	 */
	protected static function create_failure_message(): string {
		return __( 'Could not create the product search template.', 'jetpack-search-pkg' );
	}
}
