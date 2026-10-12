<?php
/**
 * Expiry_Domain Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-domain.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Domain
 */
#[CoversClass( Expiry_Domain::class )]
class Expiry_Domain_Test extends \WorDBless\BaseTestCase {

	public function tear_down() {
		unset( $GLOBALS['wpcom_blog_details_domain_test_value'] );
		delete_transient( Expiry_Domain::CACHE_KEY );
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * A domain row in the shape /sites/{id}/domains returns.
	 *
	 * @param string              $domain    Domain name.
	 * @param array<string,mixed> $overrides Flags to set on the row.
	 */
	private function domain( string $domain, array $overrides = array() ): object {
		return (object) array_merge(
			array(
				'domain'                  => $domain,
				'wpcom_domain'            => false,
				'is_wpcom_staging_domain' => false,
				'primary_domain'          => false,
			),
			$overrides
		);
	}

	public function test_names_the_wpcom_address_for_a_site_on_its_staging_domain(): void {
		$domains = array(
			$this->domain( 'example.wordpress.com', array( 'wpcom_domain' => true ) ),
			$this->domain(
				'example.wpcomstaging.com',
				array(
					'is_wpcom_staging_domain' => true,
					'primary_domain'          => true,
				)
			),
		);

		$this->assertSame( 'example.wordpress.com', Expiry_Domain::pick_revert_domain( $domains ) );
	}

	public function test_names_the_wpcom_address_when_it_is_itself_primary(): void {
		$domains = array(
			$this->domain(
				'example.wordpress.com',
				array(
					'wpcom_domain'   => true,
					'primary_domain' => true,
				)
			),
		);

		$this->assertSame( 'example.wordpress.com', Expiry_Domain::pick_revert_domain( $domains ) );
	}

	public function test_says_nothing_when_a_custom_domain_is_primary(): void {
		$domains = array(
			$this->domain( 'example.wordpress.com', array( 'wpcom_domain' => true ) ),
			$this->domain( 'example.com', array( 'primary_domain' => true ) ),
		);

		$this->assertNull( Expiry_Domain::pick_revert_domain( $domains ) );
	}

	public function test_never_names_the_staging_domain(): void {
		$domains = array(
			$this->domain(
				'example.wpcomstaging.com',
				array(
					'wpcom_domain'            => true,
					'is_wpcom_staging_domain' => true,
					'primary_domain'          => true,
				)
			),
		);

		$this->assertNull( Expiry_Domain::pick_revert_domain( $domains ) );
	}

	public function test_says_nothing_when_the_list_is_unusable(): void {
		$this->assertNull( Expiry_Domain::pick_revert_domain( array() ) );
		// No primary flagged at all: we can't tell whether the site is renaming.
		$this->assertNull(
			Expiry_Domain::pick_revert_domain(
				array( $this->domain( 'example.wordpress.com', array( 'wpcom_domain' => true ) ) )
			)
		);
		$this->assertNull(
			Expiry_Domain::pick_revert_domain( array( (object) array( 'primary_domain' => true ) ) )
		);
	}

	public function test_on_simple_the_blogs_table_says_whether_the_switch_happened(): void {
		Constants::set_constant( 'IS_WPCOM', true );

		// WorDBless serves example.org, so a matching unmapped domain means the
		// site is on its own address already.
		$GLOBALS['wpcom_blog_details_domain_test_value'] = 'example.org';
		$this->assertSame( 'example.org', Expiry_Domain::get_revert_domain() );

		$GLOBALS['wpcom_blog_details_domain_test_value'] = 'unused.wordpress.com';
		$this->assertNull( Expiry_Domain::get_revert_domain() );
	}

	public function test_a_failed_lookup_is_remembered_only_briefly(): void {
		// No connected site id, so the request can't be made: the path an outage takes.
		$this->assertNull( Expiry_Domain::get_revert_domain() );

		$expires_in = (int) get_option( '_transient_timeout_' . Expiry_Domain::CACHE_KEY ) - time();
		$this->assertGreaterThan( 0, $expires_in );
		$this->assertLessThanOrEqual( Expiry_Wpcom::FAILURE_TTL, $expires_in );
	}
}
