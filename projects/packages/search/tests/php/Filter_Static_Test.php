<?php
/**
 * Filter_Static helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Tests for the Filter_Static helpers that back the
 * `jetpack-search/filter-static` block.
 */
class Filter_Static_Test extends Search_TestCase {

	/**
	 * Reset the per-request memo before each test so registrations from a
	 * prior case don't leak into the next.
	 */
	public function setUp(): void {
		parent::setUp();
		Filter_Static::reset_cache_for_testing();
		$_GET = array();
	}

	/**
	 * Tear down: drop every filter we may have registered. Each test calls
	 * `add_filter()` inline, so the safest cleanup is to walk the two hooks
	 * Filter_Static reads.
	 */
	public function tearDown(): void {
		remove_all_filters( 'jetpack_search_static_filters' );
		remove_all_filters( 'jetpack_instant_search_options' );
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		$_GET = array();
		Filter_Static::reset_cache_for_testing();
		parent::tearDown();
	}

	/**
	 * The sibling `jetpack_search_static_filters` hook is the canonical
	 * blocks-only registration surface. Entries flow straight through after
	 * normalization.
	 */
	public function test_get_static_filters_config_reads_search_static_filters_hook() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'section',
						'name'      => 'Section',
						'values'    => array(
							array(
								'name'  => 'News',
								'value' => 'news',
							),
						),
					),
				);
			}
		);

		$configs = Filter_Static::get_static_filters_config();

		$this->assertCount( 1, $configs );
		$this->assertSame( 'section', $configs[0]['filter_id'] );
		$this->assertSame( 'Section', $configs[0]['name'] );
		$this->assertSame( 'group', $configs[0]['type'] );
		// Variation defaults to 'sidebar' when unset on the entry.
		$this->assertSame( 'sidebar', $configs[0]['variation'] );
		$this->assertSame( 'news', $configs[0]['values'][0]['value'] );
	}

	/**
	 * Sites that registered static filters for the legacy instant-search
	 * overlay via `jetpack_instant_search_options` should get the blocks for
	 * free — Filter_Static must pick the same payload up without a second
	 * registration.
	 */
	public function test_get_static_filters_config_reads_legacy_instant_search_options_hook() {
		add_filter(
			'jetpack_instant_search_options',
			static function ( $options ) {
				$options['staticFilters'] = array(
					array(
						'filter_id' => 'section',
						'name'      => 'Section',
						'variation' => 'tabbed',
						'values'    => array(
							array(
								'name'  => 'News',
								'value' => 'news',
							),
						),
					),
				);
				return $options;
			}
		);

		$configs = Filter_Static::get_static_filters_config();

		$this->assertCount( 1, $configs );
		$this->assertSame( 'section', $configs[0]['filter_id'] );
		$this->assertSame( 'tabbed', $configs[0]['variation'] );
	}

	/**
	 * Result is memoised per request — re-registering after the first read
	 * shouldn't change subsequent reads until the cache is reset.
	 */
	public function test_get_static_filters_config_memoises_per_request() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'a',
						'name'      => 'A',
						'values'    => array(
							array(
								'name'  => 'One',
								'value' => 'one',
							),
						),
					),
				);
			}
		);
		$first = Filter_Static::get_static_filters_config();

		// Re-register so the underlying hook returns a different list. The
		// memoised first read should still win.
		remove_all_filters( 'jetpack_search_static_filters' );
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array();
			}
		);

		$second = Filter_Static::get_static_filters_config();
		$this->assertSame( $first, $second );
	}

	/**
	 * Entries whose `filter_id` collides with a reserved query param (`s`,
	 * `q`, `orderby`, `min_price`, `max_price`) round-trip through
	 * `parse_url_filters()` as something other than a filter and would
	 * silently fail. Reject them upfront so misconfiguration is visible.
	 */
	public function test_normalize_entry_rejects_reserved_filter_id() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 's',
						'name'      => 'Search hijack',
						'values'    => array(
							array(
								'name'  => 'One',
								'value' => 'one',
							),
						),
					),
					array(
						'filter_id' => 'orderby',
						'name'      => 'Sort hijack',
						'values'    => array(
							array(
								'name'  => 'One',
								'value' => 'one',
							),
						),
					),
				);
			}
		);

		$this->assertSame( array(), Filter_Static::get_static_filters_config() );
	}

	/**
	 * An entry with no usable values would render an empty fieldset. Drop it
	 * so render.php has nothing to emit rather than a labeled empty list.
	 */
	public function test_normalize_entry_rejects_empty_values() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'section',
						'name'      => 'Section',
						'values'    => array(),
					),
					array(
						'filter_id' => 'topic',
						'name'      => 'Topic',
						'values'    => 'not-an-array',
					),
				);
			}
		);

		$this->assertSame( array(), Filter_Static::get_static_filters_config() );
	}

	/**
	 * Values missing a `value` field are filtered out, and a missing display
	 * `name` falls back to the value. An entry left with no usable values
	 * after this is rejected.
	 */
	public function test_normalize_entry_sanitises_individual_values() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'section',
						'name'      => 'Section',
						'values'    => array(
							array(
								'name'  => 'News',
								'value' => 'news',
							),
							// Missing value — dropped.
							array( 'name' => 'Orphan' ),
							// Missing name — falls back to the value.
							array( 'value' => 'guides' ),
							// Not an array — skipped.
							'garbage',
						),
					),
				);
			}
		);

		$values = Filter_Static::get_static_filters_config()[0]['values'];
		$this->assertSame(
			array(
				array(
					'value' => 'news',
					'name'  => 'News',
				),
				array(
					'value' => 'guides',
					'name'  => 'guides',
				),
			),
			$values
		);
	}

	/**
	 * Two entries with the same `filter_id` create an ambiguous URL contract
	 * (which radio set owns `?section=...`?). Adopt the last write so the
	 * behaviour mirrors PHP `apply_filters` semantics, and surface the
	 * collision via `_doing_it_wrong()` so abuse is visible in debug.
	 */
	public function test_get_static_filters_config_dedupes_last_wins_on_duplicate_filter_id() {
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'section',
						'name'      => 'First registration',
						'values'    => array(
							array(
								'name'  => 'One',
								'value' => 'one',
							),
						),
					),
					array(
						'filter_id' => 'section',
						'name'      => 'Second registration',
						'values'    => array(
							array(
								'name'  => 'Two',
								'value' => 'two',
							),
						),
					),
				);
			}
		);

		$configs = Filter_Static::get_static_filters_config();
		$this->assertCount( 1, $configs );
		$this->assertSame( 'Second registration', $configs[0]['name'] );
		$this->assertSame( 'two', $configs[0]['values'][0]['value'] );
	}

	/**
	 * `filters_for_variation` returns only entries whose `variation` matches.
	 * Defaults coerce 'sidebar' so an entry with the field unset shows under
	 * the sidebar variation and not the tabbed one.
	 */
	public function test_filters_for_variation_scopes_by_variation() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'section',
						'name'      => 'Section',
						// Variation omitted — defaults to sidebar.
						'values'    => array(
							array(
								'name'  => 'A',
								'value' => 'a',
							),
						),
					),
					array(
						'filter_id' => 'audience',
						'name'      => 'Audience',
						'variation' => 'tabbed',
						'values'    => array(
							array(
								'name'  => 'B',
								'value' => 'b',
							),
						),
					),
				);
			}
		);

		$this->assertCount( 1, Filter_Static::filters_for_variation( 'sidebar' ) );
		$this->assertSame( 'section', Filter_Static::filters_for_variation( 'sidebar' )[0]['filter_id'] );

		$this->assertCount( 1, Filter_Static::filters_for_variation( 'tabbed' ) );
		$this->assertSame( 'audience', Filter_Static::filters_for_variation( 'tabbed' )[0]['filter_id'] );
	}

	/**
	 * When the block scopes to a specific `filter_id`, only that one entry
	 * (intersected with the variation) is returned.
	 */
	public function test_filters_for_variation_filters_by_specific_filter_id() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'section',
						'name'      => 'Section',
						'values'    => array(
							array(
								'name'  => 'A',
								'value' => 'a',
							),
						),
					),
					array(
						'filter_id' => 'topic',
						'name'      => 'Topic',
						'values'    => array(
							array(
								'name'  => 'B',
								'value' => 'b',
							),
						),
					),
				);
			}
		);

		$narrowed = Filter_Static::filters_for_variation( 'sidebar', 'topic' );
		$this->assertCount( 1, $narrowed );
		$this->assertSame( 'topic', $narrowed[0]['filter_id'] );
	}

	/**
	 * Anything other than the literal string 'tabbed' collapses to 'sidebar',
	 * matching `getAvailableStaticFilters()` on the JS side.
	 */
	public function test_normalize_variation_defaults_to_sidebar() {
		$this->assertSame( 'tabbed', Filter_Static::normalize_variation( 'tabbed' ) );
		$this->assertSame( 'sidebar', Filter_Static::normalize_variation( 'sidebar' ) );
		$this->assertSame( 'sidebar', Filter_Static::normalize_variation( '' ) );
		$this->assertSame( 'sidebar', Filter_Static::normalize_variation( 'garbage' ) );
		$this->assertSame( 'sidebar', Filter_Static::normalize_variation( null ) );
	}

	/**
	 * `build_config` produces the filterConfig entry that render.php pushes
	 * into the shared Interactivity state. The `kind => 'static'` marker is
	 * what the JS store keys off to decide URL serialization (scalar vs
	 * array shape) — locking it down here prevents silent drift between PHP
	 * and JS contracts.
	 */
	public function test_build_config_shape() {
		$entry = array(
			'filter_id' => 'section',
			'name'      => 'Section',
			'type'      => 'group',
			'variation' => 'sidebar',
			'selected'  => 'news',
			'values'    => array(
				array(
					'value' => 'news',
					'name'  => 'News',
				),
			),
		);

		$config = Filter_Static::build_config( $entry, array() );

		$this->assertSame( 'section', $config['filterKey'] );
		$this->assertSame( 'static', $config['kind'] );
		$this->assertSame( 'static', $config['filterType'] );
		$this->assertSame( 'Section', $config['label'] );
		$this->assertSame( 'news', $config['selected'] );
		$this->assertSame( 'sidebar', $config['variation'] );
		$this->assertSame(
			array(
				array(
					'value' => 'news',
					'name'  => 'News',
				),
			),
			$config['values']
		);
	}

	/**
	 * The block's `label` attribute overrides the server-supplied `name`.
	 * Empty falls back so a site that never set the override sees the
	 * registered display name.
	 */
	public function test_derive_label_attribute_override_beats_server_name() {
		$entry = array(
			'filter_id' => 'section',
			'name'      => 'Section',
			'values'    => array(),
		);

		$this->assertSame(
			'Custom Heading',
			Filter_Static::derive_label( $entry, array( 'label' => 'Custom Heading' ) )
		);
		$this->assertSame( 'Section', Filter_Static::derive_label( $entry, array( 'label' => '' ) ) );
		$this->assertSame( 'Section', Filter_Static::derive_label( $entry, array() ) );
	}

	/**
	 * `parse_url_selections` pulls scalar `?filter_id=value` URL params into a
	 * `{ filter_id => value }` map. Only keys that match a configured static
	 * filter get through — arbitrary scalar params from other plugins never
	 * reach `staticFilterSelections`.
	 */
	public function test_parse_url_selections_pulls_only_configured_keys() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'section',
						'name'      => 'Section',
						'values'    => array(
							array(
								'name'  => 'News',
								'value' => 'news',
							),
						),
					),
				);
			}
		);
		$_GET = array(
			'section'   => 'news',
			'unrelated' => 'ignored',
			's'         => 'search query',
		);

		$this->assertSame( array( 'section' => 'news' ), Filter_Static::parse_url_selections() );
	}

	/**
	 * Array-shaped params under a static-filter key are misuse (the URL
	 * contract for static filters is scalar). Drop them rather than guess
	 * which array element to use.
	 */
	public function test_parse_url_selections_skips_array_shaped_values() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'section',
						'name'      => 'Section',
						'values'    => array(
							array(
								'name'  => 'News',
								'value' => 'news',
							),
						),
					),
				);
			}
		);
		$_GET = array( 'section' => array( 'news', 'guides' ) );

		$this->assertSame( array(), Filter_Static::parse_url_selections() );
	}

	/**
	 * Empty-string values mean "no selection" — drop them so the gate stays
	 * empty rather than seeding an empty string into staticFilterSelections.
	 */
	public function test_parse_url_selections_drops_empty_strings() {
		add_filter(
			'jetpack_search_static_filters',
			static function () {
				return array(
					array(
						'filter_id' => 'section',
						'name'      => 'Section',
						'values'    => array(
							array(
								'name'  => 'News',
								'value' => 'news',
							),
						),
					),
				);
			}
		);
		$_GET = array( 'section' => '' );

		$this->assertSame( array(), Filter_Static::parse_url_selections() );
	}

	/**
	 * The new `jetpack_search_static_filters` hook receives whatever the legacy
	 * `jetpack_instant_search_options.staticFilters` produced as its initial
	 * value, so callbacks on the new hook can see, override, or extend a
	 * site's legacy static-filter registration. This is the integration
	 * point sites would use to migrate without dropping the existing overlay.
	 */
	public function test_new_hook_receives_legacy_payload_as_input() {
		add_filter(
			'jetpack_instant_search_options',
			static function ( $options ) {
				$options['staticFilters'] = array(
					array(
						'filter_id' => 'section',
						'name'      => 'Legacy section',
						'values'    => array(
							array(
								'name'  => 'A',
								'value' => 'a',
							),
						),
					),
				);
				return $options;
			}
		);
		// Override the same filter_id on the new hook — last-wins semantics
		// mean the new hook's entry replaces the legacy one.
		add_filter(
			'jetpack_search_static_filters',
			static function ( $list ) {
				// The list passed in MUST contain the legacy entry.
				if ( ! is_array( $list ) || count( $list ) !== 1 || ( $list[0]['filter_id'] ?? '' ) !== 'section' ) {
					return $list;
				}
				$list[] = array(
					'filter_id' => 'section',
					'name'      => 'Blocks-side override',
					'values'    => array(
						array(
							'name'  => 'B',
							'value' => 'b',
						),
					),
				);
				return $list;
			}
		);
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );

		$configs = Filter_Static::get_static_filters_config();
		$this->assertCount( 1, $configs );
		$this->assertSame( 'Blocks-side override', $configs[0]['name'] );
		$this->assertSame( 'b', $configs[0]['values'][0]['value'] );
	}
}
