<?php
/**
 * Feature visibility filter tests.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Feature_Visibility class.
 */
class Feature_Visibility_Test extends TestCase {

	/**
	 * States the host filter should apply, keyed by slug.
	 *
	 * @var array
	 */
	private $host_states = array();

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter( 'jetpack_my_jetpack_feature_visibility', array( $this, 'apply_host_states' ) );
	}

	/**
	 * Returning the environment to its previous state.
	 */
	public function tearDown(): void {
		remove_filter( 'jetpack_my_jetpack_feature_visibility', array( $this, 'apply_host_states' ) );
		$this->host_states = array();

		parent::tearDown();
	}

	/**
	 * Stands in for a host's mu-plugin.
	 *
	 * @param array $states The state map.
	 * @return array
	 */
	public function apply_host_states( $states ) {
		return array_merge( $states, $this->host_states );
	}

	/**
	 * Nothing is hidden until a host says so.
	 */
	public function test_nothing_is_hidden_by_default() {
		$this->assertSame( array(), Feature_Visibility::get_hidden() );
	}

	/**
	 * A host can hide a product card and a module row by slug.
	 */
	public function test_host_can_hide_products_and_modules() {
		$this->host_states = array(
			'search'       => Admin_Menu::VISIBILITY_HIDDEN,
			'activity-log' => Admin_Menu::VISIBILITY_HIDDEN,
		);

		$this->assertSame( array( 'search', 'activity-log' ), Feature_Visibility::get_hidden() );
	}

	/**
	 * Any state other than hidden leaves the item listed.
	 */
	public function test_only_the_hidden_state_hides() {
		$this->host_states = array(
			'stats'  => Admin_Menu::VISIBILITY_DEFAULT,
			'boost'  => 'pinned',
			'backup' => Admin_Menu::VISIBILITY_HIDDEN,
		);

		$this->assertSame( array( 'backup' ), Feature_Visibility::get_hidden() );
	}

	/**
	 * A host returning something that isn't a map hides nothing.
	 */
	public function test_malformed_filter_return_hides_nothing() {
		add_filter( 'jetpack_my_jetpack_feature_visibility', '__return_false', 20 );

		$hidden = Feature_Visibility::get_hidden();

		remove_filter( 'jetpack_my_jetpack_feature_visibility', '__return_false', 20 );

		$this->assertSame( array(), $hidden );
	}
}
