<?php
/**
 * Test file for Automattic\Jetpack\Sync\Modules\Options
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Class Options_Module_Test
 *
 * @covers Automattic\Jetpack\Sync\Modules\Options
 */
#[CoversClass( Modules\Options::class )]
class Options_Module_Test extends BaseTestCase {

	/**
	 * The Options sync module instance.
	 *
	 * @var Modules\Options
	 */
	private $options_module;

	/**
	 * Runs before every test in this class.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->options_module = new Modules\Options();
		$this->options_module->set_options_whitelist( array( 'test_option' ) );
	}

	/**
	 * Runs after every test in this class.
	 */
	protected function tearDown(): void {
		remove_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_late_sync_option' ) );
		delete_option( 'late_sync_option' );
		parent::tearDown();
	}

	/**
	 * Late sync option whitelist entries should be added to the cached module whitelist.
	 */
	public function test_set_late_default_adds_late_sync_options_whitelist_entries() {
		add_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_late_sync_option' ) );

		$this->assertNotContains( 'late_sync_option', $this->options_module->get_options_whitelist() );

		$this->options_module->set_late_default();

		$this->assertContains( 'late_sync_option', $this->options_module->get_options_whitelist() );

		update_option( 'late_sync_option', 'enabled' );
		$options = $this->options_module->get_all_options();

		$this->assertSame( 'enabled', $options['late_sync_option'] );
	}

	/**
	 * Adds an option through the sync-specific option whitelist filter.
	 *
	 * @param array $options Option names.
	 * @return array
	 */
	public function add_late_sync_option( array $options ) {
		$options[] = 'late_sync_option';
		return $options;
	}
}
