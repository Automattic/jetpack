<?php
/**
 * Filter_Blog helper tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\TestCase;

/**
 * Tests for Filter_Blog helpers — option resolution, default label, and
 * config shape that backs the multisite radio filter block's SSR path.
 */
class Filter_Blog_Test extends TestCase {

	/**
	 * Reset the memoized options cache between tests so each test sees a
	 * fresh resolution of the `jetpack_instant_search_options` filter.
	 *
	 * @after
	 */
	#[After]
	public function reset_filter_blog_cache() {
		Filter_Blog::reset_options_cache();
		remove_all_filters( 'jetpack_instant_search_options' );
	}

	public function test_default_label_returns_blog() {
		$this->assertSame( 'Blog', Filter_Blog::default_label() );
	}

	public function test_get_options_returns_empty_when_no_labels_filter_is_registered() {
		$this->assertSame( array(), Filter_Blog::get_options() );
	}

	public function test_get_options_resolves_blogIdFilteringLabels_into_value_label_pairs() {
		add_filter(
			'jetpack_instant_search_options',
			static function ( $options ) {
				$options['blogIdFilteringLabels'] = array(
					1 => 'Main Site',
					2 => 'Design Blog',
					3 => 'News',
				);
				return $options;
			}
		);
		Filter_Blog::reset_options_cache();

		$options = Filter_Blog::get_options();

		// Sorted alphabetically by label so the radio order is stable
		// across requests regardless of insertion order in the labels map.
		$this->assertSame(
			array(
				array(
					'value' => '2',
					'label' => 'Design Blog',
				),
				array(
					'value' => '1',
					'label' => 'Main Site',
				),
				array(
					'value' => '3',
					'label' => 'News',
				),
			),
			$options
		);
	}

	public function test_get_options_skips_entries_with_empty_label() {
		add_filter(
			'jetpack_instant_search_options',
			static function ( $options ) {
				$options['blogIdFilteringLabels'] = array(
					1 => 'Main Site',
					2 => '',
					3 => 'News',
				);
				return $options;
			}
		);
		Filter_Blog::reset_options_cache();

		$options = Filter_Blog::get_options();

		$this->assertCount( 2, $options );
		$values = array_column( $options, 'value' );
		$this->assertNotContains( '2', $values );
	}

	public function test_get_options_sanitizes_labels_so_html_cannot_leak_into_the_radio_list() {
		add_filter(
			'jetpack_instant_search_options',
			static function ( $options ) {
				$options['blogIdFilteringLabels'] = array(
					1 => "  <b>Main</b>\nSite  ",
				);
				return $options;
			}
		);
		Filter_Blog::reset_options_cache();

		$options = Filter_Blog::get_options();

		$this->assertSame( 'Main Site', $options[0]['label'] );
	}

	public function test_build_config_carries_the_static_options_on_the_filter_config() {
		add_filter(
			'jetpack_instant_search_options',
			static function ( $options ) {
				$options['blogIdFilteringLabels'] = array(
					1 => 'Main Site',
					2 => 'Design Blog',
				);
				return $options;
			}
		);
		Filter_Blog::reset_options_cache();

		$config = Filter_Blog::build_config( array() );

		$this->assertSame( 'blog_ids', $config['filterKey'] );
		$this->assertSame( 'blog_id', $config['filterType'] );
		$this->assertSame( 'Blog', $config['label'] );
		$this->assertCount( 2, $config['options'] );
	}

	public function test_build_config_uses_explicit_label_when_provided() {
		$config = Filter_Blog::build_config( array( 'label' => 'Network site' ) );
		$this->assertSame( 'Network site', $config['label'] );
	}

	public function test_build_config_sanitizes_label() {
		$config = Filter_Blog::build_config( array( 'label' => "  <b>Site</b>\nname  " ) );
		$this->assertSame( 'Site name', $config['label'] );
	}
}
