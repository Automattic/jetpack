<?php
/**
 * Tests for the "Disable CSS and JS" setting.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/trait-section-environment.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Resources
 */
#[CoversClass( Sharing_Resources::class )]
class Sharing_Resources_Test extends BaseTestCase {

	use Section_Environment;

	/**
	 * Start every case from a site with no theme, no blocks and no modules.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
	}

	/**
	 * Leave no request state or options behind.
	 */
	public function tear_down() {
		$_POST = array();
		$this->tear_down_site();
		delete_option( Sharing_Resources::OPTION );
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * A connected site running the Sharing module, so the services list configures.
	 */
	private function given_sharing_configures(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'sharedaddy' ) );
	}

	/**
	 * The checkbox reflects the stored setting.
	 */
	public function test_renders_the_stored_setting_while_sharing_configures(): void {
		$this->given_sharing_configures();
		update_option( Sharing_Resources::OPTION, 1 );

		$this->assertStringContainsString( 'name="disable_resources" checked=\'checked\'', Sharing_Resources::render() );
	}

	/**
	 * It only affects legacy sharing buttons, so it goes wherever they do.
	 */
	public function test_renders_nothing_while_sharing_does_not_configure(): void {
		$this->given_connection( true );

		$this->assertSame( '', Sharing_Resources::render() );
	}

	/**
	 * Simple never loads `sharedaddy.php`, the one thing that reads the option.
	 */
	public function test_renders_nothing_on_simple(): void {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertSame( '', Sharing_Resources::render() );
	}

	/**
	 * An unchecked box posts nothing, which is the "off" answer.
	 */
	public function test_save_stores_the_checkbox(): void {
		$this->given_sharing_configures();

		$_POST['disable_resources'] = 'on';
		Sharing_Resources::save();
		$this->assertSame( 1, get_option( Sharing_Resources::OPTION ) );

		$_POST = array();
		Sharing_Resources::save();
		$this->assertSame( 0, get_option( Sharing_Resources::OPTION ) );
	}

	/**
	 * Off the screen, the missing checkbox is not an answer and must not switch the setting off.
	 */
	public function test_save_leaves_the_option_alone_where_the_field_does_not_render(): void {
		update_option( Sharing_Resources::OPTION, 1 );

		Sharing_Resources::save();

		$this->assertSame( 1, get_option( Sharing_Resources::OPTION ) );
	}
}
