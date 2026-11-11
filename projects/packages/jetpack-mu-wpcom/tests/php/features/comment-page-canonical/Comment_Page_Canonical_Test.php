<?php
/**
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/comment-page-canonical/comment-page-canonical.php';

/**
 * @covers ::wpcom_comment_page_canonical_url
 */
#[CoversFunction( 'wpcom_comment_page_canonical_url' )]
class Comment_Page_Canonical_Test extends \WorDBless\BaseTestCase {

	/**
	 * Globals the test replaces, restored in tear_down().
	 *
	 * @var array
	 */
	private $saved_globals = array();

	/**
	 * Save the query globals.
	 */
	public function set_up() {
		parent::set_up();
		foreach ( array( 'wp', 'wp_query', 'wp_the_query', 'post' ) as $name ) {
			$this->saved_globals[ $name ] = $GLOBALS[ $name ] ?? null;
		}
	}

	/**
	 * Restore the query globals.
	 */
	public function tear_down() {
		foreach ( $this->saved_globals as $name => $value ) {
			$GLOBALS[ $name ] = $value;
		}
		parent::tear_down();
	}

	/**
	 * Only a comment page named in the request belongs in the canonical URL.
	 *
	 * @dataProvider provide_requests
	 *
	 * @param array    $request_vars Query vars parsed from the request.
	 * @param int      $page         The `page` query var of a multi-page post.
	 * @param callable $expected     Builds the expected canonical URL from the post ID.
	 */
	#[DataProvider( 'provide_requests' )]
	public function test_canonical_url( $request_vars, $page, $expected ) {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Paged comments',
				'post_status' => 'publish',
			)
		);

		$GLOBALS['wp']             = new WP();
		$GLOBALS['wp']->query_vars = $request_vars;
		$GLOBALS['wp_query']       = new WP_Query();
		$GLOBALS['wp_the_query']   = $GLOBALS['wp_query'];
		$GLOBALS['post']           = get_post( $post_id );

		$GLOBALS['wp_query']->queried_object    = $GLOBALS['post'];
		$GLOBALS['wp_query']->queried_object_id = $post_id;
		set_query_var( 'cpage', 2 );
		set_query_var( 'page', $page );

		$this->assertSame( $expected( $post_id ), wp_get_canonical_url( $post_id ) );
		$this->assertSame( 2, get_query_var( 'cpage' ) );
	}

	/**
	 * @return array
	 */
	public static function provide_requests() {
		return array(
			'comment page filled in by the template' => array(
				array(),
				0,
				fn( $post_id ) => get_permalink( $post_id ),
			),
			'comment page in the request'            => array(
				array( 'cpage' => 2 ),
				0,
				fn() => get_comments_pagenum_link( 2 ),
			),
			'multi-page post'                        => array(
				array(),
				2,
				fn( $post_id ) => add_query_arg( 'page', 2, get_permalink( $post_id ) ),
			),
		);
	}
}
