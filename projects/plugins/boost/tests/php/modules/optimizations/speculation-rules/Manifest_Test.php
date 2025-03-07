<?php

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules\Manifest;
use Brain\Monkey;
use Mockery;
use PHPUnit\Framework\TestCase;

/**
 * @covers Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules\Manifest
 */
class Manifest_Test extends TestCase {
	protected $manifest;
	protected $cornerstone_mock;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Mock the Cornerstone_Utils class
		$this->cornerstone_mock = Mockery::mock( 'alias:' . Cornerstone_Utils::class );
		$this->cornerstone_mock->shouldReceive( 'get_list' )
			->andReturn( array( '/about', '/contact' ) );

		$this->manifest = new Manifest();
	}

	protected function tearDown(): void {
		Mockery::close();
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_manifest_has_required_sections() {
		$manifest = $this->manifest->get_manifest();

		$this->assertIsArray( $manifest, 'Manifest should be an array' );
		$this->assertArrayHasKey( 'prerender', $manifest, 'Manifest should have prerender rules' );
		$this->assertArrayHasKey( 'prefetch', $manifest, 'Manifest should have prefetch rules' );
		$this->assertNotEmpty( $manifest['prerender'], 'Prerender rules should not be empty' );
		$this->assertNotEmpty( $manifest['prefetch'], 'Prefetch rules should not be empty' );
	}

	public function test_prerender_includes_cornerstone_pages() {
		$manifest          = $this->manifest->get_manifest();
		$cornerstone_pages = array( '/about', '/contact' );

		$prerender_rules = $this->find_rules_matching_urls( $manifest['prerender'], $cornerstone_pages );
		$this->assertNotEmpty( $prerender_rules, 'Should have rules for cornerstone pages' );

		$rule = reset( $prerender_rules );
		$this->assertEquals( 'eager', $rule['eagerness'], 'Cornerstone pages should be eagerly prerendered' );
	}

	public function test_prerender_includes_pagination_selectors() {
		$manifest             = $this->manifest->get_manifest();
		$pagination_selectors = array(
			'.navigation .nav-links .next',
			'.wp-block-query-pagination-next',
		);

		$has_pagination_rule = false;
		foreach ( $manifest['prerender'] as $rule ) {
			if ( $this->rule_matches_selectors( $rule, $pagination_selectors ) ) {
				$has_pagination_rule = true;
				break;
			}
		}

		$this->assertTrue( $has_pagination_rule, 'Should have rules for pagination navigation' );
	}

	public function test_prefetch_excludes_special_selectors() {
		$manifest           = $this->manifest->get_manifest();
		$excluded_selectors = array(
			'a[rel~="nofollow"]',
			'.no-prefetch',
			'.no-prefetch *',
		);

		$has_exclusion_rule = false;
		foreach ( $manifest['prefetch'] as $rule ) {
			if ( $this->rule_excludes_selectors( $rule, $excluded_selectors ) ) {
				$has_exclusion_rule = true;
				break;
			}
		}

		$this->assertTrue( $has_exclusion_rule, 'Should exclude special selectors from prefetching' );
	}

	/**
	 * Helper method to find rules that match specific URLs
	 */
	private function find_rules_matching_urls( $rules, $urls ) {
		return array_filter(
			$rules,
			function ( $rule ) use ( $urls ) {
				if ( ! isset( $rule['where'] ) ) {
					return false;
				}
				foreach ( $this->get_all_matching_keys( $rule['where'], 'href_matches' ) as $pattern ) {
					if ( in_array( $pattern, $urls, true ) ) {
						return true;
					}
				}
				return false;
			}
		);
	}

	/**
	 * Helper method to check if a rule matches specific selectors
	 */
	private function rule_matches_selectors( $rule, $selectors ) {
		if ( ! isset( $rule['where'] ) ) {
			return false;
		}
		foreach ( $this->get_all_matching_keys( $rule['where'], 'selector_matches' ) as $rule_selector ) {
			if ( in_array( $rule_selector, $selectors, true ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Helper method to check if a rule excludes specific selectors
	 */
	private function rule_excludes_selectors( $rule, $selectors ) {
		if ( ! isset( $rule['where']['and'] ) ) {
			return false;
		}
		foreach ( $rule['where']['and'] as $condition ) {
			if ( isset( $condition['not']['selector_matches'] ) ) {
				$excluded = $condition['not']['selector_matches'];
				foreach ( $selectors as $selector ) {
					if ( in_array( $selector, $excluded, true ) ) {
						return true;
					}
				}
			}
		}
		return false;
	}

	/**
	 * Helper method to recursively get all matching keys from a rule condition
	 */
	private function get_all_matching_keys( $condition, $key ) {
		$matches = array();
		if ( isset( $condition[ $key ] ) ) {
			$matches = array_merge( $matches, (array) $condition[ $key ] );
		}
		foreach ( $condition as $_index => $value ) {
			if ( is_array( $value ) ) {
				$matches = array_merge( $matches, $this->get_all_matching_keys( $value, $key ) );
			}
		}
		return $matches;
	}
}
