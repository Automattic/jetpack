<?php
/**
 * Declarative configuration schema for Cookie Consent.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Single source of truth for the package config: shape, types, defaults, validation.
 */
final class Config_Schema {

	/**
	 * JSON-Schema-shaped descriptor for the full config.
	 *
	 * @return array
	 */
	public static function schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'enabled'         => array( 'type' => 'boolean', 'default' => true ),
				'schema_version'  => array( 'type' => 'integer', 'default' => 1 ),
				'features'        => array(
					'type'       => 'object',
					'properties' => array(
						'banner'             => array( 'type' => 'boolean', 'default' => true ),
						'ccpa_page'          => array( 'type' => 'boolean', 'default' => true ),
						'footer_links'       => array( 'type' => 'boolean', 'default' => true ),
						'consent_log'        => array( 'type' => 'boolean', 'default' => true ),
						'tracks'             => array( 'type' => 'boolean', 'default' => true ),
						'geo'                => array( 'type' => 'boolean', 'default' => true ),
						'page_deletion_lock' => array( 'type' => 'boolean', 'default' => false ),
					),
				),
				'geo'             => array(
					'type'       => 'object',
					'properties' => array(
						'provider'            => array( 'type' => 'string', 'enum' => array( 'wpcom', 'custom' ), 'default' => 'wpcom' ),
						'api_url'             => array( 'type' => 'string', 'default' => 'https://public-api.wordpress.com/geo/' ),
						'country_code_cookie' => array( 'type' => 'string', 'default' => 'country_code' ),
						'region_cookie'       => array( 'type' => 'string', 'default' => 'region' ),
						'cookie_duration'     => array( 'type' => 'integer', 'default' => 6 * HOUR_IN_SECONDS ),
						'gdpr_countries'      => array( 'type' => 'array', 'default' => self::default_gdpr_countries() ),
						'ccpa_regions'        => array( 'type' => 'array', 'default' => self::default_ccpa_regions() ),
						'show_on_error'       => array( 'type' => 'boolean', 'default' => true ),
					),
				),
				'gdpr_honors_gpc' => array( 'type' => 'boolean', 'default' => true ),
				'links'           => array(
					'type'       => 'object',
					'properties' => array(
						'cookie_policy_url' => array( 'type' => 'string', 'default' => '' ),
					),
				),
				'event_prefix'    => array( 'type' => 'string', 'default' => 'jetpack' ),
				'log'             => array(
					'type'       => 'object',
					'properties' => array(
						'retention_days' => array( 'type' => 'integer', 'default' => 30 ),
						'policy_version' => array( 'type' => 'string', 'default' => '1' ),
						'banner_version' => array( 'type' => 'string', 'default' => '1' ),
						'ip_mode'        => array( 'type' => 'string', 'enum' => array( 'drop', 'hash', 'truncate', 'raw' ), 'default' => 'drop' ),
					),
				),
				'copy'            => array( 'type' => 'object', 'default' => array() ),
				'consent'         => array( 'type' => 'object', 'default' => array() ),
			),
		);
	}

	/**
	 * Get default GDPR country list.
	 *
	 * @return string[] Country codes where opt-in consent applies.
	 */
	private static function default_gdpr_countries() {
		return array(
			// European Member countries.
			'AT', // Austria.
			'BE', // Belgium.
			'BG', // Bulgaria.
			'CY', // Cyprus.
			'CZ', // Czech Republic.
			'DE', // Germany.
			'DK', // Denmark.
			'EE', // Estonia.
			'ES', // Spain.
			'FI', // Finland.
			'FR', // France.
			'GR', // Greece.
			'HR', // Croatia.
			'HU', // Hungary.
			'IE', // Ireland.
			'IT', // Italy.
			'LT', // Lithuania.
			'LU', // Luxembourg.
			'LV', // Latvia.
			'MT', // Malta.
			'NL', // Netherlands.
			'PL', // Poland.
			'PT', // Portugal.
			'RO', // Romania.
			'SE', // Sweden.
			'SI', // Slovenia.
			'SK', // Slovakia.
			'GB', // United Kingdom.
			// Single Market Countries that GDPR applies to.
			'CH', // Switzerland.
			'IS', // Iceland.
			'LI', // Liechtenstein.
			'NO', // Norway.
		);
	}

	/**
	 * Get default CCPA-style region list.
	 *
	 * @return string[] Lower-case region names where opt-out consent applies.
	 */
	private static function default_ccpa_regions() {
		return array(
			/* US regions/states that are treated like California for Do Not Sell requests. */
			'california',
			'utah',
			'virginia',
			'colorado',
			'connecticut',
			'texas',
			'tennessee',
			'oregon',
			'new jersey',
			'montana',
			'iowa',
			'indiana',
			'delaware',
		);
	}
}
