<?php
/**
 * Tests for Cookie Consent lifecycle cleanup APIs.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for consumer-callable lifecycle cleanup.
 *
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent
 * @covers \Automattic\Jetpack\CookieConsent\Consent_Log_Controller
 * @covers \Automattic\Jetpack\CookieConsent\Consent_Log_Privacy
 */
#[CoversClass( Cookie_Consent::class )]
#[CoversClass( Consent_Log_Controller::class )]
#[CoversClass( Consent_Log_Privacy::class )]
class Lifecycle_Test extends TestCase {

	/**
	 * The CCPA page ID option.
	 *
	 * @var string
	 */
	private const CCPA_PAGE_ID_OPTION = 'jetpack_cookie_consent_ccpa_page_id';

	/**
	 * The CCPA page created-once option.
	 *
	 * @var string
	 */
	private const CCPA_PAGE_CREATED_OPTION = 'jetpack_cookie_consent_ccpa_page_created';

	/**
	 * The post meta marker for package-created CCPA pages.
	 *
	 * @var string
	 */
	private const CCPA_PAGE_CREATED_META = '_jetpack_cookie_consent_created_ccpa_page';

	/**
	 * The consent-log DB version option.
	 *
	 * @var string
	 */
	private const DB_VERSION_OPTION = 'jetpack_cookie_consent_consent_log_db_version';

	/**
	 * The consent-log cleanup cron hook.
	 *
	 * @var string
	 */
	private const CLEANUP_HOOK = 'jetpack_cookie_consent_cleanup_consent_logs';

	/**
	 * Clean lifecycle hooks after each test.
	 */
	public function tearDown(): void {
		Cookie_Consent::deactivate();
		wp_clear_scheduled_hook( self::CLEANUP_HOOK );

		parent::tearDown();
	}

	/**
	 * Deactivation unschedules cleanup without deleting retained artifacts.
	 */
	public function test_deactivate_unschedules_cleanup_and_keeps_options() {
		wp_schedule_event( time(), 'daily', self::CLEANUP_HOOK );
		update_option( self::CCPA_PAGE_ID_OPTION, 123 );
		update_option( self::CCPA_PAGE_CREATED_OPTION, 1 );
		update_option( self::DB_VERSION_OPTION, '0.0.1' );

		Cookie_Consent::deactivate();

		$this->assertFalse( wp_next_scheduled( self::CLEANUP_HOOK ) );

		// Idempotent: a second call must not error or drop retained artifacts.
		Cookie_Consent::deactivate();

		$this->assertSame( 123, get_option( self::CCPA_PAGE_ID_OPTION ) );
		$this->assertSame( 1, get_option( self::CCPA_PAGE_CREATED_OPTION ) );
		$this->assertSame( '0.0.1', get_option( self::DB_VERSION_OPTION ) );
	}

	/**
	 * Deactivation unhooks the privacy exporter/eraser filters it registered.
	 */
	public function test_deactivate_removes_privacy_filters() {
		Consent_Log_Privacy::init();

		$this->assertNotFalse( has_filter( 'wp_privacy_personal_data_exporters', array( Consent_Log_Privacy::class, 'register_exporter' ) ) );
		$this->assertNotFalse( has_filter( 'wp_privacy_personal_data_erasers', array( Consent_Log_Privacy::class, 'register_eraser' ) ) );

		Consent_Log_Controller::deactivate();

		$this->assertFalse( has_filter( 'wp_privacy_personal_data_exporters', array( Consent_Log_Privacy::class, 'register_exporter' ) ) );
		$this->assertFalse( has_filter( 'wp_privacy_personal_data_erasers', array( Consent_Log_Privacy::class, 'register_eraser' ) ) );
	}

	/**
	 * Uninstall removes the package-owned CCPA page and options.
	 */
	public function test_uninstall_deletes_ccpa_page_and_options() {
		Cookie_Consent::maybe_create_ccpa_page();
		$page_id = (int) get_option( self::CCPA_PAGE_ID_OPTION );

		$this->assertGreaterThan( 0, $page_id );
		$this->assertNotNull( get_post( $page_id ) );
		$this->assertSame( '1', get_post_meta( $page_id, self::CCPA_PAGE_CREATED_META, true ) );

		Cookie_Consent::uninstall();

		$this->assertNull( get_post( $page_id ) );

		// Idempotent: a second call must not error after the page is already gone.
		Cookie_Consent::uninstall();

		$this->assertFalse( get_option( self::CCPA_PAGE_ID_OPTION ) );
		$this->assertFalse( get_option( self::CCPA_PAGE_CREATED_OPTION ) );
	}

	/**
	 * Uninstall clears options but keeps a manually configured CCPA page.
	 */
	public function test_uninstall_keeps_manually_configured_ccpa_page() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Manual Privacy Choices',
				'post_status' => 'publish',
				'post_type'   => 'page',
			)
		);
		update_option( self::CCPA_PAGE_ID_OPTION, $page_id );

		Cookie_Consent::uninstall();

		$this->assertNotNull( get_post( $page_id ) );
		$this->assertFalse( get_option( self::CCPA_PAGE_ID_OPTION ) );
		$this->assertFalse( get_option( self::CCPA_PAGE_CREATED_OPTION ) );
	}

	/**
	 * Uninstall clears options but keeps a page adopted by the CCPA slug fallback.
	 */
	public function test_uninstall_keeps_slug_adopted_ccpa_page() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Your Privacy Choices',
				'post_name'   => 'your-privacy-choices',
				'post_status' => 'publish',
				'post_type'   => 'page',
			)
		);

		update_option( self::CCPA_PAGE_ID_OPTION, $page_id );
		update_option( self::CCPA_PAGE_CREATED_OPTION, 1 );

		$this->assertSame( '', get_post_meta( $page_id, self::CCPA_PAGE_CREATED_META, true ) );

		Cookie_Consent::uninstall();

		$this->assertNotNull( get_post( $page_id ) );
		$this->assertFalse( get_option( self::CCPA_PAGE_ID_OPTION ) );
		$this->assertFalse( get_option( self::CCPA_PAGE_CREATED_OPTION ) );
	}

	/**
	 * Uninstall keeps consent-log metadata by default.
	 */
	public function test_uninstall_keeps_consent_log_metadata_by_default() {
		update_option( self::DB_VERSION_OPTION, '0.0.1' );

		Cookie_Consent::uninstall();

		$this->assertSame( '0.0.1', get_option( self::DB_VERSION_OPTION ) );
	}

	/**
	 * Uninstall can opt into deleting consent-log metadata.
	 */
	public function test_uninstall_deletes_consent_log_metadata_when_requested() {
		update_option( self::DB_VERSION_OPTION, '0.0.1' );

		Cookie_Consent::uninstall( true );

		$this->assertFalse( get_option( self::DB_VERSION_OPTION ) );
	}
}
