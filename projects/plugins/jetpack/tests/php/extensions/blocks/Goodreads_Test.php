<?php
/**
 * Goodreads Block tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\Goodreads;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/goodreads/render.php';

/**
 * Goodreads block tests.
 */
class Goodreads_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Script handle used by the render tests.
	 *
	 * @var string
	 */
	private const SCRIPT_HANDLE = 'jetpack-goodreads-gr_custom_widget_1234567';

	/**
	 * Clean up scripts registered by a test.
	 */
	public function tear_down() {
		wp_dequeue_script( self::SCRIPT_HANDLE );
		wp_deregister_script( self::SCRIPT_HANDLE );

		parent::tear_down();
	}

	/**
	 * Test Goodreads script URL validation.
	 *
	 * @dataProvider provide_script_urls
	 *
	 * @param mixed $url      URL to validate.
	 * @param bool  $expected Whether the URL should be accepted.
	 */
	#[DataProvider( 'provide_script_urls' )]
	public function test_get_validated_script_url( $url, $expected ) {
		$this->assertSame( $expected, '' !== Goodreads\get_validated_script_url( $url ) );
	}

	/**
	 * Provide allowed and rejected Goodreads script URL variants.
	 *
	 * @return array
	 */
	public static function provide_script_urls() {
		return array(
			'custom widget endpoint'     => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf?num_books=5&widget_id=4529663',
				true,
			),
			'custom title with slash'    => array(
				'https://www.goodreads.com/review/custom_widget/1176283.Sci-Fi%20/%20Fantasy?num_books=5&widget_id=4529663',
				true,
			),
			'grid widget endpoint'       => array(
				'https://www.goodreads.com/review/grid_widget/1176283.My%20Bookshelf?num_books=5&widget_id=4529663',
				true,
			),
			'grid title with slash'      => array(
				'https://www.goodreads.com/review/grid_widget/1176283.Sci-Fi%20/%20Fantasy?num_books=5&widget_id=4529663',
				true,
			),
			'encoded title delimiters'   => array(
				'https://www.goodreads.com/review/custom_widget/1176283.What%3F%20I%20read%20%232026?widget_id=4529663',
				true,
			),
			'case-insensitive authority' => array(
				'HTTPS://WWW.GOODREADS.COM/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663',
				true,
			),
			'scheme-less goodreads url'  => array(
				'www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663',
				true,
			),
			'external host'              => array(
				'https://attacker.example/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663',
				false,
			),
			'host suffix'                => array(
				'https://www.goodreads.com.attacker.example/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663',
				false,
			),
			'authority confusion'        => array(
				'https://www.goodreads.com@attacker.example/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663',
				false,
			),
			'insecure scheme'            => array(
				'http://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663',
				false,
			),
			'protocol relative'          => array(
				'//www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663',
				false,
			),
			'noncanonical subdomain'     => array(
				'https://goodreads.com/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663',
				false,
			),
			'noncanonical port'          => array(
				'https://www.goodreads.com:443/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663',
				false,
			),
			'unexpected endpoint'        => array(
				'https://www.goodreads.com/user/show/1176283?widget_id=4529663',
				false,
			),
			'missing query'              => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf',
				false,
			),
			'empty title'                => array(
				'https://www.goodreads.com/review/custom_widget/1176283.?widget_id=4529663',
				false,
			),
			'unexpected query parameter' => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663&redirect=https%3A%2F%2Fattacker.example',
				false,
			),
			'array query parameter'      => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf?widget_id%5Bredirect%5D=https%3A%2F%2Fattacker.example',
				false,
			),
			'wrong endpoint parameter'   => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf?cover_size=medium&widget_id=4529663',
				false,
			),
			'missing numeric user id'    => array(
				'https://www.goodreads.com/review/custom_widget/user.My%20Bookshelf?widget_id=4529663',
				false,
			),
			'path traversal'             => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf/../../login?widget_id=4529663',
				false,
			),
			'encoded path traversal'     => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf%2F..%2F..%2Flogin?widget_id=4529663',
				false,
			),
			'encoded slash in title'     => array(
				'https://www.goodreads.com/review/custom_widget/1176283.Sci-Fi%20%2F%20Fantasy?widget_id=4529663',
				false,
			),
			'encoded dot segment'        => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf/%2e%2e/login?widget_id=4529663',
				false,
			),
			'backslash path confusion'   => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf\\..\\..\\login?widget_id=4529663',
				false,
			),
			'encoded backslash path'     => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf%5C..%5C..%5Clogin?widget_id=4529663',
				false,
			),
			'fragment'                   => array(
				'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf?widget_id=4529663#fragment',
				false,
			),
			'non-string value'           => array(
				array( 'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf' ),
				false,
			),
		);
	}

	/**
	 * Test that the expected Goodreads endpoint is enqueued.
	 */
	public function test_render_enqueues_allowed_script() {
		$url          = 'https://www.goodreads.com/review/custom_widget/1176283.Sci-Fi / Fantasy?num_books=5&widget_id=4529663';
		$expected_url = 'https://www.goodreads.com/review/custom_widget/1176283.Sci-Fi%20/%20Fantasy?num_books=5&widget_id=4529663';

		Goodreads\render_implementation(
			array(
				'id'   => 'gr_custom_widget_1234567',
				'link' => $url,
			)
		);

		$this->assertTrue( wp_script_is( self::SCRIPT_HANDLE, 'enqueued' ) );
		$this->assertSame( $expected_url, wp_scripts()->registered[ self::SCRIPT_HANDLE ]->src );
	}

	/**
	 * Test that an author-controlled remote script is not enqueued.
	 */
	public function test_render_does_not_enqueue_untrusted_script() {
		Goodreads\render_implementation(
			array(
				'id'   => 'gr_custom_widget_1234567',
				'link' => 'https://attacker.example/gandalf.js',
			)
		);

		$this->assertFalse( wp_script_is( self::SCRIPT_HANDLE, 'registered' ) );
		$this->assertFalse( wp_script_is( self::SCRIPT_HANDLE, 'enqueued' ) );
	}
}
