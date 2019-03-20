<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

// phpcs:disable Squiz.Commenting, Generic.Commenting  -- Tests should be self documenting

/**
 * Contains the tests for the Jetpack_Plan class.
 */
class WP_Test_Jetpack_Plan extends WP_UnitTestCase {
	public function setUp() {
		delete_option( 'jetpack_active_plan' );
		delete_option( 'show_welcome_for_new_plan' );
	}

	/**
	 * @dataProvider get_update_from_sites_response_data
	 */
	public function test_update_from_sites_response( $response, $expected_plan_slug_after, $expected_return, $initial_option = null ) {
		if ( ! is_null( $initial_option ) ) {
			update_option( 'jetpack_active_plan', $initial_option );
		}

		$this->assertSame( $expected_return, Jetpack_Plan::update_from_sites_response( $response ) );

		$plan = Jetpack_Plan::get();
		$this->assertSame( $expected_plan_slug_after, $plan['product_slug'] );
	}

	public function get_update_from_sites_response_data() {
		return array(
			'is_errored_response'            => array(
				$this->get_errored_sites_response(),
				'jetpack_free',
				false,
			),
			'response_is_empty'              => array(
				$this->get_mocked_response( 200, '' ),
				'jetpack_free',
				false,
			),
			'response_does_not_have_body'    => array(
				array( 'code' => 400 ),
				'jetpack_free',
				false,
			),
			'response_does_not_have_plan'    => array(
				array(
					'code' => 200,
					array(),
				),
				'jetpack_free',
				false,
			),
			'initially_empty_option_to_free' => array(
				$this->get_response_free_plan(),
				'jetpack_free',
				true,
			),
			'initially_empty_to_personal'    => array(
				$this->get_response_personal_plan(),
				'jetpack_personal',
				true,
			),
			'initially_free_to_personal'     => array(
				$this->get_response_personal_plan(),
				'jetpack_personal',
				true,
				$this->get_free_plan(),
			),
			'initially_personal_to_free'     => array(
				$this->get_response_free_plan(),
				'jetpack_free',
				true,
				$this->get_personal_plan(),
			),
		);
	}

	private function get_response_free_plan() {
		return $this->get_successful_plan_response( $this->get_free_plan() );
	}

	private function get_response_personal_plan() {
		return $this->get_successful_plan_response( $this->get_personal_plan() );
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
		return [
			'product_id' => 2002,
			'product_slug' => 'jetpack_free',
			'product_name_short' => 'Free',
			'expired' => false,
			'user_is_owner' => false,
			'is_free' => true,
			'features' => [
				'active' => [
					'akismet',
					'support',
				],
				'available' => [
					'akismet' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'vaultpress-backups' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'vaultpress-backup-archive' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'vaultpress-storage-space' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'vaultpress-automated-restores' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'simple-payments' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'support' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_personal',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
						'jetpack_personal_monthly',
					],
					'premium-themes' => [
						'jetpack_business',
						'jetpack_business_monthly',
					],
					'vaultpress-security-scanning' => [
						'jetpack_business',
						'jetpack_business_monthly',
					],
					'polldaddy' => [
						'jetpack_business',
						'jetpack_business_monthly',
					],
				],
			],
		];
	}

	private function get_personal_plan() {
		return [
			'product_id' => 2005,
			'product_slug' => 'jetpack_personal',
			'product_name_short' => 'Personal',
			'expired' => false,
			'user_is_owner' => false,
			'is_free' => false,
			'features' => [
				'active' => [
					'support',
				],
				'available' => [
					'akismet' => [
						'jetpack_free',
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'support' => [
						'jetpack_free',
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
						'jetpack_personal_monthly',
					],
					'vaultpress-backups' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'vaultpress-backup-archive' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'vaultpress-storage-space' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'vaultpress-automated-restores' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'simple-payments' => [
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					],
					'premium-themes' => [
						'jetpack_business',
						'jetpack_business_monthly',
					],
					'vaultpress-security-scanning' => [
						'jetpack_business',
						'jetpack_business_monthly',
					],
					'polldaddy' => [
						'jetpack_business',
						'jetpack_business_monthly',
					],
				],
			],
		];
	}
}

// phpcs:enable
