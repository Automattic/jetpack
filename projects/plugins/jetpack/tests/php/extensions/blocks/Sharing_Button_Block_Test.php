<?php
/**
 * Sharing Button block registration tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sharing_Likes\Hooked_Blocks\Hooked_Blocks;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use function Automattic\Jetpack\Extensions\Sharing_Button_Block\register_block;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/sharing-button/sharing-button.php';

/**
 * @covers ::Automattic\Jetpack\Extensions\Sharing_Button_Block\register_block
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Sharing_Button_Block\register_block' )]
class Sharing_Button_Block_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private const BLOCK_NAME = 'jetpack/sharing-button';

	/**
	 * Whether the block was registered before the test ran.
	 *
	 * @var bool
	 */
	private $was_registered;

	/**
	 * Whether IS_WPCOM was overridden before the test ran, and with what.
	 *
	 * @var array{0: bool, 1: mixed}
	 */
	private $wpcom_override;

	/**
	 * Detach the hooked-blocks filter that load-jetpack.php may already have added.
	 */
	public function set_up() {
		parent::set_up();
		$this->was_registered = WP_Block_Type_Registry::get_instance()->is_registered( self::BLOCK_NAME );
		$this->wpcom_override = array(
			array_key_exists( 'IS_WPCOM', Constants::$set_constants ),
			Constants::$set_constants['IS_WPCOM'] ?? null,
		);
		remove_filter( 'hooked_block_types', array( Hooked_Blocks::class, 'hook_block_types' ), 5 );
	}

	/**
	 * Restore IS_WPCOM and the block registry; WP_UnitTestCase restores the filters.
	 */
	public function tear_down() {
		if ( $this->wpcom_override[0] ) {
			Constants::set_constant( 'IS_WPCOM', $this->wpcom_override[1] );
		} else {
			Constants::clear_single_constant( 'IS_WPCOM' );
		}
		if ( ! $this->was_registered && WP_Block_Type_Registry::get_instance()->is_registered( self::BLOCK_NAME ) ) {
			unregister_block_type( self::BLOCK_NAME );
		}
		parent::tear_down();
	}

	/**
	 * Registering the block hooks the template placements on Simple only.
	 *
	 * @dataProvider provide_hosts
	 * @param bool     $simple   Whether the site runs on WordPress.com Simple.
	 * @param int|bool $expected `has_filter()` result for the placements callback.
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_register_block_hooks_template_placements_on_simple_only( $simple, $expected ) {
		Constants::set_constant( 'IS_WPCOM', $simple );

		register_block();

		$this->assertSame( $expected, has_filter( 'hooked_block_types', array( Hooked_Blocks::class, 'hook_block_types' ) ) );
	}

	/**
	 * @return array
	 */
	public static function provide_hosts() {
		return array(
			'Simple'      => array( true, 5 ),
			'self-hosted' => array( false, false ),
		);
	}
}
