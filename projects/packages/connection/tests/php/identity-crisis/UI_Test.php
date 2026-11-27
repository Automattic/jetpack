<?php
/**
 * Tests the UI class in the Identity_Crisis package.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\IdentityCrisis;

use Automattic\Jetpack\Connection\Plugin_Storage;
use PHPUnit\Framework\Attributes\DataProvider;
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
		$_SERVER['REQUEST_URI'] = '';
	}

	/**
	 * Reset the static consumers property in the UI class.
	 */
	private function reset_static_consumers() {
		$reflection = new ReflectionClass( UI::class );
		$property   = $reflection->getProperty( 'consumers' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Mock function for jetpack_idc_consumers filter
	 *
	 * @param array $consumers The consumer array (empty by default).
	 * @return array The mocked consumers.
	 */
	public function get_mock_consumers( $consumers ) {
		// PHPUnit 10+ renamed `getName()` to `name()`.
		// @phan-suppress-next-line PhanUndeclaredMethod -- `getName()` exists (PHPUnit <10) if `name()` doesn't (PHPUnit 10+).
		$test_name = is_callable( array( $this, 'name' ) ) ? $this->name() : $this->getName();

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

	/**
	 * Priority-only selection must not attribute shared-page recovery to another plugin.
	 *
	 * @dataProvider consumer_source_provider
	 * @param array       $consumers Registered consumers.
	 * @param string      $uri Current admin request.
	 * @param string      $expected_slug Selected notice consumer.
	 * @param string|null $expected_from Eligible authorization source.
	 */
	#[DataProvider( 'consumer_source_provider' )]
	public function test_consumer_authorization_source( $consumers, $uri, $expected_slug, $expected_from ) {
		$filter = static function () use ( $consumers ) {
			return $consumers;
		};
		add_filter( 'jetpack_idc_consumers', $filter, 20 );
		$_SERVER['REQUEST_URI'] = $uri;
		try {
			$result = UI::get_consumer_data();
			$this->assertSame( $expected_slug, $result['slug'] );
			$this->assertSame( $expected_from, $result['from'] ?? null );
			$this->assertSame( $expected_slug, $result['logo'] );
			$this->assertSame( array( 'headerText' => $expected_slug ), $result['customContent'] );
			$this->assertSame( $result, UI::get_consumer_data(), 'The cached selection keeps the same source policy.' );
		} finally {
			remove_filter( 'jetpack_idc_consumers', $filter, 20 );
		}
	}

	/** A standalone plugin cannot claim a connection initiated on Plugins. */
	public function test_single_connected_consumer_keeps_default_on_shared_page() {
		$storage = new ReflectionClass( Plugin_Storage::class );
		$saved   = array();
		foreach ( array(
			'configured'      => true,
			'plugins'         => array( 'standalone' => array() ),
			'current_blog_id' => get_current_blog_id(),
		) as $name => $value ) {
			$property = $storage->getProperty( $name );
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$saved[] = array( $property, $property->getValue() );
			$property->setValue( null, $value );
		}
		$filter = static function () {
			return array(
				array(
					'slug'       => 'standalone',
					'admin_page' => '/wp-admin/admin.php?page=standalone',
					'from'       => 'standalone_safe_mode',
				),
			);
		};
		add_filter( 'jetpack_idc_consumers', $filter, 20 );
		$_SERVER['REQUEST_URI'] = '/wp-admin/plugins.php';
		try {
			$this->assertArrayNotHasKey( 'from', UI::get_consumer_data() );
		} finally {
			remove_filter( 'jetpack_idc_consumers', $filter, 20 );
			foreach ( $saved as list( $property, $value ) ) {
				$property->setValue( null, $value );
			}
		}
	}

	/**
	 * Only a matching consumer page identifies the owner of a recovery connection.
	 *
	 * @return array
	 */
	public static function consumer_source_provider() {
		$first          = array(
			'slug'          => 'first',
			'admin_page'    => '/wp-admin/admin.php?page=first',
			'priority'      => 1,
			'from'          => 'first_safe_mode',
			'logo'          => 'first',
			'customContent' => array( 'headerText' => 'first' ),
		);
		$second         = array(
			'slug'          => 'second',
			'admin_page'    => '/wp-admin/admin.php?page=second',
			'priority'      => 20,
			'from'          => 'second_safe_mode',
			'logo'          => 'second',
			'customContent' => array( 'headerText' => 'second' ),
		);
		$without_source = $second;
		unset( $without_source['from'] );

		return array(
			'matched page beats priority'                 => array( array( $first, $second ), '/wp-admin/admin.php?page=second', 'second', 'second_safe_mode' ),
			'single consumer on its own page'             => array( array( $second ), '/wp-admin/admin.php?page=second', 'second', 'second_safe_mode' ),
			'single consumer on Marketing'                => array( array( $second ), '/wp-admin/admin.php?page=wc-admin&path=/marketing', 'second', null ),
			'single consumer on Plugins'                  => array( array( $second ), '/wp-admin/plugins.php', 'second', null ),
			'single consumer on another plugin dashboard' => array( array( $second ), '/wp-admin/admin.php?page=jetpack-backup', 'second', null ),
			'multiple consumers on Plugins'               => array( array( $first, $second ), '/wp-admin/plugins.php', 'first', null ),
			'multiple consumers on Marketing'             => array( array( $first, $second ), '/wp-admin/admin.php?page=wc-admin&path=/marketing', 'first', null ),
			'consumer without source still counts'        => array( array( $first, $without_source ), '/wp-admin/index.php', 'first', null ),
			'matched consumer without source keeps default' => array( array( $first, $without_source ), '/wp-admin/admin.php?page=second', 'second', null ),
		);
	}
}
