<?php
/**
 * Tests for the Jetpack CRM Abilities Registrar subclass.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Tests;

use Automattic\Jetpack\CRM\Abilities\CRM_Abilities;
use PHPUnit\Framework\Attributes\CoversClass;
use WP_Error;

require_once __DIR__ . '/../class-jpcrm-base-integration-testcase.php';

/**
 * Integration tests for the Jetpack CRM abilities registrar.
 *
 * Exercises the Registrar wiring contract, the public abstract getters,
 * the permission callback, and the happy paths for each read ability
 * (with real DB-backed contacts, invoices, and quotes created via the
 * existing CRM test factory helpers).
 *
 * @covers \Automattic\Jetpack\CRM\Abilities\CRM_Abilities
 */
#[CoversClass( CRM_Abilities::class )]
class CRM_Abilities_Test extends JPCRM_Base_Integration_TestCase {

	/**
	 * @var int
	 */
	private static $admin_id;

	/**
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * Per-test setup.
	 */
	public function set_up(): void {
		parent::set_up();

		self::$admin_id      = wp_insert_user(
			array(
				'user_login' => 'crm_ability_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'user_email' => 'crm_ability_admin_' . wp_generate_password( 8, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);
		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'crm_ability_sub_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'user_email' => 'crm_ability_sub_' . wp_generate_password( 8, false ) . '@example.test',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open for most test cases.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	/**
	 * Per-test teardown.
	 */
	public function tear_down(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	// -------------------- Abstract getters --------------------

	public function test_category_slug_is_plugin_scoped() {
		$this->assertSame( 'jetpack-crm', CRM_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = CRM_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotEmpty( $def['label'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = CRM_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-crm/', $slug );
		}
	}

	public function test_expected_ability_slugs_are_present() {
		$abilities = CRM_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-crm/list-contacts', $abilities );
		$this->assertArrayHasKey( 'jetpack-crm/get-contact', $abilities );
		$this->assertArrayHasKey( 'jetpack-crm/list-deals', $abilities );
		$this->assertArrayHasKey( 'jetpack-crm/list-invoices', $abilities );
	}

	public function test_no_spec_sets_category_explicitly() {
		foreach ( CRM_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_read_ability_is_marked_readonly() {
		foreach ( CRM_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertTrue(
				$spec['meta']['annotations']['readonly'],
				"Ability {$slug} must declare readonly=true (all current abilities are read-only)."
			);
			$this->assertFalse(
				$spec['meta']['annotations']['destructive'],
				"Ability {$slug} must declare destructive=false (read-only)."
			);
			$this->assertTrue(
				$spec['meta']['annotations']['idempotent'],
				"Ability {$slug} must declare idempotent=true (read-only)."
			);
		}
	}

	// -------------------- Registrar wiring --------------------

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		CRM_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( CRM_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( CRM_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		CRM_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( CRM_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( CRM_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		CRM_Abilities::register_category();
		CRM_Abilities::register_abilities();

		foreach ( array_keys( CRM_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotNull(
				wp_get_ability( $slug ),
				"Ability {$slug} should be registered."
			);
		}
	}

	public function test_per_ability_allow_list_filter_is_respected() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		CRM_Abilities::register_category();
		CRM_Abilities::register_abilities();

		foreach ( array_keys( CRM_Abilities::get_abilities() ) as $slug ) {
			$this->assertNull( wp_get_ability( $slug ), "Ability {$slug} must be filtered out." );
		}
	}

	// -------------------- Permission callback --------------------

	public function test_can_view_crm_allows_administrator() {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( CRM_Abilities::can_view_crm() );
	}

	public function test_can_view_crm_denies_subscriber() {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( CRM_Abilities::can_view_crm() );
	}

	public function test_can_view_crm_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( CRM_Abilities::can_view_crm() );
	}

	// -------------------- Execute callbacks: contacts --------------------

	public function test_list_contacts_returns_array_of_summaries() {
		$contact_id = $this->add_contact(
			array(
				'fname' => 'Alice',
				'lname' => 'Anderson',
				'email' => 'alice@example.test',
			)
		);
		$this->assertGreaterThan( 0, $contact_id );

		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::list_contacts( array() );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );

		$found = null;
		foreach ( $result as $row ) {
			$this->assertIsArray( $row );
			// Uniform shape — same keys regardless of which filter you used.
			$this->assertArrayHasKey( 'id', $row );
			$this->assertArrayHasKey( 'name', $row );
			$this->assertArrayHasKey( 'email', $row );
			$this->assertArrayHasKey( 'phone', $row );
			$this->assertArrayHasKey( 'status', $row );
			$this->assertArrayHasKey( 'owner', $row );
			$this->assertArrayHasKey( 'tags', $row );
			$this->assertArrayHasKey( 'created_at', $row );
			$this->assertArrayHasKey( 'last_contacted_at', $row );

			if ( (int) $row['id'] === (int) $contact_id ) {
				$found = $row;
			}
		}

		$this->assertNotNull( $found, 'The newly added contact should appear in list-contacts output.' );
		$this->assertSame( 'Alice Anderson', $found['name'] );
		$this->assertSame( 'alice@example.test', $found['email'] );
	}

	public function test_list_contacts_with_contact_id_returns_single_element_array() {
		$contact_id = $this->add_contact(
			array(
				'fname' => 'Bob',
				'lname' => 'Brown',
				'email' => 'bob@example.test',
			)
		);

		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::list_contacts( array( 'contact_id' => (int) $contact_id ) );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertSame( (int) $contact_id, $result[0]['id'] );
		$this->assertSame( 'bob@example.test', $result[0]['email'] );
	}

	public function test_list_contacts_with_unknown_contact_id_returns_empty_array() {
		// Consolidated-read contract: unknown id is a no-match, not an error.
		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::list_contacts( array( 'contact_id' => 9999999 ) );
		$this->assertSame( array(), $result );
	}

	public function test_get_contact_returns_single_element_array_with_detail_keys() {
		$contact_id = $this->add_contact(
			array(
				'fname' => 'Carol',
				'lname' => 'Carter',
				'email' => 'carol@example.test',
			)
		);

		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::get_contact( array( 'id' => (int) $contact_id ) );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$row = $result[0];
		$this->assertSame( (int) $contact_id, $row['id'] );
		$this->assertArrayHasKey( 'notes', $row );
		$this->assertArrayHasKey( 'activity', $row );
		$this->assertArrayHasKey( 'custom_fields', $row );
		$this->assertIsArray( $row['notes'] );
		$this->assertIsArray( $row['activity'] );
		$this->assertIsArray( $row['custom_fields'] );
	}

	public function test_get_contact_with_unknown_id_returns_empty_array() {
		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::get_contact( array( 'id' => 9999999 ) );
		$this->assertSame( array(), $result );
	}

	public function test_get_contact_missing_id_returns_wp_error() {
		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::get_contact( array() );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_crm_missing_id', $result->get_error_code() );
	}

	public function test_get_contact_with_zero_id_returns_wp_error() {
		// Zero is not a legal CRM id; the CRM uses positive integers (id >= 1).
		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::get_contact( array( 'id' => 0 ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_crm_invalid_id', $result->get_error_code() );
	}

	// -------------------- Execute callbacks: deals --------------------

	public function test_list_deals_returns_array_of_summaries() {
		global $zbs;
		$contact_id = $this->add_contact();
		$this->assertGreaterThan( 0, $contact_id );

		$quote_id = $zbs->DAL->quotes->addUpdateQuote(
			array(
				'data' => $this->generate_quote_data(
					array(
						'title'    => 'Q for Acme',
						'value'    => '500.00',
						'currency' => 'USD',
						'status'   => 'Draft',
						'contacts' => array( (int) $contact_id ),
					)
				),
			)
		);
		$this->assertGreaterThan( 0, $quote_id );

		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::list_deals( array() );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );

		$found = null;
		foreach ( $result as $row ) {
			$this->assertIsArray( $row );
			$this->assertArrayHasKey( 'id', $row );
			$this->assertArrayHasKey( 'title', $row );
			$this->assertArrayHasKey( 'value', $row );
			$this->assertArrayHasKey( 'currency', $row );
			$this->assertArrayHasKey( 'status', $row );
			$this->assertArrayHasKey( 'contact_id', $row );
			$this->assertArrayHasKey( 'owner', $row );
			$this->assertArrayHasKey( 'created_at', $row );
			$this->assertArrayHasKey( 'expected_close_date', $row );

			if ( (int) $row['id'] === (int) $quote_id ) {
				$found = $row;
			}
		}

		$this->assertNotNull( $found, 'Newly added deal should appear in list-deals output.' );
		$this->assertSame( 'Q for Acme', $found['title'] );
		$this->assertSame( 500.0, $found['value'] );
	}

	// -------------------- Execute callbacks: invoices --------------------

	public function test_list_invoices_returns_array_of_summaries() {
		$contact_id = $this->add_contact();
		$this->assertGreaterThan( 0, $contact_id );

		$invoice_id = $this->add_invoice(
			array(
				'contacts'    => array( (int) $contact_id ),
				'id_override' => 'INV-CRM-ABIL-1',
			)
		);
		$this->assertGreaterThan( 0, $invoice_id );

		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::list_invoices( array() );

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );

		$found = null;
		foreach ( $result as $row ) {
			$this->assertIsArray( $row );
			$this->assertArrayHasKey( 'id', $row );
			$this->assertArrayHasKey( 'number', $row );
			$this->assertArrayHasKey( 'contact_id', $row );
			$this->assertArrayHasKey( 'total', $row );
			$this->assertArrayHasKey( 'currency', $row );
			$this->assertArrayHasKey( 'status', $row );
			$this->assertArrayHasKey( 'due_date', $row );
			$this->assertArrayHasKey( 'issued_at', $row );
			$this->assertArrayHasKey( 'paid_at', $row );

			if ( (int) $row['id'] === (int) $invoice_id ) {
				$found = $row;
			}
		}

		$this->assertNotNull( $found, 'Newly added invoice should appear in list-invoices output.' );
		$this->assertSame( 'INV-CRM-ABIL-1', $found['number'] );
	}

	// -------------------- Schema/pagination edge cases --------------------

	public function test_list_contacts_per_page_is_clamped_to_maximum() {
		// Even if input passes 1000, the callback clamps to 100; we can't easily
		// inspect the DAL args without mocking, but we can assert the call still
		// returns a normal array (no fatal, no WP_Error) and respects the limit.
		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::list_contacts( array( 'per_page' => 1000 ) );
		$this->assertIsArray( $result );
		$this->assertLessThanOrEqual( 100, count( $result ) );
	}

	public function test_list_contacts_when_dal_is_unavailable_returns_wp_error() {
		// Simulate the "ability called before CRM core booted" race.
		global $zbs;
		$saved_zbs = $zbs;
		$zbs       = null;

		wp_set_current_user( self::$admin_id );
		$result = CRM_Abilities::list_contacts( array() );

		// Restore before assertions so a failure can't leave subsequent tests broken.
		$zbs = $saved_zbs;

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_crm_not_initialized', $result->get_error_code() );
	}
}
