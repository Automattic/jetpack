<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * This file was copied and adapted from the Jetpack plugin on Jan 2022
 */
// phpcs:disable Squiz.Commenting, Generic.Commenting  -- Tests should be self documenting

namespace Automattic\Jetpack;

use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WP_Error;

/**
 * Contains the tests for the Jetpack_Plan class.
 */
class WP_Test_Jetpack_Plan extends TestCase {

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		delete_option( 'jetpack_active_plan' );
	}

	public function test_update_from_sites_response_failure_to_update() {
		update_option( 'jetpack_active_plan', $this->get_free_plan(), true );

		$option = get_option( 'jetpack_active_plan' );
		$this->assertSame( 'jetpack_free', $option['product_slug'] );

		// Set up an issue where the value in cache does not match the DB, so the DB update fails.
		Jetpack_Options::update_raw_option( 'jetpack_active_plan', $this->get_personal_plan(), true );

		$this->assertTrue( Jetpack_Plan::update_from_sites_response( $this->get_response_personal_plan() ) );
	}

	/**
	 * @dataProvider get_update_from_sites_response_data
	 */
	public function test_update_from_sites_response( $response, $expected_plan_slug_after, $expected_return, $initial_option = null ) {

		if ( $initial_option !== null ) {
			update_option( 'jetpack_active_plan', $initial_option, true );
		}

		$this->assertSame( $expected_return, Jetpack_Plan::update_from_sites_response( $response ) );

		$plan = Jetpack_Plan::get();
		$this->assertSame( $expected_plan_slug_after, $plan['product_slug'] );
	}

	public function get_update_from_sites_response_data() {
		return array(
			'is_errored_response'                    => array(
				$this->get_errored_sites_response(),
				'jetpack_free',
				false,
			),
			'response_is_empty'                      => array(
				$this->get_mocked_response( 200, '' ),
				'jetpack_free',
				false,
			),
			'response_does_not_have_body'            => array(
				array( 'code' => 400 ),
				'jetpack_free',
				false,
			),
			'response_does_not_have_plan'            => array(
				array(
					'code' => 200,
					array(),
				),
				'jetpack_free',
				false,
			),
			'initially_empty_option_to_free'         => array(
				$this->get_response_free_plan(),
				'jetpack_free',
				true,
			),
			'initially_empty_to_personal'            => array(
				$this->get_response_personal_plan(),
				'jetpack_personal',
				true,
			),
			'initially_free_to_personal'             => array(
				$this->get_response_personal_plan(),
				'jetpack_personal',
				true,
				$this->get_free_plan(),
			),
			'initially_personal_to_free'             => array(
				$this->get_response_free_plan(),
				'jetpack_free',
				true,
				$this->get_personal_plan(),
			),
			'initially_free_no_change'               => array(
				$this->get_response_free_plan(),
				'jetpack_free',
				false,
				$this->get_free_plan(),
			),
			'initially_personal_to_changed_personal' => array(
				$this->get_response_changed_personal_plan(),
				'jetpack_personal',
				true,
				$this->get_response_personal_plan(),
			),
		);
	}

	private function get_response_free_plan() {
		return $this->get_successful_plan_response( $this->get_free_plan() );
	}

	private function get_response_personal_plan() {
		return $this->get_successful_plan_response( $this->get_personal_plan() );
	}

	private function get_response_changed_personal_plan() {
		return $this->get_successful_plan_response( $this->get_changed_personal_plan() );
	}

	private function get_successful_plan_response( $plan_response ) {
		$body = wp_json_encode(
			array(
				'plan' => $plan_response,
			)
		);
		return $this->get_mocked_response( 200, $body );
	}

	private function get_errored_sites_response() {
		return $this->get_mocked_response( 400, new WP_Error() );
	}

	private function get_mocked_response( $code, $body ) {
		return array(
			'code' => $code,
			'body' => $body,
		);
	}

	private function get_free_plan() {
		return array(
			'product_id'         => 2002,
			'product_slug'       => 'jetpack_free',
			'product_name_short' => 'Free',
			'expired'            => false,
			'user_is_owner'      => false,
			'is_free'            => true,
			'features'           => array(
				'active' => array(
					'akismet',
					'support',
				),
			),
		);
	}

	private function get_changed_personal_plan() {
		$changed_personal_plan = $this->get_personal_plan();

		$changed_personal_plan['features']['active'][] = 'test_feature';
		return $changed_personal_plan;
	}

	private function get_personal_plan() {
		return array(
			'product_id'         => 2005,
			'product_slug'       => 'jetpack_personal',
			'product_name_short' => 'Personal',
			'expired'            => false,
			'user_is_owner'      => false,
			'is_free'            => false,
			'features'           => array(
				'active' => array(
					'support',
				),
			),
		);
	}
}

// phpcs:enable
