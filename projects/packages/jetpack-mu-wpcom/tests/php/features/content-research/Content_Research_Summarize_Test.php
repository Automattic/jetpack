<?php
/**
 * Tests for WP_REST_Content_Research_Summarize.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/content-research/class-wp-rest-content-research-summarize.php';

use A8C\FSE\WP_REST_Content_Research_Summarize;

/**
 * Test class for WP_REST_Content_Research_Summarize.
 *
 * Covers permission handling, URL safety, prompt-size bounding,
 * content extraction, and markdown parsing.
 */
class Content_Research_Summarize_Test extends \WorDBless\BaseTestCase {

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Controller instance for Reflection-based tests.
	 *
	 * @var WP_REST_Content_Research_Summarize
	 */
	private $controller;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'cr_summarize_user',
				'user_pass'  => 'cr_summarize_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( 0 );

		$this->controller = new WP_REST_Content_Research_Summarize();
		$this->controller->register_rest_route();

		do_action( 'rest_api_init' );
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	// ── Permission handling ────────────────────────────────────────────

	/**
	 * Unauthenticated requests should be rejected with 401.
	 */
	public function test_summarize_rejects_unauthenticated_request() {
		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/content-research/summarize' );
		$request->set_param( 'topic', 'test' );
		$request->set_param( 'results', array() );
		$result = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
	}

	/**
	 * Verify check_permission returns WP_Error for unauthenticated users.
	 */
	public function test_check_permission_returns_error_when_not_logged_in() {
		$result = $this->controller->check_permission();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'rest_forbidden', $result->get_error_code() );
	}

	/**
	 * Verify check_permission returns true for logged-in users.
	 */
	public function test_check_permission_returns_true_when_logged_in() {
		wp_set_current_user( $this->admin_id );
		$result = $this->controller->check_permission();

		$this->assertTrue( $result );
	}

	// ── URL safety ────────────────────────────────────────────────────

	/**
	 * Empty URLs are rejected.
	 */
	public function test_is_safe_url_rejects_empty() {
		$method = $this->get_private_method( 'is_safe_url' );

		$this->assertFalse( $method->invoke( $this->controller, '' ) );
	}

	/**
	 * Non-HTTP schemes are rejected.
	 */
	public function test_is_safe_url_rejects_non_http_schemes() {
		$method = $this->get_private_method( 'is_safe_url' );

		$this->assertFalse( $method->invoke( $this->controller, 'ftp://example.com/file' ) );
		$this->assertFalse( $method->invoke( $this->controller, 'file:///etc/passwd' ) );
		$this->assertFalse( $method->invoke( $this->controller, 'javascript:alert(1)' ) );
		$this->assertFalse( $method->invoke( $this->controller, 'gopher://example.com' ) );
	}

	/**
	 * URLs without a host are rejected.
	 */
	public function test_is_safe_url_rejects_no_host() {
		$method = $this->get_private_method( 'is_safe_url' );

		$this->assertFalse( $method->invoke( $this->controller, '/relative/path' ) );
	}

	/**
	 * Valid HTTP/HTTPS URLs with public hosts are accepted.
	 */
	public function test_is_safe_url_accepts_valid_urls() {
		$method = $this->get_private_method( 'is_safe_url' );

		$this->assertTrue( $method->invoke( $this->controller, 'https://example.com/article' ) );
		$this->assertTrue( $method->invoke( $this->controller, 'http://example.com/article' ) );
	}

	// ── Prompt-size bounding ──────────────────────────────────────────

	/**
	 * Verify fetch_articles limits input to MAX_ARTICLES (5).
	 */
	public function test_fetch_articles_limits_to_max_articles() {
		$method = $this->get_private_method( 'fetch_articles' );

		$results = array();
		for ( $i = 0; $i < 10; $i++ ) {
			$results[] = array(
				'url'     => '',
				'title'   => "Article $i",
				'source'  => 'hn',
				'excerpt' => 'Excerpt',
			);
		}

		$articles = $method->invoke( $this->controller, $results );
		$this->assertCount( 5, $articles );
	}

	/**
	 * Titles are truncated to 300 characters.
	 */
	public function test_fetch_articles_truncates_long_titles() {
		$method = $this->get_private_method( 'fetch_articles' );

		$results = array(
			array(
				'url'     => '',
				'title'   => str_repeat( 'A', 500 ),
				'source'  => 'hn',
				'excerpt' => 'Excerpt',
			),
		);

		$articles = $method->invoke( $this->controller, $results );
		$this->assertLessThanOrEqual( 300, mb_strlen( $articles[0]['title'] ) );
	}

	/**
	 * Excerpts are truncated to 500 characters.
	 */
	public function test_fetch_articles_truncates_long_excerpts() {
		$method = $this->get_private_method( 'fetch_articles' );

		$results = array(
			array(
				'url'     => '',
				'title'   => 'Title',
				'source'  => 'hn',
				'excerpt' => str_repeat( 'B', 1000 ),
			),
		);

		$articles = $method->invoke( $this->controller, $results );
		$this->assertLessThanOrEqual( 500, mb_strlen( $articles[0]['excerpt'] ) );
	}

	/**
	 * Source field is sanitized to a safe key format.
	 */
	public function test_fetch_articles_sanitizes_source_key() {
		$method = $this->get_private_method( 'fetch_articles' );

		$results = array(
			array(
				'url'     => '',
				'title'   => 'Title',
				'source'  => 'Malicious Source <script>',
				'excerpt' => 'Excerpt',
			),
		);

		$articles = $method->invoke( $this->controller, $results );
		// sanitize_key lowercases and strips non-alphanumeric/dash/underscore.
		$this->assertMatchesRegularExpression( '/^[a-z0-9_\-]+$/', $articles[0]['source'] );
	}

	/**
	 * HTML tags in excerpts are stripped.
	 */
	public function test_fetch_articles_strips_html_from_excerpts() {
		$method = $this->get_private_method( 'fetch_articles' );

		$results = array(
			array(
				'url'     => '',
				'title'   => 'Title',
				'source'  => 'hn',
				'excerpt' => '<p>Hello <b>world</b></p>',
			),
		);

		$articles = $method->invoke( $this->controller, $results );
		$this->assertStringNotContainsString( '<', $articles[0]['excerpt'] );
		$this->assertStringContainsString( 'Hello', $articles[0]['excerpt'] );
	}

	/**
	 * Missing fields default gracefully without errors.
	 */
	public function test_fetch_articles_handles_missing_fields() {
		$method = $this->get_private_method( 'fetch_articles' );

		$results = array(
			array(), // All fields missing.
		);

		$articles = $method->invoke( $this->controller, $results );
		$this->assertCount( 1, $articles );
		$this->assertSame( '', $articles[0]['url'] );
		$this->assertSame( '', $articles[0]['title'] );
		$this->assertSame( 'unknown', $articles[0]['source'] );
	}

	// ── Content extraction ────────────────────────────────────────────

	/**
	 * Prefers <article> tag for content extraction.
	 */
	public function test_extract_main_content_finds_article() {
		$method = $this->get_private_method( 'extract_main_content' );

		$html   = '<html><body><article><p>Article content</p></article></body></html>';
		$result = $method->invoke( $this->controller, $html );

		$this->assertStringContainsString( 'Article content', $result );
	}

	/**
	 * Falls back to <main> when no <article> exists.
	 */
	public function test_extract_main_content_falls_back_to_main() {
		$method = $this->get_private_method( 'extract_main_content' );

		$html   = '<html><body><main><p>Main content</p></main></body></html>';
		$result = $method->invoke( $this->controller, $html );

		$this->assertStringContainsString( 'Main content', $result );
	}

	/**
	 * Falls back to <body> when no <article> or <main> exists.
	 */
	public function test_extract_main_content_falls_back_to_body() {
		$method = $this->get_private_method( 'extract_main_content' );

		$html   = '<html><body><p>Body content</p></body></html>';
		$result = $method->invoke( $this->controller, $html );

		$this->assertStringContainsString( 'Body content', $result );
	}

	/**
	 * Returns empty string for empty/minimal HTML.
	 */
	public function test_extract_main_content_returns_empty_for_no_match() {
		$method = $this->get_private_method( 'extract_main_content' );

		$result = $method->invoke( $this->controller, '' );
		$this->assertEmpty( $result );
	}

	/**
	 * Verify libxml internal error state is properly restored after extraction.
	 */
	public function test_extract_main_content_restores_libxml_state() {
		$method = $this->get_private_method( 'extract_main_content' );

		// Set a known state.
		$previous = libxml_use_internal_errors( false );

		$method->invoke( $this->controller, '<html><body>test</body></html>' );

		// After the call, the state should be restored to false.
		$current = libxml_use_internal_errors( $previous );
		$this->assertFalse( $current );
	}

	// ── Markdown parsing ──────────────────────────────────────────────

	/**
	 * Well-formatted markdown is parsed into structured sections.
	 */
	public function test_parse_markdown_response_basic() {
		$method = $this->get_private_method( 'parse_markdown_response' );

		$markdown = implode(
			"\n\n",
			array(
				'## Summary',
				'This is a test summary.',
				'## Key Findings',
				"- Finding one\n- Finding two\n- Finding three",
				'## Suggested Angles',
				"- Angle one\n- Angle two",
			)
		);

		$parsed = $method->invoke( $this->controller, $markdown );

		$this->assertStringContainsString( 'test summary', $parsed['summary'] );
		$this->assertCount( 3, $parsed['key_findings'] );
		$this->assertSame( 'Finding one', $parsed['key_findings'][0] );
		$this->assertCount( 2, $parsed['suggested_angles'] );
		$this->assertSame( 'Angle one', $parsed['suggested_angles'][0] );
	}

	/**
	 * Unstructured text falls back to the whole response as summary.
	 */
	public function test_parse_markdown_response_fallback() {
		$method = $this->get_private_method( 'parse_markdown_response' );

		$raw    = 'Just some plain text without sections.';
		$parsed = $method->invoke( $this->controller, $raw );

		$this->assertSame( $raw, $parsed['summary'] );
		$this->assertEmpty( $parsed['key_findings'] );
		$this->assertEmpty( $parsed['suggested_angles'] );
	}

	/**
	 * Bullet lists with different formats (-, *, 1., 2)) are all parsed.
	 */
	public function test_parse_bullet_list_formats() {
		$method = $this->get_private_method( 'parse_bullet_list' );

		$text  = "- Dash item\n* Star item\n1. Numbered item\n2) Parenthesis item";
		$items = $method->invoke( $this->controller, $text );

		$this->assertCount( 4, $items );
		$this->assertSame( 'Dash item', $items[0] );
		$this->assertSame( 'Star item', $items[1] );
		$this->assertSame( 'Numbered item', $items[2] );
		$this->assertSame( 'Parenthesis item', $items[3] );
	}

	/**
	 * Empty bullet list text returns empty array.
	 */
	public function test_parse_bullet_list_empty() {
		$method = $this->get_private_method( 'parse_bullet_list' );

		$items = $method->invoke( $this->controller, '' );
		$this->assertEmpty( $items );
	}

	// ── Build prompt ──────────────────────────────────────────────────

	/**
	 * Prompt includes topic, article metadata, content, and engagement.
	 */
	public function test_build_prompt_includes_all_parts() {
		$method = $this->get_private_method( 'build_prompt' );

		$articles = array(
			array(
				'source'     => 'hn',
				'title'      => 'Test Article',
				'url'        => 'https://example.com/test',
				'content'    => 'Article content here',
				'engagement' => array(
					'upvotes'  => 10,
					'comments' => 5,
				),
			),
		);

		$prompt = $method->invoke( $this->controller, 'AI research', $articles );

		$this->assertStringContainsString( 'AI research', $prompt );
		$this->assertStringContainsString( '[HN] Test Article', $prompt );
		$this->assertStringContainsString( 'https://example.com/test', $prompt );
		$this->assertStringContainsString( 'Article content here', $prompt );
		$this->assertStringContainsString( '10 upvotes', $prompt );
		$this->assertStringContainsString( '5 comments', $prompt );
	}

	/**
	 * Prompt omits engagement section when engagement data is empty.
	 */
	public function test_build_prompt_omits_empty_engagement() {
		$method = $this->get_private_method( 'build_prompt' );

		$articles = array(
			array(
				'source'     => 'googlenews',
				'title'      => 'News Article',
				'url'        => 'https://example.com/news',
				'content'    => 'Content',
				'engagement' => null,
			),
		);

		$prompt = $method->invoke( $this->controller, 'topic', $articles );

		$this->assertStringNotContainsString( 'Engagement:', $prompt );
	}

	// ── Helper ────────────────────────────────────────────────────────

	/**
	 * Get a private method via Reflection and make it accessible.
	 *
	 * @param string $method_name The method name.
	 * @return \ReflectionMethod
	 */
	private function get_private_method( string $method_name ): \ReflectionMethod {
		$method = new \ReflectionMethod( WP_REST_Content_Research_Summarize::class, $method_name );
		$method->setAccessible( true );
		return $method;
	}
}
