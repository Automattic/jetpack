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
	 * Only a comment page named in the request belongs in the canonical URL.
	 *
	 * @dataProvider provide_requests
	 *
	 * @param array $request_vars       Query vars parsed from the request.
	 * @param bool  $keeps_comment_page Whether the canonical should point at the comment page.
	 */
	#[DataProvider( 'provide_requests' )]
	public function test_canonical_url( $request_vars, $keeps_comment_page ) {
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

		$GLOBALS['wp_query']->queried_object    = get_post( $post_id );
		$GLOBALS['wp_query']->queried_object_id = $post_id;
		set_query_var( 'cpage', 2 );

		$expected = $keeps_comment_page ? get_comments_pagenum_link( 2 ) : get_permalink( $post_id );

		$this->assertSame( $expected, wp_get_canonical_url( $post_id ) );
		$this->assertSame( 2, get_query_var( 'cpage' ) );
	}

	/**
	 * @return array
	 */
	public static function provide_requests() {
		return array(
			'comment page filled in by the template' => array( array(), false ),
			'comment page in the request'            => array( array( 'cpage' => 2 ), true ),
		);
	}
}
