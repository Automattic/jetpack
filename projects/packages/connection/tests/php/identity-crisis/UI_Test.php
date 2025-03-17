<?php
/**
 * Tests the UI class in the Identity_Crisis package.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\IdentityCrisis;

use PHPUnit\Framework\TestCase;
use ReflectionClass;

/**
 * Unit tests for the UI class.
 */
class UI_Test extends TestCase {

	/**
	 * Setup before each test
	 */
	public function setUp(): void {
		parent::setUp();
		$this->reset_static_consumers();

		// Set up a mock for apply_filters
		add_filter( 'jetpack_idc_consumers', array( $this, 'get_mock_consumers' ) );
	}

	/**
	 * Teardown after each test
	 */
	public function tearDown(): void {
		parent::tearDown();
		$this->reset_static_consumers();

		// Remove the filter
		remove_filter( 'jetpack_idc_consumers', array( $this, 'get_mock_consumers' ) );

		// Clear any $_SERVER variables we set
		if ( isset( $_SERVER['REQUEST_URI'] ) ) {
			unset( $_SERVER['REQUEST_URI'] );
		}
	}

	/**
	 * Reset the static consumers property in the UI class.
	 */
	private function reset_static_consumers() {
		$reflection = new ReflectionClass( UI::class );
		$property   = $reflection->getProperty( 'consumers' );
		$property->setAccessible( true );
		$property->setValue( null, null );
		$property->setAccessible( false );
	}

	/**
	 * Mock function for jetpack_idc_consumers filter
	 *
	 * @param array $consumers The consumer array (empty by default).
	 * @return array The mocked consumers.
	 */
	public function get_mock_consumers( $consumers ) {
		$test_name = $this->getName();

		// The mock consumers array will be determined by the current test
		if ( $test_name === 'test_get_consumer_data_with_single_consumer' ) {
			return array(
				array(
					'slug'       => 'jetpack',
					'admin_page' => '/wp-admin/admin.php?page=jetpack',
				),
			);
		} elseif ( $test_name === 'test_get_consumer_data_with_two_consumers' ) {
			return array(
				array(
					'slug'       => 'jetpack',
					'admin_page' => '/wp-admin/admin.php?page=jetpack',
				),
				array(
					'slug'       => 'woocommerce-payments',
					'admin_page' => '/wp-admin/admin.php?page=wc-admin',
					'priority'   => 5,
				),
			);
		} elseif ( $test_name === 'test_get_consumer_data_with_request_uri_match' ) {
			return array(
				array(
					'slug'       => 'jetpack',
					'admin_page' => '/wp-admin/admin.php?page=jetpack',
				),
				array(
					'slug'       => 'woocommerce-payments',
					'admin_page' => '/wp-admin/admin.php?page=wc-admin',
					'priority'   => 5,
				),
			);
		} elseif ( $test_name === 'test_get_consumer_data_with_customContent' ) {
			return array(
				array(
					'slug'          => 'woocommerce-payments',
					'customContent' => array(
						'headerText'                => 'Safe Mode',
						'mainTitle'                 => 'Safe Mode activated',
						'mainBodyText'              => 'Test body text',
						'migratedTitle'             => 'WooPayments connection successfully transferred',
						'migratedBodyText'          => 'Safe Mode has been deactivated and WooPayments is fully functional.',
						'migrateCardTitle'          => 'Transfer connection',
						'migrateButtonLabel'        => 'Transfer your connection',
						'startFreshCardTitle'       => 'Create a new connection',
						'startFreshButtonLabel'     => 'Create a new connection',
						'nonAdminTitle'             => 'Safe Mode activated',
						'nonAdminBodyText'          => 'Test non-admin body text',
						'supportURL'                => 'https://woocommerce.com/document/woopayments/testing-and-troubleshooting/safe-mode/',
						'adminBarSafeModeLabel'     => 'WooPayments Safe Mode',
						'stayInSafeModeButtonLabel' => 'Stay in Safe Mode',
						'safeModeTitle'             => 'Stay in Safe Mode',
						'dynamicSiteUrlText'        => 'Dynamic text',
						'dynamicSiteUrlSupportLink' => 'https://woocommerce.com/document/woopayments/testing-and-troubleshooting/safe-mode/#dynamic-site-urls',
						'migrateCardBodyText'       => 'Transfer your WooPayments connection from /other.com to this site bird.com. /other.com will be disconnected from WooPayments.',
						'startFreshCardBodyText'    => 'Test fresh text',
						'startFreshCardBodyTextDev' => 'Test fresh dev text',
						'safeModeCardBodyText'      => 'Test safe mode text',
					),
					'admin_page'    => '/wp-admin/admin.php?page=wc-admin',
					'priority'      => 5,
				),
				array(
					'slug'       => 'jetpack',
					'admin_page' => '/wp-admin/admin.php?page=jetpack',
				),
			);
		}

		return $consumers;
	}

	/**
	 * Test the get_consumer_data method with a single consumer
	 */
	public function test_get_consumer_data_with_single_consumer() {
		// No REQUEST_URI set, so we expect the only consumer to be returned
		$result = UI::get_consumer_data();

		$expected = array(
			'slug'       => 'jetpack',
			'admin_page' => '/wp-admin/admin.php?page=jetpack',
		);

		$this->assertSame(
			$expected,
			$result,
			'Should return the first consumer when there is only one'
		);
	}

	/**
	 * Test the get_consumer_data method with two consumers
	 */
	public function test_get_consumer_data_with_two_consumers() {
		// No REQUEST_URI set, so we expect the consumer with highest priority to be returned
		$result = UI::get_consumer_data();

		$expected = array(
			'slug'       => 'woocommerce-payments',
			'admin_page' => '/wp-admin/admin.php?page=wc-admin',
			'priority'   => 5,
		);

		$this->assertSame(
			$expected,
			$result,
			'Should return the consumer with the highest priority when there are multiple consumers'
		);
	}

	/**
	 * Test the get_consumer_data method with REQUEST_URI matching a specific consumer
	 */
	public function test_get_consumer_data_with_request_uri_match() {
		// Set up the _SERVER variable
		$_SERVER['REQUEST_URI'] = '/wp-admin/admin.php?page=jetpack';

		// We expect the matching consumer (jetpack) to be returned despite the priority
		$result = UI::get_consumer_data();

		$expected = array(
			'slug'       => 'jetpack',
			'admin_page' => '/wp-admin/admin.php?page=jetpack',
		);

		$this->assertSame(
			$expected,
			$result,
			'Should return the consumer that matches the REQUEST_URI regardless of priority'
		);
	}

	/**
	 * Test the get_consumer_data method with a consumer having customContent
	 */
	public function test_get_consumer_data_with_customContent() {
		// When customContent is not callable, it should pass through unchanged
		$result = UI::get_consumer_data();

		$expected = array(
			'slug'          => 'woocommerce-payments',
			'customContent' => array(
				'headerText'                => 'Safe Mode',
				'mainTitle'                 => 'Safe Mode activated',
				'mainBodyText'              => 'Test body text',
				'migratedTitle'             => 'WooPayments connection successfully transferred',
				'migratedBodyText'          => 'Safe Mode has been deactivated and WooPayments is fully functional.',
				'migrateCardTitle'          => 'Transfer connection',
				'migrateButtonLabel'        => 'Transfer your connection',
				'startFreshCardTitle'       => 'Create a new connection',
				'startFreshButtonLabel'     => 'Create a new connection',
				'nonAdminTitle'             => 'Safe Mode activated',
				'nonAdminBodyText'          => 'Test non-admin body text',
				'supportURL'                => 'https://woocommerce.com/document/woopayments/testing-and-troubleshooting/safe-mode/',
				'adminBarSafeModeLabel'     => 'WooPayments Safe Mode',
				'stayInSafeModeButtonLabel' => 'Stay in Safe Mode',
				'safeModeTitle'             => 'Stay in Safe Mode',
				'dynamicSiteUrlText'        => 'Dynamic text',
				'dynamicSiteUrlSupportLink' => 'https://woocommerce.com/document/woopayments/testing-and-troubleshooting/safe-mode/#dynamic-site-urls',
				'migrateCardBodyText'       => 'Transfer your WooPayments connection from /other.com to this site bird.com. /other.com will be disconnected from WooPayments.',
				'startFreshCardBodyText'    => 'Test fresh text',
				'startFreshCardBodyTextDev' => 'Test fresh dev text',
				'safeModeCardBodyText'      => 'Test safe mode text',
			),
			'admin_page'    => '/wp-admin/admin.php?page=wc-admin',
			'priority'      => 5,
		);

		$this->assertSame(
			$expected,
			$result,
			'Should return the consumer with customContent unchanged when it is not callable'
		);
	}
}
