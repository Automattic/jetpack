<?php
/**
 * Utils to detect and determine hosting providers using nameserver dns records.
 *
 * Sourced from: fbhepr%2Skers%2Sjcpbz%2Sjc%2Qpbagrag%2Syvo%2Subfgvat%2Qcebivqre%2Sanzrfreiref.cuc-og
 *
 * @package automattic/my-jetpack
 */

/**
 * Returns an array of known hosting providers and their nameservers, where
 * the key is the hosting provider and the value is an array of nameservers.
 *
 * @return array
 */
function get_hosting_provider_known_nameservers() {
	return array(
		'bluehost'     => array(
			'.bluehost.com',
		),
		'dreamhost'    => array(
			'.dreamhost.com',
		),
		'mediatemple'  => array(
			'.mediatemple.net',
		),
		'xserver'      => array(
			'.xserver.jp',
		),
		'namecheap'    => array(
			'.namecheaphosting.com',
		),
		'hostmonster'  => array(
			'.hostmonster.com',
		),
		'justhost'     => array(
			'.justhost.com',
		),
		'digitalocean' => array(
			'.digitalocean.com',
		),
		'one'          => array(
			'.one.com',
		),
		'hostpapa'     => array(
			'.hostpapa.com',
		),
		'siteground'   => array(
			'.sgcloud.net',
			'.sgedu.site',
			'.sgsrv1.com',
			'.sgvps.net',
			'.siteground.biz',
			'.siteground.net',
			'.siteground.eu',
		),
		'inmotion'     => array(
			'.inmotionhosting.com',
		),
		'ionos'        => array(
			'.ui-dns.org',
			'.ui-dns.de',
			'.ui-dns.biz',
			'.ui-dns.com',
		),
	);
}

/**
 * Given a DNS entry, will return a hosting provider if one can be determined. Otherwise, will return 'unknown'.
 *
 * @param array $dns_entries A DNS entry to search against.
 * @return string The hosting provider of 'unknown'.
 */
function get_hosting_provider_by_nameserver( $dns_entries ) {
	$dns_entries = array_map( 'strtolower', $dns_entries );

	foreach ( get_hosting_provider_known_nameservers() as $host => $nameservers ) {
		if ( ! empty( array_intersect( $dns_entries, $nameservers ) ) ) {
			return $host;
		}
	}

	return 'unknown';
}

/**
 * Returns an array of nameservers for the current site.
 *
 * @return string
 */
function get_nameserver_dns_records() {
	if ( ! isset( $_SERVER['SERVER_NAME'] ) ) {
		return array();
	}

	$domain      = filter_var( wp_unslash( $_SERVER['SERVER_NAME'] ), FILTER_SANITIZE_STRING ); // Gets the domain name of the WordPress site
	$dns_records = dns_get_record( $domain, DNS_NS ); // Fetches the DNS records of type NS (Name Server)
	$nameservers = array();

	foreach ( $dns_records as $record ) {
		if ( isset( $record['target'] ) ) {
			$nameservers[] = $record['target']; // Adds the nameserver to the array
		}
	}

	return $nameservers; // Returns an array of nameserver names
}
