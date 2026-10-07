<?php
/**
 * Likes editor extension tests.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Extensions\Likes;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/likes/likes.php';

/**
 * Likes editor extension tests.
 */
class Likes_Extension_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Theme directories before the test registered the core fixtures.
	 *
	 * @var string[]
	 */
	private $theme_directories;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->theme_directories = $GLOBALS['wp_theme_directories'];
		register_theme_directory( DIR_TESTDATA . '/themedir1' );

		$reflection = new ReflectionClass( 'Jetpack_Gutenberg' );
		$property   = $reflection->getProperty( 'availability' );
		@$property->setAccessible( true ); // @codingStandardsIgnoreLine — needed for PHP < 8.1, suppressed for PHP 8.5+ deprecation.
		$property->setValue( null, array() );

		$owner_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		Jetpack_Options::update_option( 'master_user', $owner_id );
		Jetpack_Options::update_option( 'user_tokens', array( $owner_id => 'token.secret.' . $owner_id ) );
		( new Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		add_filter( 'jetpack_offline_mode', '__return_false' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->theme_directories;
		Jetpack_Options::delete_option( array( 'master_user', 'user_tokens' ) );
		( new Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		parent::tear_down();
	}

	/**
	 * Cases for the panel's availability.
	 *
	 * @return array
	 */
	public static function data_availability() {
		return array(
			'Likes, block theme'              => array( array( 'likes' ), 'block-theme', 'author', true ),
			'Comment Likes only, block theme' => array( array( 'comment-likes' ), 'block-theme', 'administrator', true ),
			'Comment Likes only, author'      => array( array( 'comment-likes' ), 'default', 'author', true ),
			'neither, classic theme (nudge)'  => array( array(), 'default', 'administrator', true ),
			'neither, block theme'            => array( array(), 'block-theme', 'administrator', false ),
			'neither, classic theme, author'  => array( array(), 'default', 'author', false ),
		);
	}

	/**
	 * The panel carries the per-post switch whenever either module runs, and the nudge only where activating Likes is the answer.
	 *
	 * @dataProvider data_availability
	 *
	 * @param string[] $active_modules Active modules.
	 * @param string   $theme          Theme to switch to.
	 * @param string   $role           Role of the user editing the post.
	 * @param bool     $expected       Whether the extension should be available.
	 */
	#[DataProvider( 'data_availability' )]
	public function test_availability( $active_modules, $theme, $role, $expected ) {
		switch_theme( $theme );
		$this->assertSame( 'block-theme' === $theme, wp_is_block_theme() );

		add_filter(
			'jetpack_active_modules',
			static function () use ( $active_modules ) {
				return $active_modules;
			}
		);
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );

		Likes\register_plugins();

		$this->assertSame( $expected, Jetpack_Gutenberg::is_available( 'likes' ) );
	}
}
