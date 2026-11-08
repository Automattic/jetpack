<?php
/**
 * Tests for the WordPress.com themes merged into core's theme search.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class WpcomThemesSearchTest.
 */
class WpcomThemesSearchTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A search, with WordPress.org listing a theme WordPress.com also matched.
	 *
	 * @param bool          $prefer_wporg Whether the site's search leaves shared themes to WordPress.org.
	 * @param string[]|null $wporg_slugs  What the lookup answers, null when WordPress.org could not be asked.
	 * @param string[]      $expected     Slugs in the order the search shows them.
	 * @param bool          $ours_shown   Whether the shared theme shows as our copy.
	 * @dataProvider provide_shared_themes
	 */
	#[DataProvider( 'provide_shared_themes' )]
	public function test_a_theme_both_list_shows_once( bool $prefer_wporg, ?array $wporg_slugs, array $expected, bool $ours_shown ) {
		// Loads the service and merger, which only their factory requires.
		wpcomsh_get_wpcom_themes_service_instance();

		$api = new class( $wporg_slugs ) extends WPCom_Themes_Api {
			/**
			 * What fetch_wporg_slugs() answers.
			 *
			 * @var string[]|null
			 */
			private $wporg_slugs;

			/**
			 * Class constructor.
			 *
			 * @param string[]|null $wporg_slugs What fetch_wporg_slugs() answers.
			 */
			public function __construct( ?array $wporg_slugs ) {
				parent::__construct( new WPCom_Themes_Cache() );
				$this->wporg_slugs = $wporg_slugs;
			}

			/**
			 * Two free themes, as WordPress.com returns them.
			 *
			 * @param string $search Search term.
			 * @return array<stdClass>
			 */
			public function search_themes( string $search ): array {
				unset( $search );

				return array_map(
					fn( $slug ) => (object) array(
						'id'          => $slug,
						'name'        => $slug,
						'author'      => 'Automattic',
						'description' => '',
						'version'     => '1.0',
						'screenshot'  => '',
						'demo_uri'    => 'https://example.com/',
						'block_theme' => true,
						'date_added'  => '2026-01-01',
						'taxonomies'  => (object) array(),
						'theme_tier'  => (object) array( 'slug' => 'free' ),
					),
					array( 'ours-only', 'on-both' )
				);
			}

			/**
			 * The slugs WordPress.org lists.
			 *
			 * @param string[] $slugs Theme slugs.
			 * @return string[]|null
			 */
			public function fetch_wporg_slugs( array $slugs ): ?array {
				return null === $this->wporg_slugs ? null : array_values( array_intersect( $slugs, $this->wporg_slugs ) );
			}
		};

		$service = new WPCom_Themes_Service( $api, new WPCom_Themes_Mapper(), new WPCom_Themes_Merger() );
		$result  = $service->filter_themes_api_result_search(
			(object) array(
				'info'   => array(
					'page'    => 1,
					'pages'   => 1,
					'results' => 2,
				),
				'themes' => array(
					(object) array( 'slug' => 'theirs-only' ),
					(object) array( 'slug' => 'on-both' ),
				),
			),
			'any',
			$prefer_wporg
		);

		$this->assertSame( $expected, array_column( $result->themes, 'slug' ) );
		$this->assertSame( count( $expected ), $result->info['results'] );

		$shared = $result->themes[ array_search( 'on-both', $expected, true ) ];
		$this->assertSame( $ours_shown, ! empty( $shared->is_wpcom_theme ) );
	}

	/**
	 * Whether search prefers WordPress.org, what the lookup answers, and what the search shows.
	 *
	 * @return array<string, array{0: bool, 1: string[]|null, 2: string[], 3: bool}>
	 */
	public static function provide_shared_themes(): array {
		return array(
			'WordPress.org preferred'          => array( true, array( 'on-both' ), array( 'ours-only', 'theirs-only', 'on-both' ), false ),
			'ours preferred, as before'        => array( false, array( 'on-both' ), array( 'ours-only', 'on-both', 'theirs-only' ), true ),
			'WordPress.org could not be asked' => array( true, null, array( 'ours-only', 'on-both', 'theirs-only' ), true ),
		);
	}
}
