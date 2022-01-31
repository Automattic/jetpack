<?php
/**
 * Contains the unit tests for the Jetpack_Pre_Connection_JITMs class.
 *
 * @package jetpack
 */

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

require_once __DIR__ . '/../../../class-jetpack-pre-connection-jitms.php';

/**
 * Class WP_Test_Jetpack_Pre_Connection_JITMs.
 */
class WP_Test_Jetpack_Pre_Connection_JITMs extends TestCase {

	/**
	 * Tests the Jetpack_Pre_Connection_JITMs::add_pre_connection_jitms method with different
	 * published post counts.
	 *
	 * @param int $posts_count          The number of published posts.
	 * @param int $expected_jitms_count The expected number of JITMs that should be returned by
	 *                                  Jetpack_Pre_Connection_JITMs::add_pre_connection_jitms.
	 *
	 * @dataProvider data_provider_test_add_pre_connection_jitms
	 */
	public function test_add_pre_connection_jitms( $posts_count, $expected_jitms_count ) {
		add_filter(
			'wp_count_posts',
			function ( $counts ) use ( $posts_count ) {
				$counts->publish = $posts_count;
				return $counts;
			}
		);

		$jitms    = new Jetpack_Pre_Connection_JITMs();
		$messages = $jitms->add_pre_connection_jitms( array() );
		$this->assertCount( $expected_jitms_count, $messages );
	}

	/**
	 * Data provider for the test_add_pre_connection_jitms test method.
	 *
	 * Jetpack has three pre-connection JITMs. One JITM, jpsetup-posts, is only displayed
	 * when the number of published posts is greater than or equal to five.
	 *
	 * @return array An array of test data.
	 */
	public function data_provider_test_add_pre_connection_jitms() {
		return array(
			'0 posts' => array( 0, 2 ),
			'4 posts' => array( 4, 2 ),
			'5 posts' => array( 5, 3 ),
			'6 posts' => array( 6, 3 ),
		);
	}

	/**
	 * Verify that the pre-connection JITM button link ends with the expected query.
	 */
	public function test_add_pre_connection_jitms_button_link() {
		$jitms    = new Jetpack_Pre_Connection_JITMs();
		$messages = $jitms->add_pre_connection_jitms( array() );

		$query = 'admin.php?page=jetpack#/setup&from=pre-connection-jitm-jpsetup-upload';

		// Verify that the `jpsetup-upload` JITM is in the list of JITMs.
		$index = array_search( 'jpsetup-upload', array_column( $messages, 'id' ), true );
		$this->assertNotFalse( $index );

		$this->assertSame( $query, substr( $messages[ $index ]['button_link'], -strlen( $query ) ) );
	}

	/**
	 * Tests the add_pre_connection_jitms method when the input to the method is
	 * an array containing a single JITM. The three Jetpack pre-connection JITMs
	 * and the additional test JITM should be returned.
	 */
	public function test_add_pre_connection_jitms_existing_jitms() {
		$test_jitm = array(
			array(
				'id'             => 'test-jitm',
				'message_path'   => '/wp:plugins:admin_notices/',
				'message'        => __( 'A test message.', 'jetpack' ),
				'description'    => __( 'A test description.', 'jetpack' ),
				'button_link'    => 'a/test/url',
				'button_caption' => __( 'Test button text', 'jetpack' ),
			),
		);

		add_filter(
			'wp_count_posts',
			function ( $counts ) {
				$counts->publish = 7;
				return $counts;
			}
		);

		$jitms    = new Jetpack_Pre_Connection_JITMs();
		$messages = $jitms->add_pre_connection_jitms( $test_jitm );

		$this->assertCount( 4, $messages );
	}

	/**
	 * Tests the add_pre_connection_jitms method when the input to the method is
	 * not an array. The three Jetpack pre-connection JITMs should
	 * be returned.
	 */
	public function test_add_pre_connection_jitms_not_an_array() {
		add_filter(
			'wp_count_posts',
			function ( $counts ) {
				$counts->publish = 7;
				return $counts;
			}
		);

		$jitms    = new Jetpack_Pre_Connection_JITMs();
		$messages = $jitms->add_pre_connection_jitms( 'a test string' );

		$this->assertCount( 3, $messages );
	}
}
