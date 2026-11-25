<?php
/**
 * Tests for Dns_Providers.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Send\Dns_Providers
 */
#[CoversClass( Dns_Providers::class )]
class Dns_Providers_Test extends BaseTestCase {

	/**
	 * The dashboard's provider list.
	 *
	 * @return array[]
	 */
	private static function json_providers() {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local file.
		return json_decode( file_get_contents( __DIR__ . '/../../_inc/data/providers.json' ), true );
	}

	/**
	 * The PHP copy lists the same providers, names, patterns, match modes and Domain Connect hosts as the dashboard.
	 */
	public function test_php_copy_matches_providers_json() {
		$json = self::json_providers();
		$this->assertSame( array_column( $json, 'slug' ), array_keys( Dns_Providers::PROVIDERS ) );

		foreach ( $json as $entry ) {
			$php = Dns_Providers::PROVIDERS[ $entry['slug'] ];
			$this->assertSame( $entry['name'], $php['name'], $entry['slug'] );
			$this->assertSame( $entry['nsPatterns'], $php['ns'], $entry['slug'] );
			$this->assertSame( $entry['nsMatch'] ?? 'suffix', $php['match'], $entry['slug'] );
			$this->assertSame( $entry['domainConnectHost'] ?? null, Dns_Providers::DOMAIN_CONNECT_HOSTS[ $entry['slug'] ] ?? null, $entry['slug'] );
		}
	}

	/**
	 * Every pattern in providers.json identifies its own provider.
	 *
	 * @dataProvider provide_json_nameservers
	 * @param string $nameserver Nameserver built from a pattern.
	 * @param string $slug       Provider it belongs to.
	 */
	#[DataProvider( 'provide_json_nameservers' )]
	public function test_each_json_pattern_matches_its_provider( $nameserver, $slug ) {
		$this->assertSame( $slug, Dns_Providers::match_nameserver( $nameserver ) );
	}

	/**
	 * One nameserver per pattern in providers.json.
	 *
	 * @return array
	 */
	public static function provide_json_nameservers() {
		$cases = array();
		foreach ( self::json_providers() as $entry ) {
			foreach ( $entry['nsPatterns'] as $pattern ) {
				if ( 'substring' === ( $entry['nsMatch'] ?? 'suffix' ) ) {
					$nameserver = 'ns-1' . $pattern . '12.org';
				} else {
					$nameserver = '.' === $pattern[0] ? 'ns1' . $pattern : $pattern;
				}
				$cases[ $entry['slug'] . ' ' . $pattern ] = array( $nameserver, $entry['slug'] );
			}
		}
		return $cases;
	}

	/**
	 * Real-world nameservers, including near misses that must not match.
	 *
	 * @dataProvider provide_nameservers
	 * @param string      $nameserver Nameserver.
	 * @param string|null $expected   Slug or null.
	 */
	#[DataProvider( 'provide_nameservers' )]
	public function test_match_nameserver( $nameserver, $expected ) {
		$this->assertSame( $expected, Dns_Providers::match_nameserver( $nameserver ) );
	}

	/**
	 * Nameservers.
	 *
	 * @return array
	 */
	public static function provide_nameservers() {
		return array(
			'cloudflare, trailing dot, caps' => array( 'ADA.NS.Cloudflare.com.', 'cloudflare' ),
			'route53 substring'              => array( 'ns-1536.awsdns-00.co.uk', 'route53' ),
			'wordpress.com ns4'              => array( 'ns4.wordpress.com', 'wordpresscom' ),
			'squarespace'                    => array( 'dns1.p01.squarespacedns.com', 'squarespace' ),
			'nsone is not squarespace'       => array( 'dns1.p01.nsone.net', null ),
			'suffix inside another domain'   => array( 'ns.cloudflare.com.attacker.net', null ),
			'no label boundary'              => array( 'nsxbluehost.com', null ),
			'bare suffix is not a server'    => array( 'domaincontrol.com', null ),
			'unknown'                        => array( 'ns1.example-host.net', null ),
			'empty'                          => array( '', null ),
		);
	}

	/**
	 * Majority wins; anything short of a full match is low confidence.
	 *
	 * @dataProvider provide_nameserver_sets
	 * @param string[]    $nameservers Nameservers.
	 * @param string|null $provider    Expected slug.
	 * @param string      $confidence  Expected confidence.
	 */
	#[DataProvider( 'provide_nameserver_sets' )]
	public function test_match_nameservers( array $nameservers, $provider, $confidence ) {
		$this->assertSame(
			array(
				'provider'   => $provider,
				'confidence' => $confidence,
			),
			Dns_Providers::match_nameservers( $nameservers )
		);
	}

	/**
	 * Nameserver sets.
	 *
	 * @return array
	 */
	public static function provide_nameserver_sets() {
		return array(
			'all one provider'     => array( array( 'ada.ns.cloudflare.com', 'bob.ns.cloudflare.com' ), 'cloudflare', 'high' ),
			'majority'             => array( array( 'ns1.dreamhost.com', 'ns2.dreamhost.com', 'ns-1.awsdns-1.org' ), 'dreamhost', 'low' ),
			'tie goes to rank'     => array( array( 'ns-1.awsdns-1.org', 'ada.ns.cloudflare.com' ), 'cloudflare', 'low' ),
			'one known, one not'   => array( array( 'ns1.siteground.net', 'ns1.example-host.net' ), 'siteground', 'low' ),
			'nothing matches'      => array( array( 'ns1.example-host.net', 'ns2.example-host.net' ), null, 'none' ),
			'no nameservers'       => array( array(), null, 'none' ),
			'duplicates collapsed' => array( array( 'ns1.ovh.net', 'ns1.ovh.net' ), 'ovhcloud', 'high' ),
		);
	}

	/**
	 * Picker values the server accepts.
	 */
	public function test_is_known() {
		$this->assertTrue( Dns_Providers::is_known( 'cloudflare' ) );
		$this->assertTrue( Dns_Providers::is_known( 'other' ) );
		$this->assertTrue( Dns_Providers::is_known( 'unsure' ) );
		$this->assertFalse( Dns_Providers::is_known( 'not-a-provider' ) );
		$this->assertFalse( Dns_Providers::is_known( '' ) );
	}
}
