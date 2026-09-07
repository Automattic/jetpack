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
 * Single source of truth for the package config: shape, types, defaults, and the
 * enum lists below. The schema descriptor and every bespoke validator (resolve_geo(),
 * Consent_Log_Controller::get_ip_mode()) read their allowed values from the same
 * constants, so an enum is declared exactly once.
 */
final class Config_Schema {

	/**
	 * Allowed geolocation providers. Sourced by the schema and resolve_geo().
	 *
	 * @var string[]
	 */
	private const GEO_PROVIDERS = array( 'wpcom', 'custom' );

	/**
	 * Allowed consent-log IP handling modes. Sourced by the schema and, via
	 * ip_modes(), by Consent_Log_Controller::get_ip_mode().
	 *
	 * @var string[]
	 */
	private const IP_MODES = array( 'drop', 'hash', 'truncate', 'raw' );

	/**
	 * Default consent-log IP handling mode. Sourced by the schema and default_ip_mode().
	 */
	private const DEFAULT_IP_MODE = 'drop';

	/**
	 * JSON-Schema-shaped descriptor for the full config.
	 *
	 * @return array
	 */
	public static function schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'enabled'         => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'schema_version'  => array(
					'type'    => 'integer',
					'default' => 1,
				),
				'features'        => array(
					'type'       => 'object',
					'properties' => array(
						'banner'             => array(
							'type'    => 'boolean',
							'default' => true,
						),
						'ccpa_page'          => array(
							'type'    => 'boolean',
							'default' => true,
						),
						'footer_links'       => array(
							'type'    => 'boolean',
							'default' => true,
						),
						'consent_log'        => array(
							'type'    => 'boolean',
							'default' => true,
						),
						'tracks'             => array(
							'type'    => 'boolean',
							'default' => true,
						),
						'geo'                => array(
							'type'    => 'boolean',
							'default' => true,
						),
						'page_deletion_lock' => array(
							'type'    => 'boolean',
							'default' => false,
						),
					),
				),
				'geo'             => array(
					'type'       => 'object',
					'properties' => array(
						'provider'            => array(
							'type'    => 'string',
							'enum'    => self::GEO_PROVIDERS,
							'default' => 'wpcom',
						),
						'api_url'             => array(
							'type'    => 'string',
							'default' => 'https://public-api.wordpress.com/geo/',
						),
						'country_code_cookie' => array(
							'type'    => 'string',
							'default' => 'country_code',
						),
						'region_cookie'       => array(
							'type'    => 'string',
							'default' => 'region',
						),
						'cookie_duration'     => array(
							'type'    => 'integer',
							'default' => 6 * HOUR_IN_SECONDS,
						),
						'gdpr_countries'      => array(
							'type'    => 'array',
							'default' => self::default_gdpr_countries(),
						),
						'ccpa_regions'        => array(
							'type'    => 'array',
							'default' => self::default_ccpa_regions(),
						),
						'show_on_error'       => array(
							'type'    => 'boolean',
							'default' => true,
						),
					),
				),
				'gdpr_honors_gpc' => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'links'           => array(
					'type'       => 'object',
					'properties' => array(
						'cookie_policy_url' => array(
							'type'    => 'string',
							'default' => '',
						),
					),
				),
				'event_prefix'    => array(
					'type'    => 'string',
					'default' => 'jetpack',
				),
				'log'             => array(
					'type'       => 'object',
					'properties' => array(
						'retention_days' => array(
							'type'    => 'integer',
							'default' => 30,
						),
						'policy_version' => array(
							'type'    => 'string',
							'default' => '1',
						),
						'banner_version' => array(
							'type'    => 'string',
							'default' => '1',
						),
						'ip_mode'        => array(
							'type'    => 'string',
							'enum'    => self::IP_MODES,
							'default' => self::DEFAULT_IP_MODE,
						),
					),
				),
				'copy'            => array(
					'type'    => 'object',
					'default' => self::defaults_copy(),
				),
				'consent'         => array(
					'type'    => 'object',
					// Left empty: resolve() rebuilds categories from the resolved `copy`, so a
					// static default here would use default copy and be discarded anyway.
					'default' => array( 'categories' => array() ),
				),
			),
		);
	}

	/**
	 * Allowed consent-log IP handling modes.
	 *
	 * @internal For package classes only; not part of the public API.
	 *
	 * @return string[]
	 */
	public static function ip_modes() {
		return self::IP_MODES;
	}

	/**
	 * Default consent-log IP handling mode.
	 *
	 * @internal For package classes only; not part of the public API.
	 *
	 * @return string
	 */
	public static function default_ip_mode() {
		return self::DEFAULT_IP_MODE;
	}

	/**
	 * Resolve a partial consumer config into a fully-defaulted, validated config.
	 *
	 * @param mixed $config Partial consumer config; anything other than an array falls back to defaults.
	 * @return array
	 */
	public static function resolve( $config = array() ) {
		if ( ! is_array( $config ) ) {
			$config = array();
		}

		// Build the schema once and index every default and field-schema below into it.
		// Each schema() build re-materializes the copy, category, and country/region
		// defaults, so resolving off a single materialization avoids rebuilding them per
		// field lookup.
		$schema     = self::schema();
		$properties = $schema['properties'];
		$defaults   = self::defaults_from_schema_node( $schema );

		// Scalars, enums, booleans, integers: let the schema coerce them, field by field,
		// falling back to the default whenever a value is missing or fails validation.
		$features = self::resolve_group( $config['features'] ?? array(), $defaults['features'], $properties['features']['properties'] );
		$geo      = self::resolve_geo( $config, $defaults['geo'] );
		// `log` is merged rather than resolved wholesale because `policy_version`/`banner_version`
		// keep a deliberately permissive contract: Cookie_Consent::get_log_versions() coerces and
		// diagnoses their scalar values (including non-string overrides) downstream. The two fields
		// that DO carry a strict schema — `ip_mode` (enum) and `retention_days` (integer) — are
		// validated here so a resolved config is schema-valid for them and the filter re-resolve
		// re-sanitizes an injected value rather than trusting it verbatim.
		$log                   = isset( $config['log'] ) && is_array( $config['log'] ) ? array_merge( $defaults['log'], $config['log'] ) : $defaults['log'];
		$log_properties        = $properties['log']['properties'];
		$log['ip_mode']        = self::resolve_scalar( $log, 'ip_mode', $defaults['log']['ip_mode'], $log_properties['ip_mode'] );
		$log['retention_days'] = self::resolve_scalar( $log, 'retention_days', $defaults['log']['retention_days'], $log_properties['retention_days'] );

		$resolved = array(
			'enabled'         => self::resolve_scalar( $config, 'enabled', $defaults['enabled'], $properties['enabled'] ),
			'schema_version'  => self::resolve_scalar( $config, 'schema_version', $defaults['schema_version'], $properties['schema_version'] ),
			'features'        => $features,
			'geo'             => $geo,
			'gdpr_honors_gpc' => self::resolve_scalar( $config, 'gdpr_honors_gpc', $defaults['gdpr_honors_gpc'], $properties['gdpr_honors_gpc'] ),
			'links'           => self::normalize_links( $config, $defaults['links'] ),
			'event_prefix'    => isset( $config['event_prefix'] ) && is_string( $config['event_prefix'] ) ? $config['event_prefix'] : $defaults['event_prefix'],
			'log'             => $log,
			'copy'            => self::normalize_copy( $config['copy'] ?? array(), $defaults['copy'] ),
		);

		$default_categories = self::default_consent_categories( $resolved['copy'] );
		$consent            = isset( $config['consent'] ) && is_array( $config['consent'] ) ? $config['consent'] : array();
		$categories         = $consent['categories'] ?? $default_categories;

		$resolved['consent'] = array( 'categories' => self::normalize_consent_categories( $categories, $default_categories ) );

		return $resolved;
	}

	/**
	 * Recursively pull `default` values out of a schema node.
	 *
	 * @param array $node Schema node.
	 * @return mixed Nested defaults for an object node, or the node's own default.
	 */
	private static function defaults_from_schema_node( $node ) {
		if ( isset( $node['properties'] ) ) {
			$defaults = array();
			foreach ( $node['properties'] as $key => $child ) {
				$defaults[ $key ] = self::defaults_from_schema_node( $child );
			}
			return $defaults;
		}

		return $node['default'] ?? null;
	}

	/**
	 * Resolve a single scalar field: sanitize it against its schema, or fall back to the default.
	 *
	 * @param array  $config       Config array that may hold the field.
	 * @param string $key          Field key.
	 * @param mixed  $default      Default value to use when the field is missing or invalid.
	 * @param array  $field_schema JSON-Schema descriptor for the field.
	 * @return mixed
	 */
	private static function resolve_scalar( $config, $key, $default, $field_schema ) {
		if ( ! is_array( $config ) || ! array_key_exists( $key, $config ) ) {
			return $default;
		}

		$value = $config[ $key ];

		if ( is_wp_error( rest_validate_value_from_schema( $value, $field_schema, $key ) ) ) {
			return $default;
		}

		return rest_sanitize_value_from_schema( $value, $field_schema, $key );
	}

	/**
	 * Resolve every property of an object field via resolve_scalar().
	 *
	 * @param mixed $group      Configured group, expected to be an array.
	 * @param array $defaults   Default values for the group, keyed like $properties.
	 * @param array $properties Schema properties for the group.
	 * @return array
	 */
	private static function resolve_group( $group, $defaults, $properties ) {
		if ( ! is_array( $group ) ) {
			return $defaults;
		}

		$resolved = array();
		foreach ( $properties as $key => $field_schema ) {
			$resolved[ $key ] = self::resolve_scalar( $group, $key, $defaults[ $key ], $field_schema );
		}

		return $resolved;
	}

	/**
	 * Resolve the `geo` group.
	 *
	 * The provider/api_url pair and a couple of the scalar fields need bespoke
	 * fallback behavior (e.g. an unknown provider resets the api_url too) that a
	 * plain field-by-field schema validation pass can't express, so this is an
	 * escape hatch rather than a resolve_group() call.
	 *
	 * @param array $config   Consumer config that may hold a `geo` group.
	 * @param array $defaults Default geo configuration.
	 * @return array Normalized geo configuration.
	 */
	private static function resolve_geo( $config, $defaults ) {
		$nested_geo = isset( $config['geo'] ) && is_array( $config['geo'] ) ? $config['geo'] : array();
		$geo        = array_merge( $defaults, $nested_geo );

		if ( ! in_array( $geo['provider'], self::GEO_PROVIDERS, true ) ) {
			$geo['provider'] = $defaults['provider'];
			$geo['api_url']  = $defaults['api_url'];
		}
		if ( ! is_string( $geo['api_url'] ) ) {
			$geo['api_url'] = '';
		}
		// The default provider uses a shared, canonical endpoint, so an empty api_url is
		// refilled from the default; a custom provider may keep an explicitly blank url.
		if ( $defaults['provider'] === $geo['provider'] && '' === $geo['api_url'] ) {
			$geo['api_url'] = $defaults['api_url'];
		}
		$geo['country_code_cookie'] = is_string( $geo['country_code_cookie'] ) && '' !== $geo['country_code_cookie'] ? $geo['country_code_cookie'] : $defaults['country_code_cookie'];
		$geo['region_cookie']       = is_string( $geo['region_cookie'] ) && '' !== $geo['region_cookie'] ? $geo['region_cookie'] : $defaults['region_cookie'];
		$geo['cookie_duration']     = is_numeric( $geo['cookie_duration'] ) ? (int) $geo['cookie_duration'] : $defaults['cookie_duration'];
		$geo['gdpr_countries']      = is_array( $geo['gdpr_countries'] ) ? self::normalize_gdpr_countries( $geo['gdpr_countries'] ) : $defaults['gdpr_countries'];
		$geo['ccpa_regions']        = is_array( $geo['ccpa_regions'] ) ? self::normalize_ccpa_regions( $geo['ccpa_regions'] ) : $defaults['ccpa_regions'];
		$geo['show_on_error']       = (bool) $geo['show_on_error'];

		return $geo;
	}

	/**
	 * Get default UI copy.
	 *
	 * Defaults are translated in the package text domain. Consumers can override
	 * any key through the `copy` config group and translate those overrides in
	 * their own text domain before returning them from the config filter.
	 *
	 * @return array Default copy keyed by semantic UI location.
	 */
	private static function defaults_copy() {
		return array(
			'banner_title'                     => __( 'Use of your personal data', 'jetpack-cookie-consent' ),
			'banner_description'               => __( 'We and our partners process your personal data, such as browsing data, IP addresses, cookie information, and other unique identifiers, based on your consent and/or our legitimate interest to improve our website, marketing activities, and your user experience.', 'jetpack-cookie-consent' ),
			'banner_accept_button'             => __( 'Accept', 'jetpack-cookie-consent' ),
			'banner_reject_button'             => __( 'Reject', 'jetpack-cookie-consent' ),
			'banner_customize_button'          => __( 'Customize', 'jetpack-cookie-consent' ),
			'modal_title'                      => __( 'Customize preferences', 'jetpack-cookie-consent' ),
			'modal_close_label'                => __( 'Close modal', 'jetpack-cookie-consent' ),
			'modal_description'                => __( 'Your privacy is important to us. We and our partners use, store, and process your personal data to improve our website, such as by improving security or conducting analytics, marketing activities to help deliver relevant marketing or content, and your user experience, such as by remembering your account name or language settings where applicable. You can customize your cookie settings below.', 'jetpack-cookie-consent' ),
			'privacy_policy_link'              => __( 'Privacy Policy', 'jetpack-cookie-consent' ),
			'modal_links_lead'                 => __( 'Learn more in our', 'jetpack-cookie-consent' ),
			'modal_links_conjunction'          => __( 'and', 'jetpack-cookie-consent' ),
			'cookie_policy_link'               => __( 'Cookie Policy', 'jetpack-cookie-consent' ),
			'category_toggle_label'            => __( 'Toggle category description', 'jetpack-cookie-consent' ),
			'required_category_label'          => __( 'Required', 'jetpack-cookie-consent' ),
			'always_active_label'              => __( 'Always active', 'jetpack-cookie-consent' ),
			'required_category_description'    => __( 'These cookies are essential for our websites and services to perform basic functions and are necessary for us to operate certain features. Examples include your IP address, browser type, requested URLs, response codes, and operating system data.', 'jetpack-cookie-consent' ),
			'analytics_category_label'         => __( 'Analytics', 'jetpack-cookie-consent' ),
			'analytics_category_description'   => __( 'These cookies allow us to improve performance by collecting information on how users interact with our websites.', 'jetpack-cookie-consent' ),
			'advertising_category_label'       => __( 'Advertising', 'jetpack-cookie-consent' ),
			'advertising_category_description' => __( 'These cookies are set by us and our advertising partners to provide you with relevant content and to understand that content\'s effectiveness.', 'jetpack-cookie-consent' ),
			'save_preferences_button'          => __( 'Save preferences', 'jetpack-cookie-consent' ),
			'accept_all_button'                => __( 'Accept all', 'jetpack-cookie-consent' ),
			'reject_all_button'                => __( 'Reject all', 'jetpack-cookie-consent' ),
			'manage_preferences_link'          => __( 'Manage Privacy Preferences', 'jetpack-cookie-consent' ),
			'ccpa_page_title'                  => __( 'Your Privacy Choices', 'jetpack-cookie-consent' ),
			'ccpa_intro'                       => __( 'We value your privacy and want you to feel in control of your personal information. Like most websites, we use cookies and similar tools to improve your website experience and show you relevant ads. Sometimes we share this information with trusted partners to do so.', 'jetpack-cookie-consent' ),
			'ccpa_laws_notice'                 => __( 'Some U.S. state laws consider this kind of data sharing a sale or sharing of personal information. Depending on where you live, you may have the right to opt out.', 'jetpack-cookie-consent' ),
			'ccpa_heading'                     => __( 'How to Opt Out', 'jetpack-cookie-consent' ),
			'ccpa_browser_opt_out'             => __( 'Browser Opt-Out: Click the Opt Out button below to stop your browser from sharing this data.', 'jetpack-cookie-consent' ),
			'ccpa_account_opt_out'             => __( 'Account Opt-Out: To apply this choice to your account, check the box and enter your email.', 'jetpack-cookie-consent' ),
			'ccpa_gpc_opt_out'                 => __( 'Automatic Opt-Out: If you use a browser with Global Privacy Control (GPC) turned on, we will recognize it and respect your choice automatically.', 'jetpack-cookie-consent' ),
			'ccpa_preferences_notice'          => __( 'Your preferences will only affect how we use your information for personalized ads and similar activities. It will not affect how we use your information for other purposes, like security or site functionality.', 'jetpack-cookie-consent' ),
			'ccpa_button_instruction'          => __( 'Click the Opt Out button to stop this browser from sharing personal data.', 'jetpack-cookie-consent' ),
			'ccpa_opt_out_button'              => __( 'Opt Out', 'jetpack-cookie-consent' ),
			'ccpa_snackbar_success'            => __( 'Your browser has been successfully opted out from sharing personal data.', 'jetpack-cookie-consent' ),
			'ccpa_snackbar_dismiss_label'      => __( 'Dismiss', 'jetpack-cookie-consent' ),
		);
	}

	/**
	 * Get the default consent category registry.
	 *
	 * Category keys are the internal/persistence names. The frontend keeps the
	 * existing `required` and `advertising` aliases for the default `functional`
	 * and `marketing` categories.
	 *
	 * @param array|null $copy Optional normalized copy array.
	 * @return array Default consent categories.
	 */
	private static function default_consent_categories( $copy = null ) {
		$copy = is_array( $copy ) ? self::normalize_copy( $copy, self::defaults_copy() ) : self::defaults_copy();

		return array(
			array(
				'key'             => 'functional',
				'label'           => $copy['required_category_label'],
				'description'     => $copy['required_category_description'],
				'required'        => true,
				'default_checked' => true,
				'wp_consent_map'  => array( 'functional' ),
			),
			array(
				'key'             => 'analytics',
				'label'           => $copy['analytics_category_label'],
				'description'     => $copy['analytics_category_description'],
				'required'        => false,
				'default_checked' => true,
				'wp_consent_map'  => array( 'statistics', 'statistics-anonymous' ),
			),
			array(
				'key'             => 'marketing',
				'label'           => $copy['advertising_category_label'],
				'description'     => $copy['advertising_category_description'],
				'required'        => false,
				'default_checked' => false,
				'wp_consent_map'  => array( 'marketing' ),
			),
		);
	}

	/**
	 * Normalize configured copy by merging consumer overrides with defaults.
	 *
	 * @param array $copy     Copy values supplied by configuration.
	 * @param array $defaults Default copy values.
	 * @return array Normalized copy.
	 */
	private static function normalize_copy( $copy, $defaults ) {
		if ( ! is_array( $copy ) ) {
			return $defaults;
		}

		foreach ( $copy as $key => $value ) {
			if ( ! is_string( $key ) ) {
				continue;
			}

			if ( is_scalar( $value ) ) {
				$defaults[ $key ] = (string) $value;
				continue;
			}

			// A non-scalar override can't render, so the default is kept. Surface it
			// so an integrating developer notices the override was dropped instead of
			// silently shipping the default copy.
			_doing_it_wrong(
				__METHOD__,
				/* translators: %s is the copy configuration key. */
				esc_html( sprintf( __( 'Cookie consent copy override for "%s" was ignored because it is not a scalar value.', 'jetpack-cookie-consent' ), $key ) ),
				''
			);
		}

		return $defaults;
	}

	/**
	 * Normalize configured consent categories.
	 *
	 * @param array $categories Categories supplied by configuration.
	 * @param array $defaults   Default categories.
	 * @return array Normalized categories.
	 */
	private static function normalize_consent_categories( $categories, $defaults ) {
		if ( ! is_array( $categories ) ) {
			return $defaults;
		}

		$normalized           = array();
		$seen_keys            = array();
		$seen_preference_keys = array();

		// The frontend aliases the default `functional`/`marketing` categories to the
		// `required`/`advertising` preference keys, so those alias strings are reserved.
		// A consumer category whose key (or derived preference key) collides with one
		// would otherwise silently overwrite a built-in category's consent state.
		$reserved_keys = array( 'required', 'advertising' );

		foreach ( $categories as $category ) {
			if ( ! is_array( $category ) || empty( $category['key'] ) ) {
				continue;
			}

			$key = self::normalize_consent_category_key( $category['key'] );
			if ( '' === $key || isset( $seen_keys[ $key ] ) ) {
				continue;
			}

			$preference_key = Cookie_Consent::get_category_preference_key( $key );
			if ( in_array( $key, $reserved_keys, true ) || isset( $seen_preference_keys[ $preference_key ] ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s is the consent category key. */
					esc_html( sprintf( __( 'Cookie consent category "%s" was ignored because it collides with a reserved preference key.', 'jetpack-cookie-consent' ), $key ) ),
					''
				);
				continue;
			}

			$wp_consent_map = array();
			if ( isset( $category['wp_consent_map'] ) && is_array( $category['wp_consent_map'] ) ) {
				foreach ( $category['wp_consent_map'] as $wp_consent_key ) {
					$wp_consent_key = sanitize_key( $wp_consent_key );
					if ( '' !== $wp_consent_key && ! in_array( $wp_consent_key, $wp_consent_map, true ) ) {
						$wp_consent_map[] = $wp_consent_key;
					}
				}
			}

			if ( empty( $wp_consent_map ) ) {
				$wp_consent_map = array( $key );
			}

			$required = ! empty( $category['required'] );

			$normalized[] = array(
				'key'             => $key,
				'label'           => isset( $category['label'] ) && is_scalar( $category['label'] ) ? (string) $category['label'] : $key,
				'description'     => isset( $category['description'] ) && is_scalar( $category['description'] ) ? (string) $category['description'] : '',
				'required'        => $required,
				'default_checked' => $required || ! empty( $category['default_checked'] ),
				'wp_consent_map'  => $wp_consent_map,
			);

			$seen_keys[ $key ]                       = true;
			$seen_preference_keys[ $preference_key ] = true;
		}

		return empty( $normalized ) ? $defaults : $normalized;
	}

	/**
	 * Normalize a consent category key for PHP arrays and Interactivity paths.
	 *
	 * @param mixed $key Consent category key.
	 * @return string Normalized key.
	 */
	private static function normalize_consent_category_key( $key ) {
		$key = sanitize_key( (string) $key );
		return preg_replace( '/[^a-z0-9_]/', '_', $key );
	}

	/**
	 * Normalize configured links by merging consumer overrides with defaults.
	 *
	 * @param array $config   Configuration array supplied through filters.
	 * @param array $defaults Default link values.
	 * @return array Normalized links.
	 */
	private static function normalize_links( $config, $defaults ) {
		$links = isset( $config['links'] ) && is_array( $config['links'] ) ? $config['links'] : array();

		foreach ( $links as $key => $value ) {
			if ( ! is_string( $key ) ) {
				continue;
			}

			if ( is_scalar( $value ) ) {
				$defaults[ $key ] = trim( (string) $value );
			}
		}

		return $defaults;
	}

	/**
	 * Normalize GDPR country codes for case-insensitive matching.
	 *
	 * @param array $countries Country codes; non-scalar entries are dropped.
	 * @return string[] Upper-case country codes.
	 */
	private static function normalize_gdpr_countries( $countries ) {
		$countries = array_values( array_filter( $countries, 'is_scalar' ) );
		return array_map(
			static function ( $country ) {
				return strtoupper( (string) $country );
			},
			$countries
		);
	}

	/**
	 * Normalize CCPA region names for case-insensitive matching.
	 *
	 * @param array $regions Region names; non-scalar entries are dropped.
	 * @return string[] Lower-case region names.
	 */
	private static function normalize_ccpa_regions( $regions ) {
		$regions = array_values( array_filter( $regions, 'is_scalar' ) );
		return array_map(
			static function ( $region ) {
				return strtolower( (string) $region );
			},
			$regions
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
