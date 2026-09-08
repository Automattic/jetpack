<?php
/**
 * Expiry_Domain Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-domain.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Domain
 */
#[CoversClass( Expiry_Domain::class )]
class Expiry_Domain_Test extends \WorDBless\BaseTestCase {

	/**
	 * Build a domain row in the shape /sites/{id}/domains returns.
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
		// The revert keeps a real custom domain and only repoints its A records,
		// so there is no rename to warn about.
		$domains = array(
			$this->domain( 'example.wordpress.com', array( 'wpcom_domain' => true ) ),
			$this->domain( 'example.com', array( 'primary_domain' => true ) ),
		);

		$this->assertNull( Expiry_Domain::pick_revert_domain( $domains ) );
	}

	public function test_never_names_the_staging_domain(): void {
		// `*.wpcomstaging.com` is an Atomic hosting artifact whose mapping the
		// revert deletes, so it is never what the site ends up called.
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

	public function test_handles_a_managed_subdomain_site(): void {
		// wpcom hides the .wordpress.com row when a managed subdomain (.blog and
		// friends) is mapped, so the wpcom row is the fallback in both cases and
		// this needs no special handling -- but it must not regress.
		$domains = array(
			$this->domain(
				'example.home.blog',
				array(
					'wpcom_domain'   => true,
					'primary_domain' => true,
				)
			),
		);

		$this->assertSame( 'example.home.blog', Expiry_Domain::pick_revert_domain( $domains ) );
	}

	public function test_says_nothing_when_the_list_is_unusable(): void {
		$this->assertNull( Expiry_Domain::pick_revert_domain( array() ) );
		// No primary flagged at all: we can't tell whether the site is renaming.
		$this->assertNull(
			Expiry_Domain::pick_revert_domain(
				array( $this->domain( 'example.wordpress.com', array( 'wpcom_domain' => true ) ) )
			)
		);
		// A row with no usable domain string is skipped rather than fatal.
		$this->assertNull(
			Expiry_Domain::pick_revert_domain( array( (object) array( 'primary_domain' => true ) ) )
		);
	}

	public function test_a_failed_lookup_is_not_cached_as_an_answer(): void {
		// No connected site id here, so the request can't be made -- the same
		// path an outage takes. "We couldn't ask" must expire quickly; caching it
		// for CACHE_TTL would drop the domain line for half a day over one blip.
		delete_transient( Expiry_Domain::CACHE_KEY );

		$this->assertNull( Expiry_Domain::get_revert_domain() );

		$expires_in = (int) get_option( '_transient_timeout_' . Expiry_Domain::CACHE_KEY ) - time();
		$this->assertGreaterThan( 0, $expires_in );
		$this->assertLessThanOrEqual( Expiry_Domain::FAILURE_TTL, $expires_in );
		$this->assertLessThan( Expiry_Domain::CACHE_TTL, $expires_in );

		delete_transient( Expiry_Domain::CACHE_KEY );
	}
}
