<?php
/**
 * Tests for the AI Hub's skill catalog fetcher.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-skills-catalog.php';

/**
 * Class Jetpack_AI_Skills_Catalog_Test
 *
 * @covers \Jetpack_AI_Skills_Catalog
 */
#[CoversClass( Jetpack_AI_Skills_Catalog::class )]
class Jetpack_AI_Skills_Catalog_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * URLs requested through the stub.
	 *
	 * @var string[]
	 */
	private $requests = array();

	/**
	 * Responses by route, as decoded JSON, or a WP_Error to fail.
	 *
	 * @var array
	 */
	private $responses = array();

	/**
	 * Stub the catalog's HTTP API.
	 */
	public function set_up() {
		parent::set_up();
		$this->requests  = array();
		$this->responses = array(
			'/posts'      => array(
				array(
					'slug'       => 'site-seo-audit',
					'title'      => array( 'rendered' => 'Site SEO and AIO&nbsp;audit' ),
					'excerpt'    => array( 'rendered' => "<p>Use when someone asks about SEO, e.g. rankings. Audits the site&#8217;s titles.</p>\n" ),
					'categories' => array( 1958, 54 ),
					'meta'       => array(
						'agent_skill_prerequisites' => 'Editor role.',
						'agent_skill_try_prompt'    => 'Run the audit on example.com',
					),
				),
				array(
					'slug'       => 'elsewhere',
					'title'      => array( 'rendered' => 'Linked elsewhere' ),
					'categories' => array( 54 ),
				),
				array(
					'slug'  => '',
					'title' => array( 'rendered' => 'No slug' ),
				),
			),
			'/categories' => array(
				array(
					'id'   => 54,
					'slug' => 'general',
					'name' => 'General',
				),
				array(
					'id'   => 175,
					'slug' => 'marketing',
					'name' => 'Marketing',
				),
				array(
					'id'   => 1958,
					'slug' => 'seo',
					'name' => 'SEO',
				),
			),
		);
		add_filter( 'pre_http_request', array( $this, 'stub_http' ), 10, 3 );
	}

	/**
	 * Remove the stub and the cache.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'stub_http' ), 10 );
		Constants::clear_constants();
		delete_transient( Jetpack_AI_Skills_Catalog::INDEX_TRANSIENT );
		delete_transient( Jetpack_AI_Skills_Catalog::BODY_TRANSIENT_PREFIX . 'site-seo-audit' );
		parent::tear_down();
	}

	/**
	 * Answer catalog requests from $this->responses.
	 *
	 * @param false|array $pre  Short-circuit value.
	 * @param array       $args Request args.
	 * @param string      $url  Request URL.
	 * @return array|WP_Error
	 */
	public function stub_http( $pre, $args, $url ) {
		$this->requests[] = $url;
		$route            = substr( (string) wp_parse_url( $url, PHP_URL_PATH ), strlen( '/wp/v2/sites/agentskills.wordpress.com' ) );
		$response         = $this->responses[ $route ] ?? new WP_Error( 'http_request_failed', 'Not stubbed' );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		return array(
			'headers'  => array(),
			'body'     => wp_json_encode( $response, JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
		);
	}

	/**
	 * The index drops bodies, decodes text, and keeps only used categories.
	 */
	public function test_index_is_normalized() {
		$index = Jetpack_AI_Skills_Catalog::get_index();

		$this->assertSame( array( 'site-seo-audit', 'elsewhere' ), wp_list_pluck( $index['skills'], 'slug' ) );
		$this->assertSame(
			array(
				'slug'          => 'site-seo-audit',
				'title'         => "Site SEO and AIO\u{00A0}audit",
				'description'   => 'Use when someone asks about SEO, e.g. rankings. Audits the site’s titles.',
				'summary'       => 'Use when someone asks about SEO, e.g. rankings.',
				'prerequisites' => 'Editor role.',
				'tryPrompt'     => 'Run the audit on example.com',
				'categories'    => array( 'seo', 'general' ),
			),
			$index['skills'][0]
		);
		$this->assertSame( array( 'general', 'seo' ), wp_list_pluck( $index['categories'], 'slug' ) );
		$this->assertStringContainsString( '_fields=', $this->requests[0] );
		$this->assertStringNotContainsString( 'content', $this->requests[0] );
	}

	/**
	 * Each host asks the catalog for its own skills: WordPress.com sites for `wpcom` ones, the rest for `jetpack` ones.
	 *
	 * @dataProvider provide_hosts
	 *
	 * @param bool   $is_wpcom Whether the site is on WordPress.com.
	 * @param string $host     The host whose term it should ask for.
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_index_asks_for_the_hosts_skills( $is_wpcom, $host ) {
		if ( $is_wpcom ) {
			Constants::set_constant( 'IS_WPCOM', true );
		}

		Jetpack_AI_Skills_Catalog::get_index();

		$this->assertStringContainsString(
			'agent_skill_applies_to=' . Jetpack_AI_Skills_Catalog::HOST_TERMS[ $host ],
			$this->requests[0]
		);
	}

	/**
	 * Hosts and the term each asks for.
	 *
	 * @return array[]
	 */
	public static function provide_hosts() {
		return array(
			'self-hosted'   => array( false, 'jetpack' ),
			'WordPress.com' => array( true, 'wpcom' ),
		);
	}

	/**
	 * A failed fetch is cached briefly, so a down catalog isn't hit on every page load.
	 *
	 * @dataProvider provide_failed_posts
	 *
	 * @param array|WP_Error $posts What the catalog answers for posts.
	 */
	#[DataProvider( 'provide_failed_posts' )]
	public function test_failure_is_cached_briefly( $posts ) {
		$this->responses['/posts'] = $posts;

		$this->assertSame(
			array(
				'categories' => array(),
				'skills'     => array(),
			),
			Jetpack_AI_Skills_Catalog::get_index()
		);
		Jetpack_AI_Skills_Catalog::get_index();

		$this->assertCount( 2, $this->requests, 'One page load fetches posts and categories once.' );
		$expires = (int) get_option( '_transient_timeout_' . Jetpack_AI_Skills_Catalog::INDEX_TRANSIENT );
		$this->assertLessThanOrEqual( time() + Jetpack_AI_Skills_Catalog::FAILURE_CACHE_TTL, $expires );
	}

	/**
	 * Catalog answers that count as a failed fetch.
	 *
	 * @return array[]
	 */
	public static function provide_failed_posts() {
		return array(
			'the catalog is down'         => array( new WP_Error( 'http_request_failed', 'Down' ) ),
			'no skills for the host term' => array( array() ),
		);
	}

	/**
	 * A body is only fetched for a skill in the index.
	 */
	public function test_body_refuses_unknown_slug_without_fetching() {
		Jetpack_AI_Skills_Catalog::get_index();
		$this->requests = array();

		$result = Jetpack_AI_Skills_Catalog::get_body( 'not-a-skill' );

		$this->assertWPError( $result );
		$this->assertSame( 404, $result->get_error_data()['status'] );
		$this->assertSame( array(), $this->requests );
	}

	/**
	 * The rendered body becomes plain text with its line breaks.
	 */
	public function test_body_is_plain_text() {
		Jetpack_AI_Skills_Catalog::get_index();
		$this->responses['/posts'] = array(
			array(
				'content' => array( 'rendered' => '<pre class="wp-block-preformatted">## Task<br><br>1. Read &amp; fix.<br/>2. Report.</pre>' ),
			),
		);

		$this->assertSame( "## Task\n\n1. Read & fix.\n2. Report.", Jetpack_AI_Skills_Catalog::get_body( 'site-seo-audit' ) );
	}
}
