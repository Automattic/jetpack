<?php
/**
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/editor-welcome-guides/editor-welcome-guides-atomic.php';

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * @covers ::wpcom_editor_welcome_guides_atomic_get_dismissed
 * @covers ::wpcom_editor_welcome_guides_atomic_record_dismissed
 */
#[CoversFunction( 'wpcom_editor_welcome_guides_atomic_get_dismissed' )]
#[CoversFunction( 'wpcom_editor_welcome_guides_atomic_record_dismissed' )]
class Editor_Welcome_Guides_Atomic_Test extends \WorDBless\BaseTestCase {

	private const ENDPOINT = '/wpcom/v2/me/editor-welcome-guides';

	/**
	 * @var int
	 */
	private $user_id;

	/**
	 * @var string|null
	 */
	private $pagenow;

	/**
	 * Every request the fake WordPress.com received: method, path and decoded body.
	 *
	 * @var array
	 */
	private $requests = array();

	/**
	 * What the fake WordPress.com answers.
	 *
	 * @var array|\WP_Error
	 */
	private $response;

	public function set_up() {
		parent::set_up();

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'welcome_guides_user',
				'user_pass'  => 'password',
				'user_email' => 'welcome_guides_user@example.com',
			)
		);
		wp_set_current_user( $this->user_id );

		\Jetpack_Options::update_option( 'id', 12345 );
		( new Tokens() )->update_blog_token( 'blog.token' );
		( new Tokens() )->update_user_token( $this->user_id, "user.token.{$this->user_id}", true );
		// Without this the client has no API host to sign a URL for.
		Connection_Utils::init_default_constants();

		$this->pagenow = $GLOBALS['pagenow'] ?? null;
		$this->on_page( 'post.php' );

		add_filter( 'pre_http_request', array( $this, 'answer' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer' ), 10 );
		$this->on_page( $this->pagenow );
		wp_set_current_user( 0 );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token', 'user_tokens', 'master_user' ) );

		parent::tear_down();
	}

	/**
	 * Stands in for the `wpcom/v2/me/editor-welcome-guides` endpoint.
	 *
	 * @param mixed  $pre  Short-circuit value.
	 * @param array  $args Request arguments.
	 * @param string $url  Request URL.
	 * @return array|\WP_Error
	 */
	public function answer( $pre, $args, $url ) {
		$this->requests[] = array( $args['method'], wp_parse_url( $url, PHP_URL_PATH ), json_decode( (string) $args['body'], true ) );

		return $this->response;
	}

	private function on_page( ?string $pagenow ) {
		$GLOBALS['pagenow'] = $pagenow; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	private function wpcom_answers( array $dismissed ) {
		$this->response = array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode( array( 'dismissed' => (object) $dismissed ), JSON_UNESCAPED_SLASHES ),
		);
	}

	private function copy( array $dismissed, int $checked ) {
		update_user_meta(
			$this->user_id,
			WPCOM_EDITOR_WELCOME_GUIDES_CACHE_META,
			array(
				'checked'   => $checked,
				'dismissed' => $dismissed,
			)
		);
	}

	private function stored_copy() {
		return get_user_meta( $this->user_id, WPCOM_EDITOR_WELCOME_GUIDES_CACHE_META, true );
	}

	private function read() {
		return apply_filters( 'wpcom_editor_welcome_guides_dismissed', array(), $this->user_id );
	}

	public function test_editor_page_load_fetches_and_keeps_the_record() {
		$record = array( 'core/edit-post' => array( 'welcomeGuide' ) );
		$this->wpcom_answers( $record );
		$before = time();

		$this->assertSame( $record, $this->read() );
		$this->assertSame( array( array( 'GET', self::ENDPOINT, null ) ), $this->requests );
		$this->assertSame( $record, $this->stored_copy()['dismissed'] );
		$this->assertGreaterThanOrEqual( $before, $this->stored_copy()['checked'] );

		$this->assertSame( $record, $this->read() );
		$this->assertCount( 1, $this->requests );
	}

	public function test_other_requests_serve_the_copy_without_asking() {
		$record = array( 'core/edit-site' => array( 'welcomeGuide', 'welcomeGuideStyles' ) );
		$this->copy( $record, time() - DAY_IN_SECONDS );
		$this->on_page( 'index.php' );

		$this->assertSame( $record, $this->read() );
		$this->assertSame( array(), $this->requests );
	}

	public function test_failed_fetch_keeps_the_copy() {
		$record = array( 'core/edit-post' => array( 'welcomeGuide' ) );
		$this->copy( $record, time() - DAY_IN_SECONDS );
		$this->response = new \WP_Error( 'http_request_failed', 'offline' );

		$this->assertSame( $record, $this->read() );
		$this->assertSame( $record, $this->stored_copy()['dismissed'] );

		$this->assertSame( $record, $this->read() );
		$this->assertCount( 1, $this->requests );
	}

	public function test_dismiss_posts_only_new_guides() {
		$this->copy(
			array(
				'core/edit-post' => array( 'welcomeGuide' ),
				'core/edit-site' => array( 'welcomeGuide' ),
			),
			time()
		);
		$record = array(
			'core/edit-post' => array( 'welcomeGuide' ),
			'core/edit-site' => array( 'welcomeGuide', 'welcomeGuideStyles' ),
		);
		$this->wpcom_answers( $record );

		do_action( 'wpcom_editor_welcome_guides_dismiss', $this->user_id, $record );
		$this->assertSame(
			array( array( 'POST', self::ENDPOINT, array( 'dismissed' => array( 'core/edit-site' => array( 'welcomeGuideStyles' ) ) ) ) ),
			$this->requests
		);
		$this->assertSame( $record, $this->stored_copy()['dismissed'] );

		do_action( 'wpcom_editor_welcome_guides_dismiss', $this->user_id, $record );
		$this->assertCount( 1, $this->requests );
	}
}
