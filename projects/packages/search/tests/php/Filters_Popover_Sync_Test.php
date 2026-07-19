<?php

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for Search_Blocks::sync_filters_popover_content() and its
 * integration through Overlay_Template::get_customized_content() —
 * SEARCH-307's "keep the two blocks in sync" fix.
 *
 * @package automattic/jetpack-search
 */
class Filters_Popover_Sync_Test extends Search_TestCase {

	const SIDEBAR_FILTERS = '<!-- wp:jetpack-search/filters -->' .
		'<!-- wp:jetpack-search/active-filters /-->' .
		'<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"category","label":"Limit results to"} /-->' .
		'<!-- /wp:jetpack-search/filters -->';

	const STALE_POPOVER = '<!-- wp:jetpack-search/filters-popover -->' .
		'<!-- wp:jetpack-search/active-filters /-->' .
		'<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"category"} /-->' .
		'<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"post_tag"} /-->' .
		'<!-- wp:jetpack-search/filter-checkbox {"filterType":"post_type"} /-->' .
		'<!-- /wp:jetpack-search/filters-popover -->';

	public function setUp(): void {
		parent::setUp();
		Overlay_Template::register_post_type();
		Overlay_Template::reset_customized_content_cache();
		delete_option( Overlay_Template::OPTION_POST_ID );
		Search_Blocks::reset_overlay_template_content_cache();
	}

	public function tearDown(): void {
		$post_id = (int) get_option( Overlay_Template::OPTION_POST_ID, 0 );
		if ( $post_id ) {
			wp_delete_post( $post_id, true );
		}
		delete_option( Overlay_Template::OPTION_POST_ID );
		Overlay_Template::reset_customized_content_cache();
		Search_Blocks::reset_overlay_template_content_cache();
		parent::tearDown();
	}

	/**
	 * The popover's stale/diverged filters (missing the label override,
	 * carrying filters the sidebar no longer has) normalize to exactly what
	 * the sidebar block currently contains.
	 */
	public function test_popover_normalizes_to_sidebar_filters() {
		$content = static::wrap_columns( static::SIDEBAR_FILTERS, static::STALE_POPOVER );

		$synced = Search_Blocks::sync_filters_popover_content( $content );

		$this->assertStringContainsString(
			'"label":"Limit results to"',
			$synced,
			'Custom label from the sidebar block must carry over to the popover.'
		);
		$this->assertStringNotContainsString(
			'"taxonomy":"post_tag"',
			$synced,
			'A filter removed from the sidebar must no longer appear in the popover.'
		);
		$this->assertStringNotContainsString(
			'"filterType":"post_type"',
			$synced,
			'A filter removed from the sidebar must no longer appear in the popover.'
		);
	}

	/**
	 * `jetpack-search/filters-product` (the WooCommerce sidebar variant) is
	 * recognized as a source of truth too.
	 */
	public function test_recognizes_filters_product_as_source() {
		$product_filters = '<!-- wp:jetpack-search/filters-product -->' .
			'<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"product_cat","label":"Product category"} /-->' .
			'<!-- /wp:jetpack-search/filters-product -->';
		$content         = static::wrap_columns( $product_filters, static::STALE_POPOVER );

		$synced = Search_Blocks::sync_filters_popover_content( $content );

		$this->assertStringContainsString( '"label":"Product category"', $synced );
	}

	/**
	 * Content with no source block (sidebar filters absent) is returned
	 * unchanged — nothing to mirror.
	 */
	public function test_no_op_when_source_block_absent() {
		$content = '<!-- wp:group -->' . static::STALE_POPOVER . '<!-- /wp:group -->';

		$this->assertSame( $content, Search_Blocks::sync_filters_popover_content( $content ) );
	}

	/**
	 * Content with no popover block at all is returned unchanged — the
	 * cheap `strpos()` guard should skip the parse/serialize round trip
	 * entirely, so unrelated content is never touched.
	 */
	public function test_no_op_when_popover_block_absent() {
		$content = '<!-- wp:paragraph --><p>SENTINEL_CONTENT</p><!-- /wp:paragraph -->';

		$this->assertSame( $content, Search_Blocks::sync_filters_popover_content( $content ) );
	}

	/**
	 * A saved Overlay_Template customization with diverged filters-popover
	 * content comes back synced through get_customized_content() — the
	 * frontend-render + classic-theme-body path.
	 */
	public function test_overlay_template_customization_is_synced_on_read() {
		// Block-comment JSON attrs need `unfiltered_html` to survive
		// wp_insert_post()'s KSES pass — matches the real editing flow,
		// which is admin-only (see Singleton_Template_Cpt's capabilities map).
		wp_set_current_user( $this->admin_id );
		$content = static::wrap_columns( static::SIDEBAR_FILTERS, static::STALE_POPOVER );
		$post_id = wp_insert_post(
			array(
				'post_type'    => Overlay_Template::POST_TYPE,
				'post_status'  => 'publish',
				'post_title'   => 'Overlay Template Test',
				'post_content' => $content,
			)
		);
		update_option( Overlay_Template::OPTION_POST_ID, $post_id );
		Overlay_Template::reset_customized_content_cache();

		$synced = Overlay_Template::get_customized_content();
		$this->assertNotNull( $synced );
		$synced = (string) $synced;

		$this->assertStringContainsString( '"label":"Limit results to"', $synced );
		$this->assertStringNotContainsString( '"taxonomy":"post_tag"', $synced );
	}

	/**
	 * The REST filter is what the Site Editor's load actually goes through
	 * (bypassing get_customized_content() entirely) — covers that path
	 * directly rather than only through the singleton-CPT read path above.
	 */
	public function test_rest_response_sync_normalizes_content_raw() {
		$content  = static::wrap_columns( static::SIDEBAR_FILTERS, static::STALE_POPOVER );
		$response = new \WP_REST_Response( array( 'content' => array( 'raw' => $content ) ) );

		$synced = Overlay_Template::sync_filters_popover_in_rest_response( $response );

		$this->assertStringContainsString( '"label":"Limit results to"', $synced->data['content']['raw'] );
		$this->assertStringNotContainsString( '"taxonomy":"post_tag"', $synced->data['content']['raw'] );
	}

	/**
	 * Guards the no-op path at the Singleton_Template_Cpt layer too: a
	 * customization with no filters-popover block round-trips byte-for-byte,
	 * matching Search_Template_Test::test_customized_state_returns_post_content().
	 */
	public function test_unrelated_customization_round_trips_unchanged() {
		$content = '<!-- wp:paragraph --><p>SENTINEL_CONTENT</p><!-- /wp:paragraph -->';
		$post_id = wp_insert_post(
			array(
				'post_type'    => Overlay_Template::POST_TYPE,
				'post_status'  => 'publish',
				'post_title'   => 'Overlay Template Test',
				'post_content' => $content,
			)
		);
		update_option( Overlay_Template::OPTION_POST_ID, $post_id );
		Overlay_Template::reset_customized_content_cache();

		$this->assertSame( $content, Overlay_Template::get_customized_content() );
	}

	/**
	 * @param string $sidebar Sidebar filters block markup.
	 * @param string $popover Popover block markup.
	 * @return string Minimal columns wrapper placing both side by side, matching the bundled templates' shape.
	 */
	protected static function wrap_columns( string $sidebar, string $popover ): string {
		return '<!-- wp:columns -->' . $popover . $sidebar . '<!-- /wp:columns -->';
	}
}
