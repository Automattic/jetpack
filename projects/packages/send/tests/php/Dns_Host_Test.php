<?php
/**
 * Tests for Dns_Host and GET /dns-host.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Send\Dns_Host
 * @covers \Automattic\Jetpack\Send\Dns_REST_Controller
 */
#[CoversClass( Dns_Host::class )]
#[CoversClass( Dns_REST_Controller::class )]
class Dns_Host_Test extends BaseTestCase {

	/**
	 * Fake DNS answers by `name|TYPE`; anything missing has no records.
	 *
	 * @var array
	 */
	private $dns = array();

	/**
	 * Lookups made, as `name|TYPE`.
	 *
	 * @var string[]
	 */
	private $queries = array();

	/**
	 * Route every lookup to the fake answers.
	 */
	public function set_up() {
		parent::set_up();
		$this->dns     = array();
		$this->queries = array();
		add_filter( 'jetpack_send_pre_dns_lookup', array( $this, 'fake_lookup' ), 10, 3 );
	}

	/**
	 * Reset globals, filters and options.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'jetpack_send_pre_dns_lookup' );
		Account::delete();
		delete_option( Onboarding::OPTION );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Filter callback for jetpack_send_pre_dns_lookup.
	 *
	 * @param mixed  $pre  Unused.
	 * @param string $name Name.
	 * @param int    $type Type.
	 * @return array|false
	 */
	public function fake_lookup( $pre, $name, $type ) {
		unset( $pre );
		$names           = array(
			DNS_TXT   => 'TXT',
			DNS_NS    => 'NS',
			DNS_SOA   => 'SOA',
			DNS_CNAME => 'CNAME',
			DNS_A     => 'A',
		);
		$key             = $name . '|' . ( $names[ $type ] ?? (string) $type );
		$this->queries[] = $key;
		return array_key_exists( $key, $this->dns ) ? $this->dns[ $key ] : array();
	}

	/**
	 * Give a zone an SOA and nameservers.
	 *
	 * @param string   $apex        Zone root.
	 * @param string[] $nameservers Nameservers.
	 */
	private function zone( $apex, array $nameservers ) {
		$this->dns[ $apex . '|SOA' ] = array(
			array(
				'host' => $apex,
				'type' => 'SOA',
			),
		);
		$this->dns[ $apex . '|NS' ]  = array_map(
			static function ( $ns ) use ( $apex ) {
				return array(
					'host'   => $apex,
					'type'   => 'NS',
					'target' => $ns,
				);
			},
			$nameservers
		);
	}

	/**
	 * Set TXT values at a name.
	 *
	 * @param string   $name   Name.
	 * @param string[] $values Values.
	 */
	private function txt( $name, array $values ) {
		$this->dns[ $name . '|TXT' ] = array_map(
			static function ( $value ) use ( $name ) {
				return array(
					'host' => $name,
					'type' => 'TXT',
					'txt'  => $value,
				);
			},
			$values
		);
	}

	/**
	 * Store an account for a domain.
	 *
	 * @param string $domain Domain.
	 * @param array  $extra  Extra keys.
	 */
	private static function save_account( $domain, array $extra = array() ) {
		Account::save(
			array_merge(
				array(
					'handle'           => 'jpsendtest',
					'api_key'          => 'secret',
					'lockdown_auth_id' => 'jpsendtest',
					'domain'           => $domain,
					'dkim_selector'    => 'jpsend',
					'dns_records'      => array(),
					'dns_check'        => null,
				),
				$extra
			)
		);
	}

	/**
	 * Which addresses can have records added, and why not.
	 *
	 * @dataProvider provide_domains
	 * @param string      $domain Domain.
	 * @param string|null $reason Expected reason, null when editable.
	 */
	#[DataProvider( 'provide_domains' )]
	public function test_is_editable( $domain, $reason ) {
		$this->assertSame(
			array(
				'editable' => null === $reason,
				'reason'   => $reason,
			),
			Dns_Host::is_editable( $domain )
		);
	}

	/**
	 * Domains.
	 *
	 * @return array
	 */
	public static function provide_domains() {
		return array(
			'real domain'          => array( 'example.com', null ),
			'subdomain'            => array( 'mail.example.co.uk', null ),
			'ipv4'                 => array( '127.0.0.1', 'ip' ),
			'ipv6'                 => array( '[::1]', 'ip' ),
			'localhost'            => array( 'localhost', 'temporary' ),
			'single label'         => array( 'intranet', 'temporary' ),
			'.local'               => array( 'mysite.local', 'temporary' ),
			'staging host'         => array( 'shop.wpcomstaging.com', 'temporary' ),
			'host subdomain'       => array( 'shop.mystagingwebsite.com', 'temporary' ),
			'host itself is fine'  => array( 'wpengine.com', null ),
			'suffix without a dot' => array( 'notwpengine.com', null ),
			'.example'             => array( 'shop.example', 'reserved' ),
			'.invalid'             => array( 'site.invalid', 'reserved' ),
			'.localhost'           => array( 'site.localhost', 'reserved' ),
			'.test'                => array( 'shop.test', 'reserved' ),
		);
	}

	/**
	 * The apex is the first name up the tree that answers SOA, never a public suffix.
	 */
	public function test_find_apex_walks_up_to_the_zone() {
		$this->zone( 'example.co.uk', array() );
		$this->assertSame( 'example.co.uk', Dns_Host::find_apex( 'mail.example.co.uk' ) );

		// A CNAME'd name can return the target zone's SOA; that doesn't make it an apex.
		$this->dns['www.blog.com|SOA'] = array(
			array(
				'host' => 'cdn.net',
				'type' => 'SOA',
			),
		);
		$this->dns['co.uk|SOA']        = array(
			array(
				'host' => 'co.uk',
				'type' => 'SOA',
			),
		);
		$this->queries                 = array();
		$this->assertSame( 'www.nothing.co.uk', Dns_Host::find_apex( 'www.nothing.co.uk' ) );
		$this->assertNotContains( 'co.uk|SOA', $this->queries );
		$this->assertSame( 'www.blog.com', Dns_Host::find_apex( 'www.blog.com' ) );
	}

	/**
	 * Each provider in providers.json is detected from its nameservers, at the apex of a subdomain.
	 *
	 * @dataProvider provide_providers
	 * @param string $slug       Provider.
	 * @param string $nameserver One of its nameservers.
	 */
	#[DataProvider( 'provide_providers' )]
	public function test_detects_each_provider( $slug, $nameserver ) {
		$this->zone( 'example.com', array( $nameserver ) );
		if ( 'squarespace' === $slug ) {
			$this->txt( '_domainconnect.example.com', array( 'domains.squarespace.com' ) );
		}

		$host = Dns_Host::detect( 'mail.example.com' );
		$this->assertSame( 'example.com', $host['apex'] );
		$this->assertSame( $slug, $host['provider'] );
		$this->assertSame( 'ns', $host['provider_source'] );
		$this->assertSame( 'high', $host['confidence'] );
		$this->assertTrue( $host['editable'] );
	}

	/**
	 * First nameserver pattern of each provider.
	 *
	 * @return array
	 */
	public static function provide_providers() {
		$cases = array();
		foreach ( Dns_Providers::PROVIDERS as $slug => $provider ) {
			if ( $provider['ns'] ) {
				$pattern        = $provider['ns'][0] ?? '';
				$cases[ $slug ] = array( $slug, 'substring' === $provider['match'] ? 'ns-9' . $pattern . '01.net' : 'ns1' . ( '.' === $pattern[0] ? $pattern : '.' . $pattern ) );
			}
		}
		return $cases;
	}

	/**
	 * The full payload for a Cloudflare domain, including discovery and existing records.
	 */
	public function test_detect_payload() {
		self::save_account( 'example.com', array( 'dkim_selector' => 'sel' ) );
		$this->zone( 'example.com', array( 'bob.ns.cloudflare.com', 'ada.ns.cloudflare.com' ) );
		$this->txt( '_domainconnect.example.com', array( 'v=spf1 -all', 'api.cloudflare.com/client/v4/dns/domainconnect' ) );
		$this->txt( '_mailchannels.example.com', array( 'v=mc1 auth=myhost' ) );
		$this->txt( 'example.com', array( 'google-site-verification=abc', 'v=spf1 include:_spf.google.com ~all' ) );
		$this->txt( 'sel._domainkey.example.com', array( 'v=DKIM1; k=rsa; p=MIIB' ) );

		$host = Dns_Host::detect( 'Example.com.' );
		unset( $host['checked_at'] );
		$this->assertSame(
			array(
				'domain'          => 'example.com',
				'apex'            => 'example.com',
				'nameservers'     => array( 'ada.ns.cloudflare.com', 'bob.ns.cloudflare.com' ),
				'provider'        => 'cloudflare',
				'provider_source' => 'ns',
				'confidence'      => 'high',
				'editable'        => true,
				'reason'          => null,
				'domain_connect'  => array(
					'host'      => 'api.cloudflare.com/client/v4/dns/domainconnect',
					'supported' => null,
				),
				'one_click'       => array( 'supported' => null ),
				'wpcom_dns'       => array( 'supported' => null ),
				'cloudflare_api'  => array(
					'supported' => Cloudflare_Dns::is_available(
						array(
							'provider' => 'cloudflare',
							'editable' => true,
						)
					),
				),
				'existing'        => array(
					'lockdown' => 'v=mc1 auth=myhost',
					'spf'      => 'v=spf1 include:_spf.google.com ~all',
					'dkim'     => 'v=DKIM1; k=rsa; p=MIIB',
				),
			),
			$host
		);
	}

	/**
	 * Our own permission record isn't reported as one the host already had.
	 */
	public function test_own_lockdown_record_is_not_existing() {
		self::save_account( 'example.com' );
		$this->txt( '_mailchannels.example.com', array( 'v=mc1 auth=jpsendtest' ) );

		$this->assertNull( Dns_Host::detect( 'example.com' )['existing']['lockdown'] );
	}

	/**
	 * Confidence drops when the answer is ambiguous; nothing found means none.
	 *
	 * @dataProvider provide_ambiguous
	 * @param string[]    $nameservers    Nameservers.
	 * @param string|null $domain_connect Discovery TXT value, or null for none.
	 * @param string|null $provider       Expected provider.
	 * @param string      $confidence     Expected confidence.
	 */
	#[DataProvider( 'provide_ambiguous' )]
	public function test_ambiguous_detection( array $nameservers, $domain_connect, $provider, $confidence ) {
		$this->zone( 'example.com', $nameservers );
		if ( null !== $domain_connect ) {
			$this->txt( '_domainconnect.example.com', array( $domain_connect ) );
		}

		$host = Dns_Host::detect( 'example.com' );
		$this->assertSame( $provider, $host['provider'] );
		$this->assertSame( $confidence, $host['confidence'] );
		$this->assertSame( null === $provider ? null : 'ns', $host['provider_source'] );
	}

	/**
	 * Ambiguous cases.
	 *
	 * @return array
	 */
	public static function provide_ambiguous() {
		return array(
			'mixed nameservers'                   => array( array( 'ada.ns.cloudflare.com', 'ns1.dreamhost.com', 'ns2.dreamhost.com' ), null, 'dreamhost', 'low' ),
			'shared suffix, no discovery'         => array( array( 'ns-cloud-a1.googledomains.com' ), null, 'squarespace', 'low' ),
			'shared suffix, squarespace confirms' => array( array( 'ns-cloud-a1.googledomains.com' ), '_domainconnect.domains.squarespace.com', 'squarespace', 'high' ),
			'unknown ns, discovery guesses'       => array( array( 'ns1.brand-dns.net' ), 'domainconnect.api.godaddy.com', 'godaddy', 'low' ),
			'unknown ns, junk discovery'          => array( array( 'ns1.brand-dns.net' ), 'v=spf1 include:x ~all', null, 'none' ),
			'no nameservers'                      => array( array(), null, null, 'none' ),
		);
	}

	/**
	 * A failed nameserver lookup reports nothing rather than erroring.
	 */
	public function test_failed_lookups_report_no_provider() {
		$this->dns['example.com|NS'] = false;
		$host                        = Dns_Host::detect( 'example.com' );
		$this->assertSame( array(), $host['nameservers'] );
		$this->assertNull( $host['provider'] );
		$this->assertSame( 'none', $host['confidence'] );
	}

	/**
	 * Addresses nobody can add records to are flagged without any lookups.
	 */
	public function test_non_editable_domain_skips_lookups() {
		$host = Dns_Host::detect( 'shop.example' );
		$this->assertFalse( $host['editable'] );
		$this->assertSame( 'reserved', $host['reason'] );
		$this->assertNull( $host['provider'] );
		$this->assertSame( array(), $this->queries );
	}

	/**
	 * Detection is cached on the account, refreshed on request or when the domain changes.
	 */
	public function test_get_caches_on_the_account() {
		$this->assertSame( 'jetpack_send_not_set_up', Dns_Host::get()->get_error_code() );

		self::save_account( 'example.com' );
		$this->zone( 'example.com', array( 'ns1.siteground.net' ) );
		$this->assertSame( 'siteground', Dns_Host::get()['provider'] );
		$this->assertSame( 'siteground', Account::get()[ Dns_Host::ACCOUNT_KEY ]['provider'] ?? null );

		$this->zone( 'example.com', array( 'ada.ns.cloudflare.com' ) );
		$this->queries = array();
		$this->assertSame( 'siteground', Dns_Host::get()['provider'] );
		$this->assertSame( array(), $this->queries );
		$this->assertSame( 'cloudflare', Dns_Host::get( true )['provider'] );

		Account::update( array( 'domain' => 'other.example.net' ) );
		$this->assertSame( 'other.example.net', Dns_Host::get()['domain'] );
	}

	/**
	 * The user's pick wins over detection and is labelled as theirs, except "I’m not sure".
	 */
	public function test_get_reports_the_users_pick() {
		self::save_account( 'example.com' );
		$this->zone( 'example.com', array( 'ada.ns.cloudflare.com' ) );

		update_option( Onboarding::OPTION, array( 'dns_provider' => 'bluehost' ) );
		$host = Dns_Host::get();
		$this->assertSame( 'bluehost', $host['provider'] );
		$this->assertSame( 'user', $host['provider_source'] );
		$this->assertSame( 'cloudflare', $host['detected_provider'] );

		update_option( Onboarding::OPTION, array( 'dns_provider' => 'unsure' ) );
		$host = Dns_Host::get();
		$this->assertSame( 'cloudflare', $host['provider'] );
		$this->assertSame( 'ns', $host['provider_source'] );
	}

	/**
	 * GET /dns-host needs manage_options and an account, and returns the detection.
	 */
	public function test_rest_route() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Dns_REST_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init', $wp_rest_server );
		$request = new WP_REST_Request( 'GET', '/jetpack-send/v1/dns-host' );

		$subscriber = wp_insert_user(
			array(
				'user_login' => 'sub',
				'user_pass'  => 'pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber );
		$this->assertSame( 403, $wp_rest_server->dispatch( $request )->get_status() );

		$admin = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin );
		$this->assertSame( 400, $wp_rest_server->dispatch( $request )->get_status() );

		self::save_account( 'example.com' );
		$this->zone( 'example.com', array( 'ns1.dreamhost.com' ) );
		$response = $wp_rest_server->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'dreamhost', $response->get_data()['provider'] );
	}
}
