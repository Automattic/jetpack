<?php
/**
 * Tests for the Jetpack_Forms entry point.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

use Automattic\Jetpack\Forms\Dashboard\Dashboard;
use WorDBless\BaseTestCase;

/**
 * Covers what load_contact_form() decides to wire up.
 */
class Jetpack_Forms_Test extends BaseTestCase {

	/**
	 * The dashboard registers on admin_menu, so ask that hook whether it is there.
	 *
	 * Dashboard::init() is the only thing the `jetpack_forms_dashboard_enable` gate
	 * controls; the menu entry, the redirects and the script enqueue all hang off it.
	 *
	 * @return bool
	 */
	private function dashboard_is_wired() {
		global $wp_filter;

		if ( empty( $wp_filter['admin_menu'] ) ) {
			return false;
		}

		foreach ( $wp_filter['admin_menu']->callbacks as $callbacks ) {
			foreach ( $callbacks as $callback ) {
				if ( ! is_array( $callback['function'] ) ) {
					continue;
				}

				$target = $callback['function'][0];

				if ( $target instanceof Dashboard || $target === Dashboard::class ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * The control half. Without it a broken assertion in the sibling test below would
	 * pass for the wrong reason — "no dashboard on admin_menu" is also what a test that
	 * never wired anything reports.
	 */
	public function test_dashboard_is_wired_by_default() {
		Jetpack_Forms::load_contact_form();

		$this->assertTrue( $this->dashboard_is_wired() );
	}

	/**
	 * `jetpack_forms_dashboard_enable` gates whether the dashboard is registered at all,
	 * which is why it survives the retirement of `jetpack_forms_alpha`. That is only
	 * worth keeping if it still works.
	 */
	public function test_dashboard_gate_returning_false_wires_nothing() {
		add_filter( 'jetpack_forms_dashboard_enable', '__return_false' );

		Jetpack_Forms::load_contact_form();

		$this->assertFalse( $this->dashboard_is_wired() );
	}
}
