<?php
/**
 * Tests for the Protect dashboard's section registry.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'modules/protect-dashboard/class-jetpack-protect-dashboard.php';

/**
 * @covers \Jetpack_Protect_Dashboard
 */
#[CoversClass( Jetpack_Protect_Dashboard::class )]
class Jetpack_Protect_Dashboard_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Start with no sections.
	 */
	public function set_up() {
		parent::set_up();
		self::reset_sections();
	}

	/**
	 * Leave no sections behind.
	 */
	public function tear_down() {
		self::reset_sections();
		parent::tear_down();
	}

	/**
	 * Empty the private section registry.
	 */
	private static function reset_sections() {
		$sections = new ReflectionProperty( Jetpack_Protect_Dashboard::class, 'sections' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$sections->setAccessible( true );
		}
		$sections->setValue( null, array() );
	}

	/**
	 * Build a section double.
	 *
	 * @param string $key            Section key.
	 * @param array  $state          Section state.
	 * @param bool   $expects_routes Whether the section must be asked for its routes once.
	 * @return Jetpack_Protect_Dashboard_Section
	 */
	private function make_section( $key, $state, $expects_routes = false ) {
		$section = $expects_routes
			? $this->createMock( Jetpack_Protect_Dashboard_Section::class )
			: $this->createStub( Jetpack_Protect_Dashboard_Section::class );
		$section->method( 'get_key' )->willReturn( $key );
		$section->method( 'get_state' )->willReturn( $state );
		if ( $expects_routes ) {
			$section->expects( $this->once() )->method( 'register_routes' );
		}
		return $section;
	}

	/**
	 * Test that a second section with a registered key is refused.
	 */
	public function test_register_section_keeps_the_first_section_for_a_key() {
		$this->setExpectedIncorrectUsage( 'Jetpack_Protect_Dashboard::register_section' );

		Jetpack_Protect_Dashboard::register_section( $this->make_section( 'scan', array( 'order' => 'first' ) ) );
		Jetpack_Protect_Dashboard::register_section( $this->make_section( 'scan', array( 'order' => 'second' ) ) );

		$this->assertSame( array( 'scan' => array( 'order' => 'first' ) ), Jetpack_Protect_Dashboard::get_initial_state() );
	}

	/**
	 * Test that every section contributes its state and its REST routes.
	 */
	public function test_sections_provide_state_by_key_and_register_routes() {
		$scan    = $this->make_section( 'scan', array( 'threats' => 2 ), true );
		$monitor = $this->make_section( 'monitor', array( 'active' => true ), true );

		Jetpack_Protect_Dashboard::register_section( $scan );
		Jetpack_Protect_Dashboard::register_section( $monitor );
		Jetpack_Protect_Dashboard::register_rest_routes();

		$this->assertSame(
			array(
				'scan'    => array( 'threats' => 2 ),
				'monitor' => array( 'active' => true ),
			),
			Jetpack_Protect_Dashboard::get_initial_state()
		);
	}
}
