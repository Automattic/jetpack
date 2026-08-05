<?php
/**
 * Tests for the Random Redirect module.
 *
 * @package automattic/jetpack
 * @since 16.1
 */

/** Include the random-redirect.php module. */
require_once __DIR__ . '/../../../../modules/theme-tools/random-redirect.php';

/**
 * Test class for the Random Redirect module.
 *
 * @since 16.1
 */
class Random_Redirect_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'wp_redirect', array( $this, 'intercept_redirect' ) );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_filter( 'wp_redirect', array( $this, 'intercept_redirect' ) );
		unset( $_GET['random'], $_GET['random_post_type'], $_GET['random_cat_id'] );
		parent::tear_down();
	}

	/**
	 * Throws the redirect location so tests can observe it before the module calls exit.
	 *
	 * @param string $location Redirect target.
	 * @return never
	 * @throws Exception Always, carrying the redirect location.
	 */
	public function intercept_redirect( $location ) {
		throw new Exception( $location );
	}

	/**
	 * Runs the redirect handler and returns the attempted redirect location, or null if none happened.
	 *
	 * @return string|null
	 */
	protected function get_redirect_location() {
		try {
			jetpack_matt_random_redirect();
		} catch ( Exception $e ) {
			return $e->getMessage();
		}
		return null;
	}

	/**
	 * A request without the random parameter must not redirect.
	 */
	public function test_no_random_param_does_not_redirect() {
		self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$this->assertNull( $this->get_redirect_location() );
	}

	/**
	 * Redirects to the permalink of a published post.
	 */
	public function test_redirects_to_published_post() {
		$post_ids                 = self::factory()->post->create_many( 3, array( 'post_status' => 'publish' ) );
		$_GET['random']           = '1';
		$_GET['random_post_type'] = 'post';

		$this->assertContains( $this->get_redirect_location(), array_map( 'get_permalink', $post_ids ) );
	}

	/**
	 * Password-protected posts are never a redirect target.
	 */
	public function test_excludes_password_protected_posts() {
		$public_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		self::factory()->post->create_many( 2, array( 'post_password' => 'secret' ) );
		$_GET['random']           = '1';
		$_GET['random_post_type'] = 'post';

		$this->assertSame( get_permalink( $public_id ), $this->get_redirect_location() );
	}

	/**
	 * The random_post_type parameter switches the post type.
	 */
	public function test_random_post_type_parameter() {
		self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$page_id                  = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$_GET['random']           = '1';
		$_GET['random_post_type'] = 'page';

		$this->assertSame( get_permalink( $page_id ), $this->get_redirect_location() );
	}

	/**
	 * The random_cat_id parameter restricts the pick to that category.
	 */
	public function test_random_cat_id_parameter() {
		$cat_id    = self::factory()->category->create();
		$in_cat_id = self::factory()->post->create( array( 'post_category' => array( $cat_id ) ) );
		self::factory()->post->create_many( 3, array( 'post_status' => 'publish' ) );
		$_GET['random']           = '1';
		$_GET['random_post_type'] = 'post';
		$_GET['random_cat_id']    = (string) $cat_id;

		$this->assertSame( get_permalink( $in_cat_id ), $this->get_redirect_location() );
	}

	/**
	 * No matching posts means no redirect.
	 */
	public function test_no_matching_posts_does_not_redirect() {
		self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$_GET['random']           = '1';
		$_GET['random_post_type'] = 'post';
		$_GET['random_cat_id']    = '99999';

		$this->assertNull( $this->get_redirect_location() );
	}

	/**
	 * The jetpack_random_redirect_enabled filter disables the feature.
	 */
	public function test_disabled_via_filter() {
		self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$_GET['random']           = '1';
		$_GET['random_post_type'] = 'post';
		add_filter( 'jetpack_random_redirect_enabled', '__return_false' );

		$this->assertNull( $this->get_redirect_location() );

		remove_filter( 'jetpack_random_redirect_enabled', '__return_false' );
	}
}
