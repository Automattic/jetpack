<?php
/**
 * Offline Mode feature registry.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Redirect;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Provides feature data for the Jetpack Offline Mode dashboard.
 */
class Jetpack_Offline_Mode_Features {
	const TYPE_MODULE              = 'module';
	const TYPE_PARTIAL             = 'partial';
	const TYPE_ALWAYS_AVAILABLE    = 'always_available';
	const TYPE_REQUIRES_CONNECTION = 'requires_connection';

	/**
	 * Get dashboard data for the Offline Mode screen.
	 *
	 * @return array
	 */
	public static function get_dashboard_data() {
		$features = array_merge(
			self::get_offline_module_features(),
			array_values( self::get_partial_features() ),
			array_values( self::get_always_available_features() )
		);

		$group_order = array_flip( array_keys( self::get_groups() ) );

		usort(
			$features,
			function ( $a, $b ) use ( $group_order ) {
				$a_group = $group_order[ $a['group'] ] ?? PHP_INT_MAX;
				$b_group = $group_order[ $b['group'] ] ?? PHP_INT_MAX;

				if ( $a['group'] === $b['group'] ) {
					return strcasecmp( $a['name'], $b['name'] );
				}

				if ( $a_group === $b_group ) {
					return strcasecmp( $a['group'], $b['group'] );
				}

				return ( $a_group < $b_group ) ? -1 : 1;
			}
		);

		return array(
			'features'            => $features,
			'groups'              => self::get_groups(),
			'recommended'         => self::get_recommended_modules(),
			'requires_connection' => self::get_requires_connection_features(),
			'counts'              => array(
				'offline_safe'     => count(
					array_filter(
						$features,
						function ( $feature ) {
							return self::TYPE_MODULE === $feature['type'];
						}
					)
				),
				'enabled'          => count(
					array_filter(
						$features,
						function ( $feature ) {
							return ! empty( $feature['active'] ) && ! empty( $feature['toggleable'] );
						}
					)
				),
				'partial'          => count(
					array_filter(
						$features,
						function ( $feature ) {
							return self::TYPE_PARTIAL === $feature['type'];
						}
					)
				),
				'always_available' => count(
					array_filter(
						$features,
						function ( $feature ) {
							return self::TYPE_ALWAYS_AVAILABLE === $feature['type'];
						}
					)
				),
			),
		);
	}

	/**
	 * Get recommended module slugs for local development.
	 *
	 * @return array
	 */
	public static function get_recommended_modules() {
		return array(
			'contact-form',
			'blocks',
			'shortcodes',
			'tiled-gallery',
			'carousel',
			'widgets',
			'widget-visibility',
			'markdown',
			'copy-post',
			'sharedaddy',
			'sitemaps',
			'seo-tools',
		);
	}

	/**
	 * Get curated partial offline features.
	 *
	 * @return array
	 */
	public static function get_partial_features() {
		$module = Jetpack::get_module( 'subscriptions' );

		$features = array(
			'newsletter' => array(
				'slug'              => 'newsletter',
				'module'            => 'subscriptions',
				'name'              => __( 'Newsletter', 'jetpack' ),
				'description'       => $module['description'] ?? __( 'Grow your subscriber list and deliver your content directly to their email inbox.', 'jetpack' ),
				'type'              => self::TYPE_PARTIAL,
				'group'             => 'newsletter',
				'active'            => Jetpack::is_module_active( 'subscriptions' ),
				'available'         => true,
				'recommended'       => false,
				'toggleable'        => true,
				'limitation'        => __( 'Local editor, theme, and plugin integration can be enabled. Email delivery, subscriber sync, and WordPress.com-backed flows still require a connection.', 'jetpack' ),
				'underlying_module' => 'subscriptions',
				'documentation_url' => self::get_documentation_url( 'newsletter' ),
			),
		);

		if ( self::is_boost_available() ) {
			$features['boost'] = array(
				'slug'              => 'boost',
				'module'            => '',
				'name'              => __( 'Boost', 'jetpack' ),
				'description'       => __( 'Use Jetpack Boost performance tools that can run on a local site.', 'jetpack' ),
				'type'              => self::TYPE_PARTIAL,
				'group'             => 'boost',
				'active'            => true,
				'available'         => true,
				'recommended'       => false,
				'toggleable'        => false,
				'limitation'        => __( 'Image Guide, Concatenate CSS, Concatenate JS, Defer Non-Essential JavaScript, Page Cache, Speculation Rules, and manual Critical CSS generation can run locally. Speed scores, Image CDN, LCP analysis, Cloud CSS, and cloud-backed history require a publicly reachable site and/or WordPress.com services.', 'jetpack' ),
				'underlying_module' => '',
				'documentation_url' => self::get_documentation_url( 'boost' ),
			);
		}

		return $features;
	}

	/**
	 * Get local features that are loaded in Offline Mode without module toggles.
	 *
	 * @return array
	 */
	public static function get_always_available_features() {
		return array(
			'theme-tools' => array(
				'slug'              => 'theme-tools',
				'module'            => '',
				'name'              => __( 'Theme tools', 'jetpack' ),
				'description'       => __( 'Use Jetpack theme integrations that are loaded automatically for local development.', 'jetpack' ),
				'type'              => self::TYPE_ALWAYS_AVAILABLE,
				'group'             => 'design',
				'active'            => true,
				'available'         => true,
				'recommended'       => false,
				'toggleable'        => false,
				'limitation'        => __( 'Responsive videos, featured content, social menus, breadcrumbs, site logo tools, and content options are loaded automatically when Jetpack is in Offline Mode.', 'jetpack' ),
				'underlying_module' => '',
				'documentation_url' => self::get_documentation_url( 'theme-tools' ),
			),
		);
	}

	/**
	 * Get connection-required features for the informational section.
	 *
	 * @return array
	 */
	public static function get_requires_connection_features() {
		$features        = array();
		$partial_modules = wp_list_pluck( self::get_partial_features(), 'module' );

		foreach ( Jetpack::get_available_modules( false, false, true, null ) as $module_slug ) {
			if ( in_array( $module_slug, $partial_modules, true ) ) {
				continue;
			}

			$module = Jetpack::get_module( $module_slug );
			if ( ! $module ) {
				continue;
			}

			$module_name              = isset( $module['name'] ) && '' !== $module['name'] ? $module['name'] : self::get_module_name_fallback( $module_slug );
			$feature_name             = self::get_requires_connection_name( $module_slug, $module_name );
			$features[ $module_slug ] = array(
				'slug'              => $module_slug,
				'module'            => $module_slug,
				'name'              => $feature_name,
				'description'       => self::get_requires_connection_description( $module_slug, $module['description'] ?? $module_name ),
				'type'              => self::TYPE_REQUIRES_CONNECTION,
				'group'             => self::get_module_group( $module_slug ),
				'active'            => Jetpack::is_module_active( $module_slug ),
				'available'         => false,
				'recommended'       => false,
				'toggleable'        => false,
				'limitation'        => __( 'This feature requires a WordPress.com connection and is unavailable in Offline Mode.', 'jetpack' ),
				'underlying_module' => $module_slug,
				'documentation_url' => self::get_documentation_url( $module_slug ),
			);
		}

		foreach ( self::get_requires_connection_non_module_features() as $feature ) {
			$features[ $feature['slug'] ] = $feature;
		}

		uasort(
			$features,
			function ( $a, $b ) {
				return strcasecmp( $a['name'], $b['name'] );
			}
		);

		return array_values( $features );
	}

	/**
	 * Allow curated partial modules to activate and load in Offline Mode.
	 *
	 * @param bool   $allow        Whether the module is already allowed.
	 * @param string $module       Module slug.
	 * @param array  $_module_data Module metadata.
	 * @return bool
	 */
	public static function allow_partial_module_in_offline_mode( $allow, $module, $_module_data = array() ) {
		unset( $_module_data );

		if ( $allow ) {
			return true;
		}

		$partial_modules = wp_list_pluck( self::get_partial_features(), 'module' );
		return in_array( $module, $partial_modules, true );
	}

	/**
	 * Get dashboard groups.
	 *
	 * @return array
	 */
	public static function get_groups() {
		return array(
			'boost'              => __( 'Boost', 'jetpack' ),
			'protect'            => __( 'Protect', 'jetpack' ),
			'forms'              => __( 'Forms', 'jetpack' ),
			'newsletter'         => __( 'Newsletter', 'jetpack' ),
			'search'             => __( 'Search', 'jetpack' ),
			'social'             => __( 'Social', 'jetpack' ),
			'media'              => __( 'Media', 'jetpack' ),
			'writing'            => __( 'Writing', 'jetpack' ),
			'design'             => __( 'Design', 'jetpack' ),
			'vaultpress-backups' => __( 'VaultPress Backup', 'jetpack' ),
			'other'              => __( 'Other local features', 'jetpack' ),
		);
	}

	/**
	 * Check whether Jetpack Boost is active or loaded.
	 *
	 * @return bool
	 */
	private static function is_boost_available() {
		if ( defined( 'JETPACK_BOOST_VERSION' ) || class_exists( 'Automattic\Jetpack_Boost\Jetpack_Boost' ) ) {
			return true;
		}

		$boost_plugins = array(
			'boost/jetpack-boost.php',
			'jetpack-boost/jetpack-boost.php',
			'jetpack-boost-dev/jetpack-boost.php',
		);

		$active_plugins = (array) get_option( 'active_plugins', array() );
		if ( array_intersect( $boost_plugins, $active_plugins ) ) {
			return true;
		}

		$network_active_plugins = (array) get_site_option( 'active_sitewide_plugins', array() );
		foreach ( $boost_plugins as $boost_plugin ) {
			if ( isset( $network_active_plugins[ $boost_plugin ] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get fully offline module feature data.
	 *
	 * @return array
	 */
	private static function get_offline_module_features() {
		$features            = array();
		$recommended_modules = self::get_recommended_modules();
		$limited_modules     = self::get_limited_offline_modules();

		foreach ( Jetpack::get_available_modules( false, false, false, null ) as $module_slug ) {
			$module = Jetpack::get_module( $module_slug );
			if ( ! $module ) {
				continue;
			}

			$module_name = isset( $module['name'] ) && '' !== $module['name'] ? $module['name'] : self::get_module_name_fallback( $module_slug );
			$limitation  = $limited_modules[ $module_slug ] ?? '';

			$features[] = array(
				'slug'              => $module_slug,
				'module'            => $module_slug,
				'name'              => $module_name,
				'description'       => $module['description'] ?? $module_name,
				'type'              => $limitation ? self::TYPE_PARTIAL : self::TYPE_MODULE,
				'group'             => self::get_module_group( $module_slug ),
				'active'            => Jetpack::is_module_active( $module_slug ),
				'available'         => true,
				'recommended'       => in_array( $module_slug, $recommended_modules, true ),
				'toggleable'        => true,
				'limitation'        => $limitation,
				'underlying_module' => $module_slug,
				'documentation_url' => self::get_documentation_url( $module_slug ),
			);
		}

		return $features;
	}

	/**
	 * Get connection-free modules with mixed offline support.
	 *
	 * @return array
	 */
	private static function get_limited_offline_modules() {
		return array(
			'blocks'     => __( 'The Blocks module loads local editor support in Offline Mode. Blocks and editor tools that require WordPress.com services, such as AI, stats, likes, social publishing, payments, Instagram, and related content, remain unavailable.', 'jetpack' ),
			'shortcodes' => __( 'Most shortcode embeds can be tested locally. Instagram and Twitter oEmbed proxy helpers require a WordPress.com connection and are not loaded in Offline Mode.', 'jetpack' ),
			'widgets'    => __( 'Most Jetpack widgets can be tested locally. Widgets that depend on Stats, followers, community data, or WordPress.com APIs are unavailable in Offline Mode.', 'jetpack' ),
		);
	}

	/**
	 * Get connection-required non-module features.
	 *
	 * @return array
	 */
	private static function get_requires_connection_non_module_features() {
		return array(
			'activity-log' => self::get_requires_connection_feature(
				'activity-log',
				__( 'Activity Log', 'jetpack' ),
				__( 'Requires a WordPress.com connection to collect, sync, and display site activity history.', 'jetpack' ),
				'protect'
			),
			'jetpack-ai'   => self::get_requires_connection_feature(
				'jetpack-ai',
				__( 'Jetpack AI', 'jetpack' ),
				__( 'Requires a WordPress.com connection to generate, process, and manage AI content.', 'jetpack' ),
				'writing'
			),
			'payments'     => self::get_requires_connection_feature(
				'payments',
				__( 'Payments and paid content', 'jetpack' ),
				__( 'Requires a WordPress.com connection for payment accounts, paid plans, subscriber authentication, and checkout flows.', 'jetpack' ),
				'newsletter'
			),
			'scan'         => self::get_requires_connection_feature(
				'scan',
				__( 'Jetpack Scan', 'jetpack' ),
				__( 'Requires a WordPress.com connection to scan site files and receive security results.', 'jetpack' ),
				'protect'
			),
		);
	}

	/**
	 * Build a connection-required non-module feature entry.
	 *
	 * @param string $slug        Feature slug.
	 * @param string $name        Feature name.
	 * @param string $description Feature description.
	 * @param string $group       Feature group.
	 * @return array
	 */
	private static function get_requires_connection_feature( $slug, $name, $description, $group ) {
		return array(
			'slug'              => $slug,
			'module'            => '',
			'name'              => $name,
			'description'       => $description,
			'type'              => self::TYPE_REQUIRES_CONNECTION,
			'group'             => $group,
			'active'            => false,
			'available'         => false,
			'recommended'       => false,
			'toggleable'        => false,
			'limitation'        => __( 'This feature requires a WordPress.com connection and is unavailable in Offline Mode.', 'jetpack' ),
			'underlying_module' => '',
			'documentation_url' => self::get_documentation_url( $slug ),
		);
	}

	/**
	 * Get connection-required description for a module.
	 *
	 * @param string $module              Module slug.
	 * @param string $fallback_description Module description.
	 * @return string
	 */
	private static function get_requires_connection_description( $module, $fallback_description ) {
		$descriptions = array(
			'comments'              => __( 'Requires a WordPress.com connection for the enhanced Jetpack comment form and its WordPress.com API-backed flows.', 'jetpack' ),
			'comment-likes'         => __( 'Requires a WordPress.com connection so visitors can like individual comments.', 'jetpack' ),
			'json-api'              => __( 'Requires a WordPress.com connection to expose site data through the WordPress.com REST API.', 'jetpack' ),
			'monitor'               => __( 'Requires a WordPress.com connection to monitor uptime and send downtime alerts.', 'jetpack' ),
			'notes'                 => __( 'Requires a connected WordPress.com user to receive notifications across devices.', 'jetpack' ),
			'photon'                => __( 'Requires a WordPress.com connection to resize, optimize, and serve images through Jetpack Image CDN.', 'jetpack' ),
			'post-by-email'         => __( 'Requires a connected WordPress.com user to generate and use a private posting email address.', 'jetpack' ),
			'protect'               => __( 'Requires a WordPress.com connection to check login attempts against Jetpack protection services.', 'jetpack' ),
			'publicize'             => __( 'Requires a connected WordPress.com user and social accounts to publish posts to social networks.', 'jetpack' ),
			'related-posts'         => __( 'Requires a WordPress.com connection to index content and calculate related posts.', 'jetpack' ),
			'search'                => __( 'Requires a WordPress.com connection to index site content for Jetpack Search.', 'jetpack' ),
			'shortlinks'            => __( 'Requires a WordPress.com connection to create and resolve WP.me shortlinks.', 'jetpack' ),
			'sso'                   => __( 'Requires a connected WordPress.com user for WordPress.com Secure Sign On.', 'jetpack' ),
			'stats'                 => __( 'Requires a WordPress.com connection to collect and display site traffic data.', 'jetpack' ),
			'vaultpress'            => __( 'Requires a WordPress.com connection to store backups and manage restores.', 'jetpack' ),
			'videopress'            => __( 'Requires a WordPress.com connection to upload, process, host, and serve videos.', 'jetpack' ),
			'waf'                   => __( 'Requires a WordPress.com connection to manage Jetpack firewall rules and updates.', 'jetpack' ),
			'woocommerce-analytics' => __( 'Requires a WordPress.com connection to sync and display WooCommerce analytics data.', 'jetpack' ),
			'wordads'               => __( 'Requires a WordPress.com connection to configure ads, consent management, and revenue reporting.', 'jetpack' ),
		);

		return $descriptions[ $module ] ?? sprintf(
			/* translators: %s: Jetpack feature description. */
			__( '%s This feature requires a WordPress.com connection and is unavailable in Offline Mode.', 'jetpack' ),
			$fallback_description
		);
	}

	/**
	 * Get display name for a connection-required module.
	 *
	 * @param string $module        Module slug.
	 * @param string $fallback_name Module name.
	 * @return string
	 */
	private static function get_requires_connection_name( $module, $fallback_name ) {
		$names = array(
			'comments' => __( 'Jetpack Comments', 'jetpack' ),
		);

		return $names[ $module ] ?? $fallback_name;
	}

	/**
	 * Get the Jetpack Redirect URL for a feature's documentation.
	 *
	 * @param string $feature Feature or module slug.
	 * @return string
	 */
	private static function get_documentation_url( $feature ) {
		$redirect_sources = array(
			'blocks'               => 'jetpack-support-blocks',
			'boost'                => 'jetpack-support-boost',
			'canonical-urls'       => 'jetpack-support-canonical-urls',
			'carousel'             => 'jetpack-support-carousel',
			'contact-form'         => 'jetpack-support-contact-form',
			'copy-post'            => 'jetpack-support-copy-post',
			'custom-content-types' => 'jetpack-support-custom-content-types',
			'google-fonts'         => 'jetpack-support-google-fonts',
			'gravatar-hovercards'  => 'jetpack-support-gravatar-hovercards',
			'infinite-scroll'      => 'jetpack-support-infinite-scroll',
			'jetpack-ai'           => 'jetpack-ai',
			'latex'                => 'jetpack-support-beautiful-math-with-latex',
			'markdown'             => 'jetpack-support-markdown',
			'newsletter'           => 'https://jetpack.com/support/newsletter',
			'payments'             => 'jetpack-support-payments',
			'photon-cdn'           => 'jetpack-support-asset-cdn',
			'post-list'            => 'jetpack-support-post-list',
			'scan'                 => 'jetpack-support-scan',
			'sharedaddy'           => 'jetpack-support-sharing',
			'shortcodes'           => 'jetpack-support-shortcode-embeds',
			'seo-tools'            => 'jetpack-support-seo-tools',
			'sitemaps'             => 'jetpack-support-sitemaps',
			'theme-tools'          => 'jetpack-support-theme-tools',
			'tiled-gallery'        => 'jetpack-support-tiled-galleries',
			'verification-tools'   => 'jetpack-support-site-verification-tools',
			'widget-visibility'    => 'jetpack-support-widget-visibility',
			'widgets'              => 'jetpack-support-extra-sidebar-widgets',
			'wpcom-reader'         => 'jetpack-support-reader',
		);

		$source = $redirect_sources[ $feature ] ?? 'jetpack-support-' . $feature;
		return Redirect::get_url( $source );
	}

	/**
	 * Get a readable module name from a module slug.
	 *
	 * @param string $module Module slug.
	 * @return string
	 */
	private static function get_module_name_fallback( $module ) {
		return ucwords( str_replace( '-', ' ', $module ) );
	}

	/**
	 * Map module slugs to developer dashboard groups.
	 *
	 * @param string $module Module slug.
	 * @return string
	 */
	private static function get_module_group( $module ) {
		$groups = array(
			'protect'            => array( 'activity-log', 'monitor', 'protect', 'scan', 'sso', 'waf' ),
			'forms'              => array( 'contact-form' ),
			'newsletter'         => array( 'memberships', 'payments', 'subscriptions' ),
			'search'             => array( 'canonical-urls', 'related-posts', 'search', 'seo-tools', 'sitemaps', 'stats', 'verification-tools' ),
			'social'             => array( 'comment-likes', 'comments', 'gravatar-hovercards', 'publicize', 'sharedaddy', 'wordads', 'wpcom-reader' ),
			'media'              => array( 'carousel', 'photon', 'photon-cdn', 'tiled-gallery', 'videopress' ),
			'writing'            => array( 'blocks', 'copy-post', 'custom-content-types', 'jetpack-ai', 'latex', 'markdown', 'post-by-email', 'shortcodes' ),
			'design'             => array( 'google-fonts', 'infinite-scroll', 'post-list', 'theme-tools', 'widget-visibility', 'widgets' ),
			'vaultpress-backups' => array( 'vaultpress' ),
		);

		foreach ( $groups as $group => $modules ) {
			if ( in_array( $module, $modules, true ) ) {
				return $group;
			}
		}

		return 'other';
	}
}
