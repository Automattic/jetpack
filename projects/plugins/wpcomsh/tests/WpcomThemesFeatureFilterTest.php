<?php
/**
 * Tests for the WordPress.com themes merged into core's Feature Filter results.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class WpcomThemesFeatureFilterTest.
 */
class WpcomThemesFeatureFilterTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Clean up.
	 *
	 * @return void
	 */
	public function tear_down() {
		remove_all_filters( 'pre_http_request' );
		parent::tear_down();
	}

	/**
	 * Only core's Feature Filter gets our themes merged in; the Marketplace tab's result is its own.
	 *
	 * @param array    $args     Themes API arguments.
	 * @param string[] $expected Slugs in the order the result lists them.
	 * @dataProvider provide_requests
	 */
	#[DataProvider( 'provide_requests' )]
	public function test_merges_our_themes_only_into_core_feature_filter( array $args, array $expected ) {
		add_filter(
			'pre_http_request',
			static function () {
				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => wp_json_encode(
						array(
							'body' => array(
								'themes' => array(
									array(
										'id'          => 'ours',
										'name'        => 'Ours',
										'author'      => 'Automattic',
										'description' => '',
										'version'     => '1.0',
										'screenshot'  => '',
										'demo_uri'    => 'https://example.com/',
										'block_theme' => true,
										'date_added'  => '2026-01-01',
										'taxonomies'  => array( 'theme_subject' => array( array( 'slug' => 'blog' ) ) ),
										'theme_tier'  => array( 'slug' => 'free' ),
									),
								),
							),
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			}
		);

		$result = wpcomsh_feature_filter_wpcom_themes_api_result(
			(object) array(
				'info'   => array(
					'page'    => 1,
					'results' => 1,
				),
				'themes' => array( (object) array( 'slug' => 'listed' ) ),
			),
			'query_themes',
			(object) $args
		);

		$this->assertSame( $expected, array_column( $result->themes, 'slug' ) );
	}

	/**
	 * Requests carrying tags, and the slugs each result ends up with.
	 *
	 * @return array<string, array{0: array, 1: string[]}>
	 */
	public static function provide_requests(): array {
		return array(
			"core's Feature Filter" => array( array( 'tag' => array( 'blog' ) ), array( 'ours', 'listed' ) ),
			'the Marketplace tab'   => array(
				array(
					'tag'    => array( 'blog' ),
					'browse' => 'wpcom',
				),
				array( 'listed' ),
			),
		);
	}
}
