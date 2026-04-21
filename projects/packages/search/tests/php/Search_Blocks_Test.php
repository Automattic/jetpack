<?php
/**
 * Search_Blocks class tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the Search_Blocks registration class.
 */
class Search_Blocks_Test extends TestCase {

	/**
	 * Verify that the keys required by the Interactivity API store are present.
	 */
	public function test_build_initial_state_shape() {
		$required_keys = array(
			'siteId',
			'apiRoot',
			'nonce',
			'isPrivateSite',
			'isWpcom',
			'homeUrl',
			'searchQuery',
			'sortOrder',
			'results',
			'totalResults',
			'pageHandle',
			'isLoading',
			'isLoadingMore',
			'hasError',
		);

		$this->assertTrue( class_exists( Search_Blocks::class ) );
		$state = Search_Blocks::build_initial_state();
		foreach ( $required_keys as $key ) {
			$this->assertArrayHasKey( $key, $state, "Missing key: $key" );
		}
	}

	/**
	 * `orderby=date` in the URL must seed sortOrder so SSR pre-fetches the
	 * correct ordering.
	 */
	public function test_build_initial_state_seeds_sort_order_from_url() {
		$original_get = $_GET;
		$_GET         = array( 'orderby' => 'date' );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'date', $state['sortOrder'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * Unrecognized `orderby` values must fall back to the default `relevance`
	 * sort, not propagate into the Elasticsearch query.
	 */
	public function test_build_initial_state_rejects_unknown_sort_order() {
		$original_get = $_GET;
		$_GET         = array( 'orderby' => 'drop-tables' );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'relevance', $state['sortOrder'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * `normalize_result()` is the PHP equivalent of the client-side normalizer
	 * and is the single point where upstream URLs are sanitized before being
	 * rendered. Reject any scheme other than http/https so a compromised
	 * upstream cannot smuggle a `javascript:` URL into an href.
	 */
	public function test_normalize_result_rejects_non_http_scheme() {
		$normalized = Search_Blocks::normalize_result(
			array(
				'fields' => array(
					'permalink.url.raw' => 'javascript:alert(1)',
					'title.default'     => 'Evil',
				),
			)
		);
		$this->assertSame( '', $normalized['permalink'] );
	}

	/**
	 * Hostless URLs like `example.com/foo/` (which v1.3 occasionally emits)
	 * should be promoted to https so the href is usable.
	 */
	public function test_normalize_result_promotes_hostless_url_to_https() {
		$normalized = Search_Blocks::normalize_result(
			array(
				'fields' => array(
					'permalink.url.raw' => 'example.com/foo/',
					'title.default'     => 'Post',
				),
			)
		);
		$this->assertStringStartsWith( 'https://example.com/foo', $normalized['permalink'] );
	}

	/**
	 * The highlighted title arrives wrapped in `<mark>` tags. Since the
	 * template renders via `data-wp-text` (textContent), the tags must be
	 * stripped or they'll show as literal `<mark>` strings on the page.
	 */
	public function test_normalize_result_strips_mark_tags_from_highlight_title() {
		$normalized = Search_Blocks::normalize_result(
			array(
				'fields'    => array(
					'permalink.url.raw' => 'https://example.com/post/',
					'title.default'     => 'Plain title',
				),
				'highlight' => array(
					'title' => array( 'Winter <mark>boots</mark> on sale' ),
				),
			)
		);
		$this->assertSame( 'Winter boots on sale', $normalized['title'] );
	}
}
