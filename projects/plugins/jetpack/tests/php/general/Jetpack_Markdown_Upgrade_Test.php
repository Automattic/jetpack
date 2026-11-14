<?php
/**
 * Tests for the Markdown for posts reset that runs on plugin upgrade.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class Jetpack_Markdown_Upgrade_Test
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_Markdown_Upgrade_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Previous versions, and whether Markdown for posts ends up on when it was off.
	 *
	 * @return array
	 */
	public static function provide_previous_versions() {
		return array(
			'from before 4.7'  => array( '4.6', true ),
			'from 4.7'         => array( '4.7', false ),
			'from a recent 15' => array( '15.9', false ),
		);
	}

	/**
	 * An upgrade turns Markdown for posts back on only for sites from before 4.7.
	 *
	 * @dataProvider provide_previous_versions
	 *
	 * @param string $previous_version The version the site upgrades from.
	 * @param bool   $expected         Whether the option is on afterwards.
	 */
	#[DataProvider( 'provide_previous_versions' )]
	public function test_upgrade_keeps_markdown_for_posts_off_after_4_7( $previous_version, $expected ) {
		update_option( 'wpcom_publish_posts_with_markdown', false );

		Jetpack::enable_markdown_for_posts_after_upgrade( $previous_version );

		$this->assertSame( $expected, (bool) get_option( 'wpcom_publish_posts_with_markdown' ) );
	}
}
